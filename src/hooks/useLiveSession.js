"use client";
import { useEffect, useMemo, useState } from "react";
import { subscribeSession } from "@/lib/sessions";
import { distanceKm, metersBetween } from "@/lib/geo";

const STALE_MS = 60000;

export function useLiveSession(code) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("connecting");
  const [trail, setTrail] = useState([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setSession(null);
    setTrail([]);
    setStatus("connecting");
    return subscribeSession(
      code,
      (data) => {
        if (!data) { setSession(null); return setStatus("missing"); }
        if (!data.active || data.lat == null) {
          setSession(null);
          return setStatus(data.active ? "connecting" : "ended");
        }
        setSession(data);
        setStatus("live");
        // only extend the trail with confident, meaningful movement
        if ((data.acc ?? 0) > 100) return;
        setTrail((t) => {
          const p = [data.lat, data.lng];
          const last = t[t.length - 1];
          const min = Math.max(8, (data.acc ?? 0) * 0.5);
          return !last || metersBetween(last, p) > min ? [...t, p] : t;
        });
      },
      () => setStatus("error")
    );
  }, [code]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const ageMs = session ? now - session.updatedAt : null;
  const shown = status === "live" && ageMs > STALE_MS ? "stale" : status;
  const distance = useMemo(() => {
    let d = 0;
    for (let i = 1; i < trail.length; i++) d += distanceKm(trail[i - 1], trail[i]);
    return d;
  }, [trail]);

  return {
    position: session && { lat: session.lat, lng: session.lng, acc: session.acc },
    speed: session?.speed ?? null,
    trail,
    status: shown,
    ageMs,
    distance,
    clearTrail: () => setTrail((t) => t.slice(-1)),
  };
}
