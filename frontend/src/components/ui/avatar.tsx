import type { ImgHTMLAttributes } from 'react';

type AvatarProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  src?: string;
  name: string;
  size?: number;
};

export function Avatar({ src, name, size = 40, className = '', ...props }: AvatarProps) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  return src
    ? <img {...props} className={`avatar ${className}`} src={src} alt={name} width={size} height={size} style={{ borderRadius: '50%', objectFit: 'cover', ...props.style }} />
    : <span aria-label={name} className={`avatar avatar--fallback ${className}`} style={{ width: size, height: size, display: 'inline-grid', placeItems: 'center', borderRadius: '50%' }}>{initials || '?'}</span>;
}
