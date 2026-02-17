/**
 * hydrogen-reviews server utility tests
 *
 * Tests for server-side fetch functions: fetchReviews, fetchRatingSummary,
 * fetchBatchRatings -- argument validation, URL construction, error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { fetchReviews, fetchRatingSummary, fetchBatchRatings } from '../server.js';

import type { ReviewsResponse, RatingSummary } from '../types.js';

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockJsonResponse<T>(data: T, status = 200, statusText = 'OK') {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: () => Promise.resolve(data),
  };
}

const sampleReviewsResponse: ReviewsResponse = {
  reviews: [
    {
      id: 'rev-1',
      productId: 'prod-1',
      rating: 5,
      body: 'Excellent product',
      authorName: 'Alice',
      status: 'approved',
      source: 'widget',
      verifiedPurchase: true,
      photoUrls: [],
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
    },
  ],
  total: 1,
  page: 1,
  limit: 10,
  totalPages: 1,
  averageRating: 5,
};

const sampleRatingSummary: RatingSummary = {
  productId: 'prod-1',
  averageRating: 4.5,
  totalReviews: 20,
  distribution: { 1: 1, 2: 1, 3: 2, 4: 6, 5: 10 },
};

// ---------------------------------------------------------------------------
// fetchReviews
// ---------------------------------------------------------------------------

describe('fetchReviews', () => {
  it('throws when neither apiKey nor shopDomain is provided', async () => {
    await expect(
      fetchReviews({ apiUrl: 'https://api.example.com', productId: 'prod-1' }),
    ).rejects.toThrow('Either apiKey or shopDomain is required');
  });

  it('calls fetch with correct URL and Bearer auth header', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse(sampleReviewsResponse));

    await fetchReviews({
      apiUrl: 'https://api.example.com',
      apiKey: 'test-key',
      productId: 'prod-1',
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('https://api.example.com/api/v1/reviews?');
    expect(url).toContain('productId=prod-1');
    expect(options.headers).toEqual({ Authorization: 'Bearer test-key' });
  });

  it('omits Authorization header when no apiKey', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse(sampleReviewsResponse));

    await fetchReviews({
      apiUrl: 'https://api.example.com',
      shopDomain: 'test.myshopify.com',
      productId: 'prod-1',
    });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers).toEqual({});
  });

  it('applies default page=1, limit=10, sort=newest', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse(sampleReviewsResponse));

    await fetchReviews({
      apiUrl: 'https://api.example.com',
      shopDomain: 'test.myshopify.com',
      productId: 'prod-1',
    });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('page=1');
    expect(url).toContain('limit=10');
    expect(url).toContain('sort=newest');
  });

  it('uses provided page, limit, and sort', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse(sampleReviewsResponse));

    await fetchReviews({
      apiUrl: 'https://api.example.com',
      shopDomain: 'test.myshopify.com',
      productId: 'prod-1',
      page: 3,
      limit: 25,
      sort: 'highest',
    });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('page=3');
    expect(url).toContain('limit=25');
    expect(url).toContain('sort=highest');
  });

  it('includes shop domain as query param', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse(sampleReviewsResponse));

    await fetchReviews({
      apiUrl: 'https://api.example.com',
      shopDomain: 'my-store.myshopify.com',
      productId: 'prod-1',
    });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('shop=my-store.myshopify.com');
  });

  it('includes filter params when provided', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse(sampleReviewsResponse));

    await fetchReviews({
      apiUrl: 'https://api.example.com',
      shopDomain: 'test.myshopify.com',
      productId: 'prod-1',
      filters: { rating: 4, verifiedOnly: true, withPhotos: true },
    });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('rating=4');
    expect(url).toContain('verifiedOnly=true');
    expect(url).toContain('withPhotos=true');
  });

  it('returns parsed JSON on success', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse(sampleReviewsResponse));

    const result = await fetchReviews({
      apiUrl: 'https://api.example.com',
      apiKey: 'key',
      productId: 'prod-1',
    });

    expect(result.reviews).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.averageRating).toBe(5);
  });

  it('throws on non-OK response', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse(null, 500, 'Internal Server Error'));

    await expect(
      fetchReviews({
        apiUrl: 'https://api.example.com',
        apiKey: 'key',
        productId: 'prod-1',
      }),
    ).rejects.toThrow('Failed to fetch reviews: Internal Server Error');
  });

  it('throws on 404 response', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse(null, 404, 'Not Found'));

    await expect(
      fetchReviews({
        apiUrl: 'https://api.example.com',
        apiKey: 'key',
        productId: 'prod-1',
      }),
    ).rejects.toThrow('Failed to fetch reviews: Not Found');
  });
});

// ---------------------------------------------------------------------------
// fetchRatingSummary
// ---------------------------------------------------------------------------

describe('fetchRatingSummary', () => {
  it('throws when neither apiKey nor shopDomain is provided', async () => {
    await expect(
      fetchRatingSummary({ apiUrl: 'https://api.example.com', productId: 'prod-1' }),
    ).rejects.toThrow('Either apiKey or shopDomain is required');
  });

  it('calls fetch with correct URL for single product', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse(sampleRatingSummary));

    await fetchRatingSummary({
      apiUrl: 'https://api.example.com',
      shopDomain: 'test.myshopify.com',
      productId: 'prod-1',
    });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/v1/ratings?');
    expect(url).toContain('productId=prod-1');
    expect(url).toContain('shop=test.myshopify.com');
  });

  it('includes Authorization header when apiKey is provided', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse(sampleRatingSummary));

    await fetchRatingSummary({
      apiUrl: 'https://api.example.com',
      apiKey: 'secret-key',
      productId: 'prod-1',
    });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers).toEqual({ Authorization: 'Bearer secret-key' });
  });

  it('returns parsed rating summary', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse(sampleRatingSummary));

    const result = await fetchRatingSummary({
      apiUrl: 'https://api.example.com',
      apiKey: 'key',
      productId: 'prod-1',
    });

    expect(result.productId).toBe('prod-1');
    expect(result.averageRating).toBe(4.5);
    expect(result.totalReviews).toBe(20);
    expect(result.distribution[5]).toBe(10);
  });

  it('throws on non-OK response', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse(null, 503, 'Service Unavailable'));

    await expect(
      fetchRatingSummary({
        apiUrl: 'https://api.example.com',
        apiKey: 'key',
        productId: 'prod-1',
      }),
    ).rejects.toThrow('Failed to fetch rating summary: Service Unavailable');
  });
});

// ---------------------------------------------------------------------------
// fetchBatchRatings
// ---------------------------------------------------------------------------

describe('fetchBatchRatings', () => {
  const batchResponse: Record<string, RatingSummary> = {
    'prod-1': sampleRatingSummary,
    'prod-2': { ...sampleRatingSummary, productId: 'prod-2', averageRating: 3.8 },
  };

  it('throws when neither apiKey nor shopDomain is provided', async () => {
    await expect(
      fetchBatchRatings({
        apiUrl: 'https://api.example.com',
        productIds: ['prod-1'],
      }),
    ).rejects.toThrow('Either apiKey or shopDomain is required');
  });

  it('sends comma-separated productIds in query', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse(batchResponse));

    await fetchBatchRatings({
      apiUrl: 'https://api.example.com',
      shopDomain: 'test.myshopify.com',
      productIds: ['prod-1', 'prod-2'],
    });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/v1/ratings?');
    // URLSearchParams encodes commas
    expect(url).toMatch(/productIds=prod-1.*prod-2/);
  });

  it('includes shop domain in query', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse(batchResponse));

    await fetchBatchRatings({
      apiUrl: 'https://api.example.com',
      shopDomain: 'test.myshopify.com',
      productIds: ['prod-1'],
    });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('shop=test.myshopify.com');
  });

  it('returns parsed response keyed by productId', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse(batchResponse));

    const result = await fetchBatchRatings({
      apiUrl: 'https://api.example.com',
      apiKey: 'key',
      productIds: ['prod-1', 'prod-2'],
    });

    expect(result['prod-1'].averageRating).toBe(4.5);
    expect(result['prod-2'].averageRating).toBe(3.8);
  });

  it('throws on non-OK response', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse(null, 429, 'Too Many Requests'));

    await expect(
      fetchBatchRatings({
        apiUrl: 'https://api.example.com',
        apiKey: 'key',
        productIds: ['prod-1'],
      }),
    ).rejects.toThrow('Failed to fetch batch ratings: Too Many Requests');
  });

  it('sets Authorization header when apiKey is provided', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse(batchResponse));

    await fetchBatchRatings({
      apiUrl: 'https://api.example.com',
      apiKey: 'batch-key',
      productIds: ['prod-1'],
    });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers).toEqual({ Authorization: 'Bearer batch-key' });
  });
});
