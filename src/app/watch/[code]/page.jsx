"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useLiveSession } from "@/hooks/useLiveSession";
import { normalizeCode, prettyCode, formatAgo, formatSpeed } from "@/lib/geo";
import StatusBadge from "@/components/StatusBadge";

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
  const { position, speed, trail, status, ageMs, distance, clearTrail } = useLiveSession(code);

  const stats = [
    ["Last update", formatAgo(ageMs)],
    ["Speed", formatSpeed(speed)],
    ["Accuracy", position?.acc != null ? `±${Math.round(position.acc)} m` : "—"],
    ["Trail", `${distance.toFixed(2)} km`],
  ];

  return (
    <main className="relative h-dvh">
      <LiveMap position={position} trail={trail} follow={follow} onUserPan={() => setFollow(false)} />
      <section className="sheet">
        <div className="flex items-start justify-between">
          <StatusBadge live={status === "live"} label={LABELS[status]} />
          <span className="text-sm tracking-widest text-neutral-500">{prettyCode(code)}</span>
        </div>
        <dl className="mb-4 grid grid-cols-2 gap-2">
          {stats.map(([k, v]) => (
            <div key={k} className="rounded-lg bg-neutral-100 px-3 py-2">
              <dd className="text-base font-medium">{v}</dd>
              <dt className="text-xs text-neutral-500">{k}</dt>
            </div>
          ))}
        </dl>
        <div className="flex gap-2">
          <button onClick={() => setFollow((f) => !f)} className={`btn flex-1 ${follow ? "btn-primary" : "btn-ghost"}`}>
            {follow ? "Following" : "Follow"}
          </button>
          <button onClick={clearTrail} className="btn btn-ghost flex-1">Clear trail</button>
          <Link href="/" className="btn btn-ghost">Close</Link>
        </div>
      </section>
    </main>
  );
}
