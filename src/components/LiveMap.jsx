"use client";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const SATELLITE = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const LABELS = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
const STREET = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const BURGUNDY = "#7a1f33";

export default function LiveMap({ position, trail = [], follow = true, onUserPan }) {
  const el = useRef(null);
  const r = useRef({});
  const panCb = useRef(onUserPan);
  panCb.current = onUserPan;
  const [mode, setMode] = useState("satellite");

  // create the map once
  useEffect(() => {
    const map = L.map(el.current, { zoomControl: false }).setView([6.5244, 3.3792], 12);
    L.control.zoom({ position: "topleft" }).addTo(map);
    r.current = {
      map,
      placed: false,
      base: null,
      marker: L.circleMarker([0, 0], { radius: 9, color: "#fff", weight: 3, fillColor: BURGUNDY, fillOpacity: 1 }),
      ring: L.circle([0, 0], { radius: 0, color: BURGUNDY, weight: 1, fillOpacity: 0.15 }),
      line: L.polyline([], { color: BURGUNDY, weight: 4 }),
    };
    map.on("dragstart", () => panCb.current?.());
    return () => map.remove();
  }, []);

  // satellite / street base layer
  useEffect(() => {
    const s = r.current;
    if (!s.map) return;
    s.base?.remove();
    s.base =
      mode === "satellite"
        ? L.layerGroup([
            L.tileLayer(SATELLITE, { maxZoom: 19, attribution: "Imagery © Esri, Maxar, Earthstar Geographics" }),
            L.tileLayer(LABELS, { maxZoom: 19 }),
          ])
        : L.tileLayer(STREET, { maxZoom: 19, attribution: "© OpenStreetMap" });
    s.base.addTo(s.map);
  }, [mode]);

  // position + accuracy ring
  useEffect(() => {
    const s = r.current;
    if (!s.map) return;
    if (!position) {
      if (s.placed) { [s.marker, s.ring, s.line].forEach((l) => l.remove()); s.placed = false; }
      return;
    }
    const ll = [position.lat, position.lng];
    if (!s.placed) {
      [s.ring, s.line, s.marker].forEach((l) => l.addTo(s.map));
      s.map.setView(ll, 17);
      s.placed = true;
    }
    s.marker.setLatLng(ll);
    s.ring.setLatLng(ll).setRadius(position.acc || 20);
    if (follow) s.map.panTo(ll);
  }, [position, follow]);

  // trail
  useEffect(() => {
    r.current.line?.setLatLngs(trail);
  }, [trail]);

  return (
    <div className="relative h-full w-full">
      <div ref={el} className="absolute inset-0" />
      <div className="absolute right-3 top-3 z-[1000] flex overflow-hidden rounded-lg border border-black/10 bg-white text-sm shadow">
        {["satellite", "street"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`px-3 py-2 capitalize focus-visible:outline focus-visible:outline-2 focus-visible:outline-burgundy ${
              mode === m ? "bg-black text-white" : "text-black hover:bg-neutral-100"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}
