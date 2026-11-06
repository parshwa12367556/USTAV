export function VenueGallery({ images }: { images: { id: string; url: string; alt: string }[] }) {
  return <div className="venue-gallery">{images.map((image) => <img key={image.id} src={image.url} alt={image.alt} loading="lazy" />)}</div>;
}
