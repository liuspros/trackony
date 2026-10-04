export default function StatusBadge({ live, label }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-sm font-medium">
      <span className="relative flex h-2.5 w-2.5">
        {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-burgundy opacity-60 motion-reduce:animate-none" />}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${live ? "bg-burgundy" : "bg-neutral-400"}`} />
      </span>
      {label}
    </div>
  );
}
