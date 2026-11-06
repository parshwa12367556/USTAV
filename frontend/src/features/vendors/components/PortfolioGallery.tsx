export function PortfolioGallery({ images }: { images: { id: string; url: string; alt: string }[] }) {
  return <div className="portfolio-gallery">{images.map((image) => <figure key={image.id}><img src={image.url} alt={image.alt} loading="lazy" /><figcaption>{image.alt}</figcaption></figure>)}</div>;
}
