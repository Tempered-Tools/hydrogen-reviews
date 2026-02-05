/**
 * StarRating
 *
 * Displays a star rating (1-5 stars).
 * Can be used for display or input.
 */

import type { CSSProperties } from 'react';

export interface StarRatingProps {
  /**
   * Current rating value (1-5)
   */
  rating: number;

  /**
   * Maximum rating (default: 5)
   */
  max?: number;

  /**
   * Size of stars in pixels (default: 20)
   */
  size?: number;

  /**
   * Color of filled stars (default: '#FFB800')
   */
  filledColor?: string;

  /**
   * Color of empty stars (default: '#E5E5E5')
   */
  emptyColor?: string;

  /**
   * Show half stars for decimal ratings
   */
  showHalfStars?: boolean;

  /**
   * Enable interactive mode (rating selection)
   */
  interactive?: boolean;

  /**
   * Callback when rating changes (interactive mode only)
   */
  onChange?: (rating: number) => void;

  /**
   * Additional CSS class
   */
  className?: string;

  /**
   * Additional inline styles
   */
  style?: CSSProperties;

  /**
   * Accessible label (default: "{rating} out of {max} stars")
   */
  ariaLabel?: string;
}

const StarPath =
  'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

/**
 * Star rating display component.
 *
 * @example
 * ```tsx
 * // Display mode
 * <StarRating rating={4.5} showHalfStars />
 *
 * // Interactive mode
 * <StarRating
 *   rating={selectedRating}
 *   interactive
 *   onChange={setSelectedRating}
 * />
 * ```
 */
export function StarRating({
  rating,
  max = 5,
  size = 20,
  filledColor = '#FFB800',
  emptyColor = '#E5E5E5',
  showHalfStars = false,
  interactive = false,
  onChange,
  className = '',
  style,
  ariaLabel,
}: StarRatingProps) {
  const handleClick = (starIndex: number) => {
    if (interactive && onChange) {
      onChange(starIndex);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, starIndex: number) => {
    if (interactive && onChange && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onChange(starIndex);
    }
  };

  const stars = [];
  for (let i = 1; i <= max; i++) {
    const isFilled = i <= Math.floor(rating);
    const isHalf = showHalfStars && !isFilled && i === Math.ceil(rating) && rating % 1 >= 0.25;
    const isEmpty = !isFilled && !isHalf;

    let fill = filledColor;
    if (isEmpty) fill = emptyColor;
    if (isHalf) fill = `url(#half-star-gradient-${i})`;

    stars.push(
      <svg
        key={i}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={fill}
        style={{
          cursor: interactive ? 'pointer' : 'default',
          transition: 'transform 0.1s',
        }}
        onClick={() => handleClick(i)}
        onKeyDown={(e) => handleKeyDown(e, i)}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? 'button' : undefined}
        aria-label={interactive ? `Rate ${i} star${i === 1 ? '' : 's'}` : undefined}
      >
        {isHalf && (
          <defs>
            <linearGradient id={`half-star-gradient-${i}`}>
              <stop offset="50%" stopColor={filledColor} />
              <stop offset="50%" stopColor={emptyColor} />
            </linearGradient>
          </defs>
        )}
        <path d={StarPath} />
      </svg>,
    );
  }

  const defaultAriaLabel = `${rating} out of ${max} stars`;

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px',
        ...style,
      }}
      role="img"
      aria-label={ariaLabel ?? defaultAriaLabel}
    >
      {stars}
    </div>
  );
}
