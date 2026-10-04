"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { startSession, pushLocation, endSession } from "@/lib/sessions";
import { newCode } from "@/lib/geo";

const MIN_INTERVAL_MS = 3000;
const IDLE = { status: "idle", code: null, position: null, error: null };

export function useShareLocation() {
  const [state, setState] = useState(IDLE);
  const watchId = useRef(null);
  const codeRef = useRef(null);
  const lastPush = useRef(0);
  const wake = useRef(null);

  const acquireWake = async () => {
    try {
      const s = await navigator.wakeLock?.request("screen");
      if (s) {
        wake.current = s;
        s.addEventListener("release", () => (wake.current = null));
      }
    } catch {}
  };

  const stop = useCallback(async () => {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    wake.current?.release?.().catch(() => {});
    wake.current = null;
    const code = codeRef.current;
    codeRef.current = null;
    if (code) {
      try { await endSession(code); } catch {}
    }
    setState(IDLE);
  }, []);

  const start = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      return setState({ ...IDLE, status: "error", error: "This device does not support location." });
    }
    const code = newCode();
    setState({ ...IDLE, status: "starting", code });
    try {
      await startSession(code);
    } catch {
      return setState({ ...IDLE, status: "error", error: "Could not reach the server. Check your connection and that Anonymous sign-in is enabled in Firebase." });
    }
    codeRef.current = code;
    acquireWake();
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const c = pos.coords;
        const p = { lat: c.latitude, lng: c.longitude, acc: c.accuracy, speed: c.speed, heading: c.heading };
        setState((s) => ({ ...s, status: "live", position: p }));
        const now = Date.now();
        if (now - lastPush.current >= MIN_INTERVAL_MS) {
          lastPush.current = now;
          pushLocation(code, p).catch(() => {});
        }
      },
      (err) =>
        setState((s) => ({
          ...s,
          status: "error",
          error: err.code === 1
            ? "Location permission was denied. Allow it in your browser settings, then try again."
            : "Cannot get a GPS signal. Move to an open area and try again.",
        })),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
    );
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && codeRef.current && !wake.current) acquireWake();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => () => { stop(); }, [stop]);

  return { ...state, start, stop };
}
