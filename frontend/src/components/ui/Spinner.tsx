export function Spinner({ size = 20, label = 'Loading' }: { size?: number; label?: string }) {
  return <span className="spinner" role="status" aria-label={label} style={{ width: size, height: size, display: 'inline-block', borderRadius: '50%', border: '2px solid currentColor', borderRightColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />;
}
