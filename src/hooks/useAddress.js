"use client";
import { useEffect, useRef, useState } from "react";
import { metersBetween } from "@/lib/geo";

/** Street/area name for a position (OpenStreetMap Nominatim), throttled to be polite. */
export function useAddress(position) {
  const [address, setAddress] = useState("");
  const last = useRef({ t: 0, ll: null });

  useEffect(() => {
    if (!position) {
      setAddress("");
      last.current = { t: 0, ll: null };
      return;
    }
    const ll = [position.lat, position.lng];
    const now = Date.now();
    const l = last.current;
    if (l.ll && (now - l.t < 15000 || metersBetween(l.ll, ll) < 40)) return;
    last.current = { t: now, ll };
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&lat=${ll[0]}&lon=${ll[1]}`)
      .then((r) => r.json())
      .then((j) => {
        const a = j.address || {};
        const parts = [a.road, a.neighbourhood || a.suburb, a.city || a.town || a.village || a.county, a.state].filter(Boolean);
        setAddress(parts.join(", ") || j.display_name || "");
      })
      .catch(() => {});
  }, [position]);

  return address;
}
