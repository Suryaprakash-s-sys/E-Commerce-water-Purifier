import { useState } from 'react'
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet'

type Coordinates = [number, number]

function ClickToChoose({ onChoose }: { onChoose: (point: Coordinates) => void }) {
  useMapEvents({ click: event => onChoose([event.latlng.lat, event.latlng.lng]) })
  return null
}

export default function MapPicker({
  initialPosition,
  onCancel,
  onSave,
}: {
  initialPosition: Coordinates
  onCancel: () => void
  onSave: (point: Coordinates) => void
}) {
  const [point, setPoint] = useState<Coordinates>(initialPosition)

  return <div className="map-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onCancel() }}>
    <section className="map-dialog" role="dialog" aria-modal="true" aria-labelledby="map-picker-title">
      <div className="map-dialog-head">
        <div><h2 id="map-picker-title">Choose service location</h2><p>Click the map to place the location pin.</p></div>
        <button className="outline" onClick={onCancel}>Close</button>
      </div>
      <MapContainer center={point} zoom={point === initialPosition ? 5 : 14} scrollWheelZoom className="location-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickToChoose onChoose={setPoint} />
        <CircleMarker center={point} radius={9} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#1476c6', fillOpacity: 1 }} />
      </MapContainer>
      <p className="map-coordinates">Selected: {point[0].toFixed(6)}, {point[1].toFixed(6)}</p>
      <div className="map-dialog-actions"><button className="outline" onClick={onCancel}>Cancel</button><button className="primary map-save" onClick={() => onSave(point)}>Save location</button></div>
    </section>
  </div>
}
