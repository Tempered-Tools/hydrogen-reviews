# @tempered/hydrogen-reviews

Product reviews components for Shopify Hydrogen storefronts.

## Installation

```bash
npm install @tempered/hydrogen-reviews
# or
pnpm add @tempered/hydrogen-reviews
```

## Quick Start

### 1. Set up the Provider

Wrap your Hydrogen app with the `ReviewProvider`:

```tsx
// app/root.tsx
import { ReviewProvider } from '@tempered/hydrogen-reviews';

export default function App() {
  return (
    <ReviewProvider
      config={{
        apiUrl: 'https://your-litereviews-instance.com',
        shopDomain: 'your-store.myshopify.com',
        apiKey: process.env.LITEREVIEWS_API_KEY, // Optional
      }}
    >
      <Outlet />
    </ReviewProvider>
  );
}
```

### 2. Add Reviews to Product Pages

```tsx
// app/routes/products.$handle.tsx
import { ReviewWidget } from '@tempered/hydrogen-reviews';

export default function ProductPage() {
  const { product } = useLoaderData();

  return (
    <div>
      <h1>{product.title}</h1>
      {/* ... product details ... */}

      <ReviewWidget
        productId={product.id}
        enableSubmission
        showVerifiedBadge
        showPhotos
      />
    </div>
  );
}
```

### 3. Add Star Ratings to Collection Pages

```tsx
// app/routes/collections.$handle.tsx
import { StarRating } from '@tempered/hydrogen-reviews';
import { fetchBatchRatings } from '@tempered/hydrogen-reviews/server';

export async function loader({ context, params }) {
  const collection = await getCollection(params.handle);
  const productIds = collection.products.map(p => p.id);

  const ratings = await fetchBatchRatings({
    apiUrl: context.env.LITEREVIEWS_API_URL,
    productIds,
  });

  return { collection, ratings };
}

export default function CollectionPage() {
  const { collection, ratings } = useLoaderData();

  return (
    <div>
      {collection.products.map(product => (
        <div key={product.id}>
          <h2>{product.title}</h2>
          <StarRating
            rating={ratings[product.id]?.averageRating ?? 0}
            showHalfStars
          />
          <span>({ratings[product.id]?.totalReviews ?? 0} reviews)</span>
        </div>
      ))}
    </div>
  );
}
```

## Components

### ReviewProvider

Context provider for LiteReviews configuration. Must wrap your app.

```tsx
<ReviewProvider config={{ apiUrl, shopDomain, apiKey }}>
  {children}
</ReviewProvider>
```

### ReviewWidget

Complete review widget with list, form, pagination, sorting, and filtering.

```tsx
<ReviewWidget
  productId="gid://shopify/Product/123"
  perPage={10}
  enableSubmission
  enablePhotoUpload
  showVerifiedBadge
  showPhotos
  showMerchantResponse
  enableSorting
  enableFiltering
/>
```

### ReviewList

Displays a list of reviews without the form or controls.

```tsx
<ReviewList
  reviews={reviews}
  showVerifiedBadge
  showPhotos
  showMerchantResponse
/>
```

### ReviewForm

Standalone review submission form.

```tsx
<ReviewForm
  productId="gid://shopify/Product/123"
  enablePhotos
  maxPhotos={5}
  onSuccess={(reviewId) => console.log('Submitted:', reviewId)}
/>
```

### StarRating

Star rating display component.

```tsx
// Display mode
<StarRating rating={4.5} showHalfStars />

// Interactive mode (for forms)
<StarRating
  rating={selectedRating}
  interactive
  onChange={setSelectedRating}
/>
```

## Hooks

### useReviews

Fetch and manage reviews with pagination.

```tsx
const {
  reviews,
  totalReviews,
  averageRating,
  currentPage,
  totalPages,
  isLoading,
  error,
  nextPage,
  prevPage,
  refresh,
} = useReviews({
  productId: product.id,
  limit: 10,
  sort: 'newest',
});
```

### useRatingSummary

Fetch rating summary for a product.

```tsx
const { summary, isLoading, error, refresh } = useRatingSummary(product.id);
```

## Server Functions

For SSR in Hydrogen loaders:

```tsx
import { fetchReviews, fetchRatingSummary, fetchBatchRatings } from '@tempered/hydrogen-reviews/server';

// Fetch paginated reviews
const reviews = await fetchReviews({
  apiUrl: context.env.LITEREVIEWS_API_URL,
  productId: product.id,
  limit: 10,
});

// Fetch rating summary
const summary = await fetchRatingSummary({
  apiUrl: context.env.LITEREVIEWS_API_URL,
  productId: product.id,
});

// Fetch multiple ratings at once
const ratings = await fetchBatchRatings({
  apiUrl: context.env.LITEREVIEWS_API_URL,
  productIds: ['gid://shopify/Product/1', 'gid://shopify/Product/2'],
});
```

## TypeScript

All components and functions are fully typed. Import types as needed:

```tsx
import type {
  Review,
  RatingSummary,
  ReviewsResponse,
  LiteReviewsConfig,
} from '@tempered/hydrogen-reviews';
```

## License

MIT
