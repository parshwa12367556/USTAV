export function WhatsAppShareButton({ text, url, label = 'Share on WhatsApp' }: { text: string; url?: string; label?: string }) {
  const href = `https://wa.me/?text=${encodeURIComponent([text, url].filter(Boolean).join(' '))}`;
  return <a className="whatsapp-share" href={href} target="_blank" rel="noreferrer">{label}</a>;
}
