/**
 * hydrogen-reviews API client tests
 *
 * Tests for URL construction, request formatting, header assembly,
 * and query parameter building for the LiteReviews API.
 */

import { describe, it, expect } from 'vitest';

import type {
  LiteReviewsConfig,
  FetchReviewsOptions,
  ReviewSortOption,
  ReviewFilters,
} from '../types.js';

// ---------------------------------------------------------------------------
// Helpers extracted from the client-side and server-side fetch logic.
// These replicate the URL/param construction used in useReviews, ReviewWidget,
// and server.ts so we can test the logic without React or global fetch.
// ---------------------------------------------------------------------------

function buildReviewsUrl(
  config: LiteReviewsConfig,
  options: FetchReviewsOptions,
): string {
  const params = new URLSearchParams({
    productId: options.productId,
    page: (options.page ?? 1).toString(),
    limit: (options.limit ?? 10).toString(),
    sort: options.sort ?? 'newest',
    shop: config.shopDomain,
  });

  if (options.filters?.rating) {
    params.set('rating', options.filters.rating.toString());
  }
  if (options.filters?.verifiedOnly) {
    params.set('verifiedOnly', 'true');
  }
  if (options.filters?.withPhotos) {
    params.set('withPhotos', 'true');
  }

  return `${config.apiUrl}/api/v1/reviews?${params}`;
}

function buildRatingSummaryUrl(
  config: LiteReviewsConfig,
  productId: string,
): string {
  return `${config.apiUrl}/api/v1/ratings?productId=${encodeURIComponent(productId)}&shop=${encodeURIComponent(config.shopDomain)}`;
}

function buildBatchRatingsUrl(
  config: LiteReviewsConfig,
  productIds: string[],
): string {
  const params = new URLSearchParams({
    productIds: productIds.join(','),
  });
  if (config.shopDomain) {
    params.set('shop', config.shopDomain);
  }
  return `${config.apiUrl}/api/v1/ratings?${params}`;
}

function buildAuthHeaders(apiKey?: string): Record<string, string> {
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
}

function buildSubmissionPayload(
  config: LiteReviewsConfig,
  productId: string,
  data: { rating: number; body: string; authorName: string; title?: string; authorEmail?: string },
) {
  return {
    productId,
    shop: config.shopDomain,
    rating: data.rating,
    ...(data.title && { title: data.title }),
    body: data.body,
    authorName: data.authorName,
    ...(data.authorEmail && { authorEmail: data.authorEmail }),
  };
}

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const baseConfig: LiteReviewsConfig = {
  apiUrl: 'https://litereviews.temperedtools.xyz',
  shopDomain: 'test-store.myshopify.com',
};

const configWithKey: LiteReviewsConfig = {
  ...baseConfig,
  apiKey: 'lr_test_key_abc123',
};

// ---------------------------------------------------------------------------
// buildReviewsUrl
// ---------------------------------------------------------------------------

describe('buildReviewsUrl', () => {
  it('constructs URL with required params only', () => {
    const url = buildReviewsUrl(baseConfig, {
      productId: 'gid://shopify/Product/123',
    });

    expect(url).toContain('/api/v1/reviews?');
    expect(url).toContain('productId=gid');
    expect(url).toContain('page=1');
    expect(url).toContain('limit=10');
    expect(url).toContain('sort=newest');
    expect(url).toContain('shop=test-store.myshopify.com');
  });

  it('uses provided page and limit', () => {
    const url = buildReviewsUrl(baseConfig, {
      productId: 'prod-1',
      page: 3,
      limit: 20,
    });

    expect(url).toContain('page=3');
    expect(url).toContain('limit=20');
  });

  it('applies sort option', () => {
    const sortOptions: ReviewSortOption[] = ['newest', 'oldest', 'highest', 'lowest'];
    for (const sort of sortOptions) {
      const url = buildReviewsUrl(baseConfig, {
        productId: 'prod-1',
        sort,
      });
      expect(url).toContain(`sort=${sort}`);
    }
  });

  it('adds rating filter when specified', () => {
    const url = buildReviewsUrl(baseConfig, {
      productId: 'prod-1',
      filters: { rating: 5 },
    });

    expect(url).toContain('rating=5');
  });

  it('adds verifiedOnly filter when true', () => {
    const url = buildReviewsUrl(baseConfig, {
      productId: 'prod-1',
      filters: { verifiedOnly: true },
    });

    expect(url).toContain('verifiedOnly=true');
  });

  it('does not add verifiedOnly filter when false or undefined', () => {
    const url1 = buildReviewsUrl(baseConfig, {
      productId: 'prod-1',
      filters: { verifiedOnly: false },
    });
    const url2 = buildReviewsUrl(baseConfig, {
      productId: 'prod-1',
      filters: {},
    });

    expect(url1).not.toContain('verifiedOnly');
    expect(url2).not.toContain('verifiedOnly');
  });

  it('adds withPhotos filter when true', () => {
    const url = buildReviewsUrl(baseConfig, {
      productId: 'prod-1',
      filters: { withPhotos: true },
    });

    expect(url).toContain('withPhotos=true');
  });

  it('combines multiple filters', () => {
    const url = buildReviewsUrl(baseConfig, {
      productId: 'prod-1',
      filters: { rating: 4, verifiedOnly: true, withPhotos: true },
    });

    expect(url).toContain('rating=4');
    expect(url).toContain('verifiedOnly=true');
    expect(url).toContain('withPhotos=true');
  });

  it('starts with the configured API base URL', () => {
    const url = buildReviewsUrl(baseConfig, { productId: 'prod-1' });
    expect(url).toMatch(/^https:\/\/litereviews\.temperedtools\.xyz\/api\/v1\/reviews\?/);
  });
});

// ---------------------------------------------------------------------------
// buildRatingSummaryUrl
// ---------------------------------------------------------------------------

describe('buildRatingSummaryUrl', () => {
  it('constructs correct URL with productId and shop', () => {
    const url = buildRatingSummaryUrl(baseConfig, 'gid://shopify/Product/456');
    expect(url).toContain('/api/v1/ratings?');
    expect(url).toContain('productId=gid%3A%2F%2Fshopify%2FProduct%2F456');
    expect(url).toContain('shop=test-store.myshopify.com');
  });

  it('encodes special characters in productId', () => {
    const url = buildRatingSummaryUrl(baseConfig, 'product/with spaces');
    expect(url).toContain('productId=product%2Fwith%20spaces');
  });
});

// ---------------------------------------------------------------------------
// buildBatchRatingsUrl
// ---------------------------------------------------------------------------

describe('buildBatchRatingsUrl', () => {
  it('joins multiple product IDs with commas', () => {
    const url = buildBatchRatingsUrl(baseConfig, ['prod-1', 'prod-2', 'prod-3']);
    expect(url).toContain('/api/v1/ratings?');
    expect(url).toContain('productIds=prod-1%2Cprod-2%2Cprod-3');
  });

  it('includes shop domain', () => {
    const url = buildBatchRatingsUrl(baseConfig, ['prod-1']);
    expect(url).toContain('shop=test-store.myshopify.com');
  });

  it('handles single product ID', () => {
    const url = buildBatchRatingsUrl(baseConfig, ['prod-single']);
    expect(url).toContain('productIds=prod-single');
  });

  it('handles empty array', () => {
    const url = buildBatchRatingsUrl(baseConfig, []);
    expect(url).toContain('productIds=');
  });
});

// ---------------------------------------------------------------------------
// buildAuthHeaders
// ---------------------------------------------------------------------------

describe('buildAuthHeaders', () => {
  it('returns Authorization header when API key is provided', () => {
    const headers = buildAuthHeaders('lr_test_key_abc123');
    expect(headers).toEqual({ Authorization: 'Bearer lr_test_key_abc123' });
  });

  it('returns empty object when no API key', () => {
    const headers = buildAuthHeaders(undefined);
    expect(headers).toEqual({});
  });

  it('returns empty object for empty string key', () => {
    const headers = buildAuthHeaders('');
    expect(headers).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// buildSubmissionPayload
// ---------------------------------------------------------------------------

describe('buildSubmissionPayload', () => {
  it('builds payload with required fields', () => {
    const payload = buildSubmissionPayload(baseConfig, 'prod-1', {
      rating: 5,
      body: 'Great product',
      authorName: 'John',
    });

    expect(payload).toEqual({
      productId: 'prod-1',
      shop: 'test-store.myshopify.com',
      rating: 5,
      body: 'Great product',
      authorName: 'John',
    });
  });

  it('includes title when provided', () => {
    const payload = buildSubmissionPayload(baseConfig, 'prod-1', {
      rating: 4,
      body: 'Nice',
      authorName: 'Jane',
      title: 'Good stuff',
    });

    expect(payload.title).toBe('Good stuff');
  });

  it('excludes title when empty string', () => {
    const payload = buildSubmissionPayload(baseConfig, 'prod-1', {
      rating: 4,
      body: 'Nice',
      authorName: 'Jane',
      title: '',
    });

    expect(payload).not.toHaveProperty('title');
  });

  it('includes authorEmail when provided', () => {
    const payload = buildSubmissionPayload(baseConfig, 'prod-1', {
      rating: 3,
      body: 'OK product',
      authorName: 'Bob',
      authorEmail: 'bob@example.com',
    });

    expect(payload.authorEmail).toBe('bob@example.com');
  });

  it('excludes authorEmail when empty string', () => {
    const payload = buildSubmissionPayload(baseConfig, 'prod-1', {
      rating: 3,
      body: 'OK product',
      authorName: 'Bob',
      authorEmail: '',
    });

    expect(payload).not.toHaveProperty('authorEmail');
  });

  it('always includes shopDomain from config', () => {
    const payload = buildSubmissionPayload(configWithKey, 'prod-1', {
      rating: 5,
      body: 'Excellent',
      authorName: 'Alice',
    });

    expect(payload.shop).toBe('test-store.myshopify.com');
  });
});
