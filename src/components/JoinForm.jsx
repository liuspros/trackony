"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CODE_LENGTH, normalizeCode } from "@/lib/geo";

export default function JoinForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const code = normalizeCode(value);
    if (code.length !== CODE_LENGTH) return setError(`Enter the ${CODE_LENGTH}-character code.`);
    router.push(`/watch/${code}`);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <label htmlFor="code" className="text-sm text-neutral-600">Have a code? Watch a phone that is sharing with you.</label>
      <div className="flex gap-2">
        <input
          id="code"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(""); }}
          placeholder="ABCD-2345"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-lg border border-black/20 px-4 py-3 text-center text-lg uppercase tracking-[0.2em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-burgundy"
        />
        <button className="btn btn-ghost">Watch</button>
      </div>
      {error && <p className="text-sm text-burgundy">{error}</p>}
    </form>
  );
}
