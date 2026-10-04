"use client";
import { metersBetween } from "@/lib/geo";
import { bearingDeg, formatDistance, compassPoint } from "@/lib/bearing";

export default function Finder({ target, finder }) {
  const { on, me, heading, error, start, stop } = finder;

  if (!on) {
    return (
      <button onClick={start} disabled={!target} className="btn btn-dark mb-3 w-full disabled:opacity-40">
        Find them: point me to them
      </button>
    );
  }

  const ready = me && target;
  const d = ready ? metersBetween([me.lat, me.lng], [target.lat, target.lng]) : null;
  const brg = ready ? bearingDeg(me, target) : null;
  const err = ready ? Math.hypot(me.acc || 0, target.acc || 0) : 0;
  const here = ready && d <= Math.max(err, 5);
  const rot = brg == null ? 0 : heading != null ? brg - heading : brg;

  return (
    <div className="mb-3 rounded-lg border border-black/15 p-3">
      {!ready ? (
        <p className="text-sm text-neutral-600">Getting your location…</p>
      ) : (
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 24 24" width="64" height="64" aria-hidden="true" style={{ transform: `rotate(${rot}deg)`, transition: "transform .2s" }}>
            <path d="M12 2 L19 21 L12 16.5 L5 21 Z" fill="#7a1f33" />
          </svg>
          <div className="min-w-0 flex-1">
            <div className="text-2xl font-semibold">{here ? "You're here" : formatDistance(d)}</div>
            <div className="text-sm text-neutral-600">
              {here ? "Within GPS error of their position" : `Head ${compassPoint(brg)}${heading == null ? " (compass off)" : ""}`}
            </div>
            <div className="text-xs text-neutral-500">Combined accuracy ±{Math.round(err)} m</div>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-burgundy">{error}</p>}
      <button onClick={stop} className="mt-2 text-xs text-neutral-500 underline">Stop finding</button>
    </div>
  );
}
