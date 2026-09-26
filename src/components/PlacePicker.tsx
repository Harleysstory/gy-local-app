"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { pinIcon } from "@/lib/pins";
import { GY_CENTRE } from "@/lib/places";

function ClickHandler({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Small map for placing a new place: click to drop a star pin that previews
 * in the selected category's colour (matches what it'll look like on the map).
 */
export default function PlacePicker({
  lat,
  lon,
  category,
  onPick,
}: {
  lat: number | null;
  lon: number | null;
  category: string;
  onPick: (lat: number, lon: number) => void;
}) {
  return (
    <MapContainer
      center={lat && lon ? [lat, lon] : GY_CENTRE}
      zoom={lat && lon ? 16 : 14}
      scrollWheelZoom
      className="h-72 w-full rounded-xl ring-1 ring-slate-800"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
      {lat !== null && lon !== null && (
        <Marker position={[lat, lon]} icon={pinIcon(category, true)} />
      )}
    </MapContainer>
  );
}
