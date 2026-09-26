"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { pinIcon } from "@/lib/pins";
import type { Place } from "@/lib/places";
import { GY_CENTRE } from "@/lib/places";

export default function MapView({ places }: { places: Place[] }) {
  return (
    <MapContainer
      center={GY_CENTRE}
      zoom={14}
      scrollWheelZoom
      className="h-[65vh] w-full rounded-xl ring-1 ring-slate-800"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {places.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lon]}
          icon={pinIcon(p.category, p.source === "manual")}
        >
          <Popup>
            <b>{p.name}</b>
            {p.favourite ? " ♥" : ""}
            {typeof p.rating === "number" && (
              <span style={{ color: "#fbbf24" }}>
                {" "}
                {"★".repeat(p.rating)}
              </span>
            )}
            <br />
            {p.category}
            {p.source === "manual" ? (
              <span style={{ color: "#f59e0b", fontSize: 12 }}> · yours ⭐</span>
            ) : null}
            {p.address ? (
              <>
                <br />
                <span style={{ fontSize: 12 }}>{p.address}</span>
              </>
            ) : null}
            {p.website ? (
              <>
                <br />
                <a href={p.website} target="_blank" rel="noreferrer">
                  website
                </a>
              </>
            ) : null}
            {p.note ? (
              <>
                <br />
                <em>Your note: {p.note}</em>
              </>
            ) : null}
            <br />
            <a href={`/place/${p.id}`}>Details & your notes →</a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
