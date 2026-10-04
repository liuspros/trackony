"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/** The viewer's own position + compass heading, used to point at the sharer. */
export function useFinder() {
  const [on, setOn] = useState(false);
  const [me, setMe] = useState(null);
  const [heading, setHeading] = useState(null);
  const [error, setError] = useState(null);
  const watch = useRef(null);
  const handler = useRef(null);

  const stop = useCallback(() => {
    if (watch.current != null) navigator.geolocation.clearWatch(watch.current);
    watch.current = null;
    if (handler.current) {
      window.removeEventListener("deviceorientationabsolute", handler.current, true);
      window.removeEventListener("deviceorientation", handler.current, true);
    }
    handler.current = null;
    setOn(false);
    setMe(null);
    setHeading(null);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      // iOS asks for compass permission, and only from a tap
      if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        const res = await DeviceOrientationEvent.requestPermission();
        if (res !== "granted") setError("Compass permission denied. Distance still works.");
      }
    } catch {}
    handler.current = (e) => {
      const h =
        typeof e.webkitCompassHeading === "number"
          ? e.webkitCompassHeading
          : e.absolute && e.alpha != null
          ? (360 - e.alpha) % 360
          : null;
      if (h != null) setHeading(h);
    };
    window.addEventListener("deviceorientationabsolute", handler.current, true);
    window.addEventListener("deviceorientation", handler.current, true);
    watch.current = navigator.geolocation.watchPosition(
      (p) => setMe({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }),
      () => setError("Allow your location to measure distance and direction."),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }
    );
    setOn(true);
  }, []);

  useEffect(() => stop, [stop]);

  return { on, me, heading, error, start, stop };
}
