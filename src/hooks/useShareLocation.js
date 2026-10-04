"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { startSession, pushLocation, endSession } from "@/lib/sessions";
import { newCode, metersBetween, smooth } from "@/lib/geo";

const MIN_INTERVAL_MS = 3000;
const WARMUP_MS = 20000; // accept improving fixes while GPS locks on
const MAX_ACC = 150; // after warm-up, ignore fixes worse than this
const MAX_SPEED = 70; // m/s; faster "movement" is a bad fix
const IDLE = { status: "idle", code: null, position: null, error: null, note: null };

export function useShareLocation() {
  const [state, setState] = useState(IDLE);
  const watchId = useRef(null);
  const codeRef = useRef(null);
  const lastPush = useRef(0);
  const wake = useRef(null);
  const last = useRef(null);
  const startedAt = useRef(0);

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
    last.current = null;
    const code = codeRef.current;
    codeRef.current = null;
    if (code) {
      try { await endSession(code); } catch {}
    }
    setState(IDLE);
  }, []);

  const onFix = useCallback((code, pos) => {
    const c = pos.coords;
    const raw = { lat: c.latitude, lng: c.longitude, acc: c.accuracy || 9999 };
    const now = Date.now();
    const prev = last.current;
    const warming = now - startedAt.current < WARMUP_MS;

    if (prev) {
      // during warm-up keep only fixes that improve on what we have
      if (warming && raw.acc > prev.acc) return;
      // after warm-up, hold the last good position through weak-signal fixes
      if (!warming && raw.acc > MAX_ACC && prev.acc <= MAX_ACC) {
        return setState((s) => ({ ...s, note: "Weak GPS signal. Holding the last good position." }));
      }
      // reject impossible jumps
      const dt = Math.max(1, (now - prev.t) / 1000);
      const d = metersBetween([prev.lat, prev.lng], [raw.lat, raw.lng]);
      if (d / dt > MAX_SPEED && raw.acc >= prev.acc) return;
    }

    const fix = { ...smooth(prev, raw, c.speed != null && c.speed > 0.8), t: now };
    last.current = fix;
    const p = { lat: fix.lat, lng: fix.lng, acc: fix.acc, speed: c.speed, heading: c.heading };
    setState((s) => ({ ...s, status: "live", position: p, error: null, note: null }));

    if (now - lastPush.current >= MIN_INTERVAL_MS) {
      lastPush.current = now;
      pushLocation(code, p).catch(() => {});
    }
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
    last.current = null;
    startedAt.current = Date.now();
    acquireWake();
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => onFix(code, pos),
      (err) => {
        if (err.code === 1) {
          setState((s) => ({ ...s, status: "error", error: "Location permission was denied. Allow it in your browser settings, then try again." }));
        } else {
          setState((s) => ({ ...s, note: "Searching for GPS signal…" }));
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }
    );
  }, [onFix]);

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
