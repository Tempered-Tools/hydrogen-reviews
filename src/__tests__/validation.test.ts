/**
 * hydrogen-reviews validation tests
 *
 * Tests for review submission validation logic: rating bounds,
 * required fields, email format, input sanitization.
 */

import { describe, it, expect } from 'vitest';

import type { ReviewSubmission } from '../types.js';

// ---------------------------------------------------------------------------
// Validation helpers (pure functions extracted for testing)
// These mirror the validation rules used in ReviewForm and the server API.
// ---------------------------------------------------------------------------

function isValidRating(rating: unknown): boolean {
  if (typeof rating !== 'number') return false;
  if (!Number.isFinite(rating)) return false;
  return rating >= 1 && rating <= 5 && Number.isInteger(rating);
}

function isValidEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length === 0) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function isValidBody(body: unknown): boolean {
  if (typeof body !== 'string') return false;
  const trimmed = body.trim();
  return trimmed.length > 0 && trimmed.length <= 5000;
}

function isValidAuthorName(name: unknown): boolean {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 100;
}

function isValidTitle(title: unknown): boolean {
  if (title === undefined || title === null) return true; // optional field
  if (typeof title !== 'string') return false;
  return title.trim().length <= 200;
}

function sanitizeReviewInput(input: string, maxLength = 5000): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, maxLength);
}

function isValidReviewSubmission(
  submission: Partial<ReviewSubmission>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!submission.productId || typeof submission.productId !== 'string') {
    errors.push('productId is required');
  }
  if (!isValidRating(submission.rating)) {
    errors.push('rating must be an integer between 1 and 5');
  }
  if (!isValidBody(submission.body)) {
    errors.push('body is required and must not exceed 5000 characters');
  }
  if (!isValidAuthorName(submission.authorName)) {
    errors.push('authorName is required and must not exceed 100 characters');
  }
  if (submission.authorEmail !== undefined && !isValidEmail(submission.authorEmail)) {
    errors.push('authorEmail must be a valid email address');
  }
  if (!isValidTitle(submission.title)) {
    errors.push('title must not exceed 200 characters');
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// isValidRating
// ---------------------------------------------------------------------------

describe('isValidRating', () => {
  it('accepts integer ratings 1 through 5', () => {
    for (let i = 1; i <= 5; i++) {
      expect(isValidRating(i)).toBe(true);
    }
  });

  it('rejects zero', () => {
    expect(isValidRating(0)).toBe(false);
  });

  it('rejects negative numbers', () => {
    expect(isValidRating(-1)).toBe(false);
  });

  it('rejects numbers above 5', () => {
    expect(isValidRating(6)).toBe(false);
  });

  it('rejects decimal ratings', () => {
    expect(isValidRating(4.5)).toBe(false);
    expect(isValidRating(3.7)).toBe(false);
  });

  it('rejects NaN and Infinity', () => {
    expect(isValidRating(NaN)).toBe(false);
    expect(isValidRating(Infinity)).toBe(false);
    expect(isValidRating(-Infinity)).toBe(false);
  });

  it('rejects non-number types', () => {
    expect(isValidRating('5')).toBe(false);
    expect(isValidRating(null)).toBe(false);
    expect(isValidRating(undefined)).toBe(false);
    expect(isValidRating(true)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isValidEmail
// ---------------------------------------------------------------------------

describe('isValidEmail', () => {
  it('accepts standard email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('user+tag@domain.co')).toBe(true);
    expect(isValidEmail('first.last@domain.org')).toBe(true);
  });

  it('trims whitespace before validation', () => {
    expect(isValidEmail('  user@example.com  ')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('rejects missing @ symbol', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('rejects missing domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('rejects missing local part', () => {
    expect(isValidEmail('@example.com')).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(123)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isValidBody
// ---------------------------------------------------------------------------

describe('isValidBody', () => {
  it('accepts non-empty text', () => {
    expect(isValidBody('Great product!')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidBody('')).toBe(false);
  });

  it('rejects whitespace-only string', () => {
    expect(isValidBody('   ')).toBe(false);
  });

  it('rejects text exceeding 5000 characters', () => {
    expect(isValidBody('a'.repeat(5001))).toBe(false);
  });

  it('accepts text at exactly 5000 characters', () => {
    expect(isValidBody('a'.repeat(5000))).toBe(true);
  });

  it('rejects non-string input', () => {
    expect(isValidBody(null)).toBe(false);
    expect(isValidBody(undefined)).toBe(false);
    expect(isValidBody(123)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isValidAuthorName
// ---------------------------------------------------------------------------

describe('isValidAuthorName', () => {
  it('accepts regular names', () => {
    expect(isValidAuthorName('John Doe')).toBe(true);
    expect(isValidAuthorName('A')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidAuthorName('')).toBe(false);
  });

  it('rejects whitespace-only string', () => {
    expect(isValidAuthorName('   ')).toBe(false);
  });

  it('rejects names exceeding 100 characters', () => {
    expect(isValidAuthorName('a'.repeat(101))).toBe(false);
  });

  it('accepts name at exactly 100 characters', () => {
    expect(isValidAuthorName('a'.repeat(100))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isValidTitle
// ---------------------------------------------------------------------------

describe('isValidTitle', () => {
  it('accepts undefined (optional field)', () => {
    expect(isValidTitle(undefined)).toBe(true);
  });

  it('accepts null (optional field)', () => {
    expect(isValidTitle(null)).toBe(true);
  });

  it('accepts empty string', () => {
    expect(isValidTitle('')).toBe(true);
  });

  it('accepts a normal title', () => {
    expect(isValidTitle('Great product')).toBe(true);
  });

  it('rejects titles exceeding 200 characters', () => {
    expect(isValidTitle('a'.repeat(201))).toBe(false);
  });

  it('accepts title at exactly 200 characters', () => {
    expect(isValidTitle('a'.repeat(200))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// sanitizeReviewInput
// ---------------------------------------------------------------------------

describe('sanitizeReviewInput', () => {
  it('trims whitespace', () => {
    expect(sanitizeReviewInput('  hello  ')).toBe('hello');
  });

  it('strips angle brackets', () => {
    expect(sanitizeReviewInput('<script>alert("xss")</script>')).toBe(
      'scriptalert("xss")/script',
    );
  });

  it('truncates to default max length (5000)', () => {
    const long = 'a'.repeat(6000);
    expect(sanitizeReviewInput(long)).toHaveLength(5000);
  });

  it('truncates to custom max length', () => {
    const long = 'a'.repeat(300);
    expect(sanitizeReviewInput(long, 100)).toHaveLength(100);
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeReviewInput(null as unknown as string)).toBe('');
    expect(sanitizeReviewInput(undefined as unknown as string)).toBe('');
    expect(sanitizeReviewInput(123 as unknown as string)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// isValidReviewSubmission (full submission validation)
// ---------------------------------------------------------------------------

describe('isValidReviewSubmission', () => {
  const validSubmission: ReviewSubmission = {
    productId: 'gid://shopify/Product/123456789',
    rating: 5,
    body: 'Excellent product, works exactly as described.',
    authorName: 'Jane Doe',
  };

  it('accepts a valid complete submission', () => {
    const result = isValidReviewSubmission(validSubmission);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts a submission with optional email', () => {
    const result = isValidReviewSubmission({
      ...validSubmission,
      authorEmail: 'jane@example.com',
    });
    expect(result.valid).toBe(true);
  });

  it('accepts a submission with optional title', () => {
    const result = isValidReviewSubmission({
      ...validSubmission,
      title: 'Solid build quality',
    });
    expect(result.valid).toBe(true);
  });

  it('rejects submission missing productId', () => {
    const result = isValidReviewSubmission({
      ...validSubmission,
      productId: undefined as unknown as string,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('productId is required');
  });

  it('rejects submission with invalid rating', () => {
    const result = isValidReviewSubmission({ ...validSubmission, rating: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('rating must be an integer between 1 and 5');
  });

  it('rejects submission missing body', () => {
    const result = isValidReviewSubmission({
      ...validSubmission,
      body: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'body is required and must not exceed 5000 characters',
    );
  });

  it('rejects submission missing authorName', () => {
    const result = isValidReviewSubmission({
      ...validSubmission,
      authorName: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'authorName is required and must not exceed 100 characters',
    );
  });

  it('rejects submission with invalid email when provided', () => {
    const result = isValidReviewSubmission({
      ...validSubmission,
      authorEmail: 'not-an-email',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('authorEmail must be a valid email address');
  });

  it('collects multiple errors', () => {
    const result = isValidReviewSubmission({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});
