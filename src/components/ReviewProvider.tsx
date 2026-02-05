/**
 * ReviewProvider
 *
 * Context provider for LiteReviews configuration.
 * Wrap your Hydrogen app with this provider to enable reviews.
 */

import { createContext, useContext, useMemo } from 'react';

import type { LiteReviewsConfig } from '../types.js';
import type { ReactNode } from 'react';

interface ReviewContextValue {
  config: LiteReviewsConfig;
}

const ReviewContext = createContext<ReviewContextValue | null>(null);

export interface ReviewProviderProps {
  /**
   * LiteReviews configuration
   */
  config: LiteReviewsConfig;

  /**
   * Child components
   */
  children: ReactNode;
}

/**
 * Provider component for LiteReviews context.
 *
 * @example
 * ```tsx
 * import { ReviewProvider } from '@tempered/hydrogen-reviews';
 *
 * export default function App() {
 *   return (
 *     <ReviewProvider
 *       config={{
 *         apiUrl: 'https://litereviews.temperedtools.xyz',
 *         shopDomain: 'my-store.myshopify.com',
 *         apiKey: process.env.LITEREVIEWS_API_KEY,
 *       }}
 *     >
 *       <Outlet />
 *     </ReviewProvider>
 *   );
 * }
 * ```
 */
export function ReviewProvider({ config, children }: ReviewProviderProps) {
  const value = useMemo(() => ({ config }), [config]);

  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  );
}

/**
 * Hook to access LiteReviews configuration.
 * Must be used within a ReviewProvider.
 */
export function useReviewConfig(): LiteReviewsConfig {
  const context = useContext(ReviewContext);

  if (!context) {
    throw new Error('useReviewConfig must be used within a ReviewProvider');
  }

  return context.config;
}

export { ReviewContext };
