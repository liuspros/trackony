"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useLiveSession } from "@/hooks/useLiveSession";
import { useAddress } from "@/hooks/useAddress";
import { useSafeZone } from "@/hooks/useSafeZone";
import { useFinder } from "@/hooks/useFinder";
import { normalizeCode, prettyCode, formatAgo, formatSpeed, qualityLabel } from "@/lib/geo";
import StatusBadge from "@/components/StatusBadge";
import Finder from "@/components/Finder";

const LiveMap = dynamic(() => import("@/components/LiveMap"), { ssr: false });

const LABELS = {
  connecting: "Waiting for location…",
  live: "Live",
  stale: "No recent update",
  ended: "Stopped sharing",
  missing: "Code not found",
  error: "Cannot connect",
};

export default function WatchPage() {
  const code = normalizeCode(String(useParams().code ?? ""));
  const [follow, setFollow] = useState(true);
  const [radius, setRadius] = useState(200);
  const [copied, setCopied] = useState(false);
  const { position, speed, trail, status, ageMs, distance, clearTrail } = useLiveSession(code);
  const address = useAddress(position);
  const { zone, outside, set: setZone, clear: clearZone } = useSafeZone(code, position);
  const finder = useFinder();
  const acc = position?.acc;
  const coords = position ? `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}` : null;

  const copyCoords = async () => {
    await navigator.clipboard?.writeText(coords);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const stats = [
    ["Last update", formatAgo(ageMs)],
    ["Speed", formatSpeed(speed)],
    [`Accuracy · ${qualityLabel(acc)}`, acc != null ? `±${Math.round(acc)} m` : "—"],
    ["Trail", `${distance.toFixed(2)} km`],
  ];

  return (
    <main className="relative h-dvh">
      <LiveMap position={position} trail={trail} follow={follow} onUserPan={() => setFollow(false)} zone={zone} me={finder.me} />
      <section className="sheet max-h-[65dvh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <StatusBadge live={status === "live"} label={LABELS[status]} />
          <span className="text-sm tracking-widest text-neutral-500">{prettyCode(code)}</span>
        </div>

        {outside && (
          <p className="mb-3 rounded-lg bg-burgundy px-3 py-2 text-sm font-medium text-white">
            Outside the {zone.r} m safe zone
          </p>
        )}
        {address && <p className="mb-1 text-sm font-medium">{address}</p>}
        {coords && (
          <p className="mb-3 flex items-center gap-2 text-xs text-neutral-500">
            <span className="font-mono">{coords}</span>
            <button onClick={copyCoords} className="underline">{copied ? "Copied" : "Copy"}</button>
          </p>
        )}
        {status === "stale" && (
          <p className="mb-3 text-sm text-neutral-600">
            The phone may have locked its screen or left the page. Updates resume when it is open again.
          </p>
        )}

        <Finder target={position} finder={finder} />

        <dl className="mb-3 grid grid-cols-2 gap-2">
          {stats.map(([k, v]) => (
            <div key={k} className="rounded-lg bg-neutral-100 px-3 py-2">
              <dd className="text-base font-medium">{v}</dd>
              <dt className="text-xs text-neutral-500">{k}</dt>
            </div>
          ))}
        </dl>

        <div className="mb-3 flex items-center gap-2 text-sm">
          {zone ? (
            <>
              <span className="flex-1 text-neutral-600">Safe zone: {zone.r} m</span>
              <button onClick={clearZone} className="btn btn-ghost py-2">Remove zone</button>
            </>
          ) : (
            <>
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                aria-label="Safe zone radius"
                className="rounded-lg border border-black/20 bg-white px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-burgundy"
              >
                {[100, 200, 500, 1000].map((m) => <option key={m} value={m}>{m} m</option>)}
              </select>
              <button onClick={() => setZone(radius)} disabled={!position} className="btn btn-ghost flex-1 py-2 disabled:opacity-40">
                Set safe zone here
              </button>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setFollow((f) => !f)} className={`btn ${follow ? "btn-primary" : "btn-ghost"}`}>
            {follow ? "Following" : "Follow"}
          </button>
          {position ? (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${position.lat},${position.lng}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
            >
              Directions
            </a>
          ) : (
            <span className="btn btn-ghost opacity-40">Directions</span>
          )}
          <button onClick={clearTrail} className="btn btn-ghost">Clear trail</button>
          <Link href="/" className="btn btn-ghost">Close</Link>
        </div>
      </section>
    </main>
  );
}
