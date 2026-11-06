export function ErrorFallback({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return <section className="error-fallback" role="alert">
    <h2>Something went wrong</h2><p>{error.message || 'Please try again.'}</p>
    {onRetry && <button type="button" onClick={onRetry}>Try again</button>}
  </section>;
}
