import 'leaflet/dist/leaflet.css';
import { CircleMarker, MapContainer, TileLayer, Tooltip, ZoomControl } from 'react-leaflet';
import { getMemberLocation } from './mockData';

export function MapView({ members = [] }) {
  const points = members.map((member) => {
    const location = getMemberLocation(member.user?.id || member.id);
    return {
      id: member.id,
      name: member.user?.name || 'Member',
      lat: location.lat,
      lng: location.lng,
      city: location.city,
    };
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden relative">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        style={{ height: '720px', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="topright" />
        {points.map((point) => (
          <CircleMarker
            key={point.id}
            center={[point.lat, point.lng]}
            radius={8}
            pathOptions={{ color: '#111827', fillColor: '#111827', fillOpacity: 0.95 }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              <div className="text-xs">
                <p className="font-semibold">{point.name}</p>
                <p>{point.city}</p>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      <div className="absolute bottom-4 left-4 bg-gray-900 text-white px-4 py-3 rounded-lg text-sm shadow-lg">
        Pins are offset by 10+ miles for privacy
      </div>
    </div>
  );
}
