import { CircleMarker, MapContainer, TileLayer } from 'react-leaflet'

export default function LocationMap({
  point,
  onClose,
}: {
  point: [number, number]
  onClose: () => void
}) {
  return <div className="map-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="map-dialog" role="dialog" aria-modal="true" aria-labelledby="service-map-title">
      <div className="map-dialog-head">
        <div><h2 id="service-map-title">Customer service location</h2><p>Location shared by the customer for this service booking.</p></div>
        <button className="outline" onClick={onClose}>Close</button>
      </div>
      <MapContainer center={point} zoom={16} scrollWheelZoom className="location-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker center={point} radius={10} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#1476c6', fillOpacity: 1 }} />
      </MapContainer>
      <p className="map-coordinates">Coordinates: {point[0].toFixed(6)}, {point[1].toFixed(6)}</p>
    </section>
  </div>
}
