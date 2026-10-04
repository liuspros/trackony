"use client";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const BURGUNDY = "#7a1f33";
const MAPBOX = process.env.NEXT_PUBLIC_MAPBOX_TOKEN; // optional, adds a "Detail" layer
const MAPTILER = process.env.NEXT_PUBLIC_MAPTILER_KEY; // optional, free key, adds an "HD" layer
const IMAGERY = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const LABELS = "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png";
const STREET = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const RING_MIN_ACC = 20; // hide the radius ring when the fix is this precise

const MODES = [
  ["hybrid", "Hybrid"],
  ["satellite", "Satellite"],
  ["street", "Street"],
  ...(MAPTILER ? [["hd", "HD"]] : []),
  ...(MAPBOX ? [["detail", "Detail"]] : []),
];

// crosshair pin: marks one exact point instead of an area
const pinIcon = () => {
  const cross = "M17 1v9M17 24v9M1 17h9M24 17h9";
  return L.divIcon({
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    html: `<svg width="34" height="34" viewBox="0 0 34 34">
      <circle cx="17" cy="17" r="13" fill="none" stroke="#fff" stroke-width="3.5"/>
      <path d="${cross}" stroke="#fff" stroke-width="3.5"/>
      <circle cx="17" cy="17" r="13" fill="none" stroke="${BURGUNDY}" stroke-width="1.6"/>
      <path d="${cross}" stroke="${BURGUNDY}" stroke-width="1.6"/>
      <circle cx="17" cy="17" r="3.5" fill="${BURGUNDY}" stroke="#fff" stroke-width="2"/></svg>`,
  });
};

const imagery = () =>
  L.tileLayer(IMAGERY, { maxZoom: 21, maxNativeZoom: 18, attribution: "Imagery © Esri, Maxar, Earthstar Geographics" });

const labels = () =>
  L.tileLayer(LABELS, { maxZoom: 21, maxNativeZoom: 20, subdomains: "abcd", attribution: "Labels © OpenStreetMap contributors © CARTO" });

function makeBase(mode) {
  if (mode === "hd")
    return L.layerGroup([
      L.tileLayer(`https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER}`, {
        maxZoom: 21,
        maxNativeZoom: 18,
        attribution: "© MapTiler © OpenStreetMap contributors",
      }),
      labels(),
    ]);
  if (mode === "street")
    return L.tileLayer(STREET, { maxZoom: 21, maxNativeZoom: 19, attribution: "© OpenStreetMap contributors" });
  if (mode === "detail")
    return L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/512/{z}/{x}/{y}@2x?access_token=${MAPBOX}`,
      { tileSize: 512, zoomOffset: -1, maxZoom: 21, attribution: "© Mapbox © OpenStreetMap © Maxar" }
    );
  if (mode === "satellite") return imagery();
  return L.layerGroup([
    imagery(),
    L.tileLayer(LABELS, { maxZoom: 21, maxNativeZoom: 20, subdomains: "abcd", attribution: "Labels © OpenStreetMap contributors © CARTO" }),
  ]);
}

export default function LiveMap({ position, trail = [], follow = true, onUserPan, zone = null, me = null }) {
  const el = useRef(null);
  const r = useRef({});
  const panCb = useRef(onUserPan);
  panCb.current = onUserPan;
  const [mode, setMode] = useState(MAPTILER ? "hd" : "hybrid");

  useEffect(() => {
    const map = L.map(el.current, { zoomControl: false }).setView([9.08, 8.68], 6);
    L.control.zoom({ position: "topleft" }).addTo(map);
    r.current = {
      map,
      placed: false,
      base: null,
      marker: L.marker([0, 0], { icon: pinIcon(), keyboard: false }),
      ring: L.circle([0, 0], { radius: 0, color: BURGUNDY, weight: 1, fillOpacity: 0.15 }),
      line: L.polyline([], { color: BURGUNDY, weight: 4 }),
      zone: null,
      me: null,
      meLine: null,
      fit: false,
    };
    map.on("dragstart", () => panCb.current?.());
    return () => map.remove();
  }, []);

  useEffect(() => {
    const s = r.current;
    if (!s.map) return;
    s.base?.remove();
    s.base = makeBase(mode);
    s.base.addTo(s.map);
  }, [mode]);

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
      s.map.setView(ll, 19);
      s.placed = true;
    }
    s.marker.setLatLng(ll);
    const showRing = (position.acc || 0) > RING_MIN_ACC;
    s.ring.setLatLng(ll).setRadius(position.acc || 20).setStyle({ opacity: showRing ? 1 : 0, fillOpacity: showRing ? 0.15 : 0 });
    if (follow) s.map.panTo(ll);
  }, [position, follow]);

  useEffect(() => {
    r.current.line?.setLatLngs(trail);
  }, [trail]);

  useEffect(() => {
    const s = r.current;
    if (!s.map) return;
    s.zone?.remove();
    s.zone = zone
      ? L.circle([zone.lat, zone.lng], { radius: zone.r, color: "#fff", weight: 2, dashArray: "6 6", fillColor: "#000", fillOpacity: 0.08 }).addTo(s.map)
      : null;
  }, [zone]);

  // viewer's own dot + a line to the person
  useEffect(() => {
    const s = r.current;
    if (!s.map) return;
    if (!me) {
      s.me?.remove();
      s.meLine?.remove();
      s.me = s.meLine = null;
      s.fit = false;
      return;
    }
    const a = [me.lat, me.lng];
    if (!s.me) {
      s.me = L.circleMarker(a, { radius: 7, color: "#fff", weight: 3, fillColor: "#000", fillOpacity: 1 }).addTo(s.map);
      s.meLine = L.polyline([], { color: "#fff", weight: 3, dashArray: "4 8" }).addTo(s.map);
    }
    s.me.setLatLng(a);
    if (position) {
      const b = [position.lat, position.lng];
      s.meLine.setLatLngs([a, b]);
      if (!s.fit) {
        s.fit = true;
        s.map.fitBounds([a, b], { padding: [70, 70], maxZoom: 19 });
        panCb.current?.();
      }
    }
  }, [me, position]);

  return (
    <div className="relative h-full w-full">
      <div ref={el} className="absolute inset-0" />
      <div className="absolute right-3 top-3 z-[1000] flex overflow-hidden rounded-lg border border-black/10 bg-white text-xs shadow">
        {MODES.map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`px-2.5 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-burgundy ${
              mode === m ? "bg-black text-white" : "text-black hover:bg-neutral-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
