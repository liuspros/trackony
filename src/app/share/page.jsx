"use client";
import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useShareLocation } from "@/hooks/useShareLocation";
import { prettyCode, qualityLabel } from "@/lib/geo";
import StatusBadge from "@/components/StatusBadge";

const LiveMap = dynamic(() => import("@/components/LiveMap"), { ssr: false });

export default function SharePage() {
  const { status, code, position, error, note, start, stop } = useShareLocation();
  const [copied, setCopied] = useState(false);
  const active = status === "starting" || status === "live";
  const acc = position?.acc;
  const precise = acc != null && acc <= 50;

  const copy = async () => {
    await navigator.clipboard?.writeText(`${location.origin}/watch/${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="relative h-dvh">
      <LiveMap position={position} follow />
      <section className="sheet max-h-[65dvh] overflow-y-auto">
        {!active ? (
          <>
            <Link href="/" className="mb-3 inline-block text-sm text-neutral-500 hover:text-black">Back</Link>
            <h1 className="text-xl font-semibold tracking-tight">Share your location</h1>
            <p className="mb-4 mt-1 text-sm text-neutral-600">
              Only people with your code can see where you are. Sharing stays on until you stop it.
            </p>
            {error && <p className="mb-3 text-sm text-burgundy">{error}</p>}
            <button onClick={start} className="btn btn-primary w-full">Start sharing</button>
          </>
        ) : (
          <>
            <StatusBadge live={precise} label={precise ? "Sharing live" : "Improving accuracy…"} />
            <div className="mb-1 text-3xl font-semibold tracking-[0.12em]">{prettyCode(code)}</div>
            {acc != null && (
              <p className="mb-2 text-sm font-medium">
                ±{Math.round(acc)} m <span className="font-normal text-neutral-500">· {qualityLabel(acc)}</span>
              </p>
            )}
            {!precise && (
              <p className="mb-2 text-sm text-neutral-600">
                Go outside or next to a window. On iPhone, allow Precise Location for Safari.
              </p>
            )}
            {note && <p className="mb-2 text-sm text-neutral-600">{note}</p>}
            <p className="mb-4 text-sm text-neutral-600">
              Send this code or link. Keep this screen open: phones pause location when the screen locks.
            </p>
            {error && <p className="mb-3 text-sm text-burgundy">{error}</p>}
            <div className="flex gap-2">
              <button onClick={copy} className="btn btn-ghost flex-1">{copied ? "Link copied" : "Copy link"}</button>
              <button onClick={stop} className="btn btn-dark flex-1">Stop sharing</button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
