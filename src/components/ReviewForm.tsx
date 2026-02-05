/**
 * ReviewForm
 *
 * Form for submitting product reviews.
 */

import { useState, useCallback } from 'react';

import { useReviewConfig } from './ReviewProvider.js';
import { StarRating } from './StarRating.js';

import type { ReviewSubmission } from '../types.js';
import type { CSSProperties, FormEvent, ReactNode } from 'react';

export interface ReviewFormProps {
  /**
   * Product ID to submit review for
   */
  productId: string;

  /**
   * Enable photo uploads
   */
  enablePhotos?: boolean;

  /**
   * Maximum number of photos (default: 5)
   */
  maxPhotos?: number;

  /**
   * Callback after successful submission
   */
  onSuccess?: (reviewId: string) => void;

  /**
   * Callback on submission error
   */
  onError?: (error: Error) => void;

  /**
   * Custom submit button render
   */
  renderSubmitButton?: (props: { isSubmitting: boolean; disabled: boolean }) => ReactNode;

  /**
   * Additional CSS class
   */
  className?: string;

  /**
   * Additional inline styles
   */
  style?: CSSProperties;
}

/**
 * Review submission form component.
 *
 * @example
 * ```tsx
 * <ReviewForm
 *   productId={product.id}
 *   enablePhotos
 *   onSuccess={(reviewId) => {
 *     console.log('Review submitted:', reviewId);
 *   }}
 * />
 * ```
 */
export function ReviewForm({
  productId,
  enablePhotos = false,
  maxPhotos = 5,
  onSuccess,
  onError,
  renderSubmitButton,
  className = '',
  style,
}: ReviewFormProps) {
  const config = useReviewConfig();

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePhotoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      setPhotos((prev) => [...prev, ...files].slice(0, maxPhotos));
    },
    [maxPhotos],
  );

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const submission = {
        productId,
        shop: config.shopDomain,
        rating,
        ...(title && { title }),
        body,
        authorName,
        ...(authorEmail && { authorEmail }),
        ...(enablePhotos && photos.length > 0 && { photos }),
      } satisfies ReviewSubmission & { shop: string };

      const response = await fetch(`${config.apiUrl}/api/v1/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
        },
        body: JSON.stringify(submission),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit review');
      }

      const data = await response.json();
      setSuccess(true);
      setRating(0);
      setTitle('');
      setBody('');
      setAuthorName('');
      setAuthorEmail('');
      setPhotos([]);

      onSuccess?.(data.reviewId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error.message);
      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #ccc',
    borderRadius: 4,
    font: 'inherit',
  };

  const labelStyle: CSSProperties = {
    display: 'block',
    fontWeight: 500,
    marginBottom: '0.25rem',
  };

  const groupStyle: CSSProperties = {
    marginBottom: '1rem',
  };

  if (success) {
    return (
      <div
        className={className}
        style={{ textAlign: 'center', padding: '2rem', ...style }}
      >
        <h3 style={{ marginBottom: '0.5rem' }}>Thank you for your review!</h3>
        <p style={{ color: '#666' }}>
          Your review has been submitted and is pending moderation.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            background: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Write another review
        </button>
      </div>
    );
  }

  const isValid = rating > 0 && body.trim().length > 0 && authorName.trim().length > 0;

  return (
    <form
      className={className}
      style={style}
      onSubmit={handleSubmit}
    >
      {error && (
        <div
          style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            background: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: 4,
            color: '#dc2626',
          }}
        >
          {error}
        </div>
      )}

      <div style={groupStyle}>
        <label style={labelStyle}>Your rating *</label>
        <StarRating
          rating={rating}
          interactive
          onChange={setRating}
          size={32}
        />
      </div>

      <div style={groupStyle}>
        <label style={labelStyle} htmlFor="review-title">
          Review title
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          style={inputStyle}
        />
      </div>

      <div style={groupStyle}>
        <label style={labelStyle} htmlFor="review-body">
          Your review *
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Tell others about your experience with this product"
          required
          style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
        />
      </div>

      <div style={groupStyle}>
        <label style={labelStyle} htmlFor="review-name">
          Your name *
        </label>
        <input
          id="review-name"
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Enter your name"
          required
          style={inputStyle}
        />
      </div>

      <div style={groupStyle}>
        <label style={labelStyle} htmlFor="review-email">
          Email
        </label>
        <input
          id="review-email"
          type="email"
          value={authorEmail}
          onChange={(e) => setAuthorEmail(e.target.value)}
          placeholder="your@email.com"
          style={inputStyle}
        />
      </div>

      {enablePhotos && (
        <div style={groupStyle}>
          <label style={labelStyle}>Add photos</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
            disabled={photos.length >= maxPhotos}
          />
          {photos.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              {photos.map((photo, index) => (
                <div key={index} style={{ position: 'relative' }}>
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Photo ${index + 1}`}
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: 'none',
                      background: '#ef4444',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 12,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
            {photos.length} of {maxPhotos} photos
          </p>
        </div>
      )}

      {renderSubmitButton ? (
        renderSubmitButton({ isSubmitting, disabled: !isValid || isSubmitting })
      ) : (
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: isValid && !isSubmitting ? 'pointer' : 'not-allowed',
            opacity: isValid && !isSubmitting ? 1 : 0.5,
            font: 'inherit',
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit review'}
        </button>
      )}
    </form>
  );
}
