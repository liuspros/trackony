"use client";
import { useEffect, useRef, useState } from "react";
import { metersBetween } from "@/lib/geo";

/** A circular safe zone saved on the viewer's device; alerts when the sharer leaves it. */
export function useSafeZone(code, position) {
  const key = `trackony:zone:${code}`;
  const [zone, setZone] = useState(null);
  const [outside, setOutside] = useState(false);
  const wasOutside = useRef(false);

  useEffect(() => {
    try { setZone(JSON.parse(localStorage.getItem(key))); } catch {}
  }, [key]);

  const set = (radius) => {
    if (!position) return;
    const z = { lat: position.lat, lng: position.lng, r: radius };
    setZone(z);
    try { localStorage.setItem(key, JSON.stringify(z)); } catch {}
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  };
  const clear = () => {
    setZone(null);
    setOutside(false);
    wasOutside.current = false;
    try { localStorage.removeItem(key); } catch {}
  };

  useEffect(() => {
    if (!zone || !position) return;
    const d = metersBetween([zone.lat, zone.lng], [position.lat, position.lng]);
    const out = d - (position.acc || 0) > zone.r; // allow for GPS error
    setOutside(out);
    if (out && !wasOutside.current) {
      navigator.vibrate?.([300, 150, 300]);
      try {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Left safe zone", { body: `They moved outside the ${zone.r} m safe zone.` });
        }
      } catch {}
    }
    wasOutside.current = out;
  }, [zone, position]);

  return { zone, outside, set, clear };
}
