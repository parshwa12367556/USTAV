export function RatingDisplay({ rating, reviewCount }: { rating: number; reviewCount?: number }) {
  const safeRating = Math.max(0, Math.min(5, rating));
  return <span className="rating-display" aria-label={`${safeRating.toFixed(1)} out of 5 stars`}>
    <span aria-hidden="true">★</span> {safeRating.toFixed(1)}{reviewCount !== undefined && <small> ({reviewCount})</small>}
  </span>;
}
