export default function DetailGallery({ images, hotelName }) {
  return (
    <section className={`acc-detail-gallery acc-detail-gallery--count-${images.length}`}>
      {images.map((src, i) => (
        <img key={`${src}-${i}`} src={src} alt={`${hotelName || 'hotel'} ${i + 1}`} className={i === 0 ? 'main' : ''} />
      ))}
    </section>
  )
}
