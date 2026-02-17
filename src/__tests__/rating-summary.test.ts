/**
 * hydrogen-reviews rating summary tests
 *
 * Tests for rating aggregation, average computation, distribution
 * histogram generation, and edge cases.
 */

import { describe, it, expect } from 'vitest';

import type { Review, RatingSummary, ReviewStatus, ReviewSource } from '../types.js';

// ---------------------------------------------------------------------------
// Aggregation helpers (pure logic that mirrors what a server or loader would do)
// ---------------------------------------------------------------------------

function computeDistribution(reviews: Pick<Review, 'rating'>[]): RatingSummary['distribution'] {
  const dist: RatingSummary['distribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const review of reviews) {
    const rating = review.rating as 1 | 2 | 3 | 4 | 5;
    if (rating >= 1 && rating <= 5 && Number.isInteger(rating)) {
      dist[rating]++;
    }
  }
  return dist;
}

function computeAverage(reviews: Pick<Review, 'rating'>[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 100) / 100; // round to 2 decimal places
}

function buildRatingSummary(productId: string, reviews: Pick<Review, 'rating'>[]): RatingSummary {
  return {
    productId,
    averageRating: computeAverage(reviews),
    totalReviews: reviews.length,
    distribution: computeDistribution(reviews),
  };
}

function getDistributionPercentages(distribution: RatingSummary['distribution'], total: number): Record<number, number> {
  if (total === 0) return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const result: Record<number, number> = {};
  for (const key of [1, 2, 3, 4, 5] as const) {
    result[key] = Math.round((distribution[key] / total) * 100);
  }
  return result;
}

function formatRating(rating: number): string {
  if (rating === 0) return '-';
  return rating.toFixed(1);
}

function getReviewCountLabel(count: number): string {
  return `${count} review${count === 1 ? '' : 's'}`;
}

// ---------------------------------------------------------------------------
// Test fixture helpers
// ---------------------------------------------------------------------------

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: overrides.id ?? 'review-1',
    productId: overrides.productId ?? 'prod-1',
    rating: overrides.rating ?? 5,
    body: overrides.body ?? 'Great product',
    authorName: overrides.authorName ?? 'Test User',
    status: overrides.status ?? ('approved' as ReviewStatus),
    source: overrides.source ?? ('widget' as ReviewSource),
    verifiedPurchase: overrides.verifiedPurchase ?? false,
    photoUrls: overrides.photoUrls ?? [],
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00Z',
    updatedAt: overrides.updatedAt ?? '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeReviewSet(ratings: number[]): Review[] {
  return ratings.map((rating, i) =>
    makeReview({ id: `review-${i}`, rating }),
  );
}

// ---------------------------------------------------------------------------
// computeDistribution
// ---------------------------------------------------------------------------

describe('computeDistribution', () => {
  it('counts reviews per rating level', () => {
    const reviews = makeReviewSet([5, 5, 4, 3, 3, 3, 2, 1]);
    const dist = computeDistribution(reviews);

    expect(dist).toEqual({ 1: 1, 2: 1, 3: 3, 4: 1, 5: 2 });
  });

  it('returns all zeros for empty array', () => {
    const dist = computeDistribution([]);
    expect(dist).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  });

  it('handles all reviews at same rating', () => {
    const reviews = makeReviewSet([4, 4, 4, 4]);
    const dist = computeDistribution(reviews);

    expect(dist).toEqual({ 1: 0, 2: 0, 3: 0, 4: 4, 5: 0 });
  });

  it('ignores out-of-range ratings', () => {
    const reviews = makeReviewSet([0, 6, -1, 3, 5]);
    const dist = computeDistribution(reviews);

    expect(dist[3]).toBe(1);
    expect(dist[5]).toBe(1);
    // Out-of-range ratings should not be counted
    expect(dist[1] + dist[2] + dist[3] + dist[4] + dist[5]).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// computeAverage
// ---------------------------------------------------------------------------

describe('computeAverage', () => {
  it('returns 0 for empty array', () => {
    expect(computeAverage([])).toBe(0);
  });

  it('computes correct average for uniform ratings', () => {
    const reviews = makeReviewSet([4, 4, 4]);
    expect(computeAverage(reviews)).toBe(4);
  });

  it('computes correct average for mixed ratings', () => {
    const reviews = makeReviewSet([5, 4, 3, 2, 1]);
    expect(computeAverage(reviews)).toBe(3);
  });

  it('rounds to 2 decimal places', () => {
    const reviews = makeReviewSet([5, 5, 4]);
    // (5+5+4)/3 = 4.666... -> 4.67
    expect(computeAverage(reviews)).toBe(4.67);
  });

  it('handles single review', () => {
    const reviews = makeReviewSet([3]);
    expect(computeAverage(reviews)).toBe(3);
  });

  it('handles all 5-star reviews', () => {
    const reviews = makeReviewSet([5, 5, 5, 5, 5]);
    expect(computeAverage(reviews)).toBe(5);
  });

  it('handles all 1-star reviews', () => {
    const reviews = makeReviewSet([1, 1, 1]);
    expect(computeAverage(reviews)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// buildRatingSummary
// ---------------------------------------------------------------------------

describe('buildRatingSummary', () => {
  it('builds complete summary object', () => {
    const reviews = makeReviewSet([5, 4, 4, 3, 2]);
    const summary = buildRatingSummary('prod-123', reviews);

    expect(summary.productId).toBe('prod-123');
    expect(summary.totalReviews).toBe(5);
    expect(summary.averageRating).toBe(3.6);
    expect(summary.distribution).toEqual({ 1: 0, 2: 1, 3: 1, 4: 2, 5: 1 });
  });

  it('builds empty summary for no reviews', () => {
    const summary = buildRatingSummary('prod-empty', []);

    expect(summary.productId).toBe('prod-empty');
    expect(summary.totalReviews).toBe(0);
    expect(summary.averageRating).toBe(0);
    expect(summary.distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  });
});

// ---------------------------------------------------------------------------
// getDistributionPercentages
// ---------------------------------------------------------------------------

describe('getDistributionPercentages', () => {
  it('computes correct percentages', () => {
    const dist: RatingSummary['distribution'] = { 1: 1, 2: 0, 3: 2, 4: 3, 5: 4 };
    const total = 10;
    const pcts = getDistributionPercentages(dist, total);

    expect(pcts[1]).toBe(10);
    expect(pcts[2]).toBe(0);
    expect(pcts[3]).toBe(20);
    expect(pcts[4]).toBe(30);
    expect(pcts[5]).toBe(40);
  });

  it('returns all zeros for zero total', () => {
    const dist: RatingSummary['distribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const pcts = getDistributionPercentages(dist, 0);

    for (const key of [1, 2, 3, 4, 5]) {
      expect(pcts[key]).toBe(0);
    }
  });

  it('rounds percentages to integers', () => {
    const dist: RatingSummary['distribution'] = { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0 };
    const total = 3;
    const pcts = getDistributionPercentages(dist, total);

    // 1/3 = 33.33... -> 33
    expect(pcts[1]).toBe(33);
    expect(pcts[2]).toBe(33);
    expect(pcts[3]).toBe(33);
  });
});

// ---------------------------------------------------------------------------
// formatRating
// ---------------------------------------------------------------------------

describe('formatRating', () => {
  it('returns dash for zero rating', () => {
    expect(formatRating(0)).toBe('-');
  });

  it('formats integer rating with one decimal', () => {
    expect(formatRating(4)).toBe('4.0');
  });

  it('formats decimal rating with one decimal', () => {
    expect(formatRating(4.67)).toBe('4.7');
  });

  it('formats perfect score', () => {
    expect(formatRating(5)).toBe('5.0');
  });

  it('formats minimum non-zero rating', () => {
    expect(formatRating(1)).toBe('1.0');
  });
});

// ---------------------------------------------------------------------------
// getReviewCountLabel
// ---------------------------------------------------------------------------

describe('getReviewCountLabel', () => {
  it('uses singular for one review', () => {
    expect(getReviewCountLabel(1)).toBe('1 review');
  });

  it('uses plural for zero reviews', () => {
    expect(getReviewCountLabel(0)).toBe('0 reviews');
  });

  it('uses plural for multiple reviews', () => {
    expect(getReviewCountLabel(42)).toBe('42 reviews');
  });

  it('uses plural for two reviews', () => {
    expect(getReviewCountLabel(2)).toBe('2 reviews');
  });
});
