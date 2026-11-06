export function Skeleton({ width, height = 16, className = '' }: { width?: number | string; height?: number | string; className?: string }) {
  return <span aria-hidden="true" className={`skeleton ${className}`} style={{ display: 'block', width: width ?? '100%', height, borderRadius: 6, background: '#eee9e4' }} />;
}
