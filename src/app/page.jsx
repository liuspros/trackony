import Link from "next/link";
import JoinForm from "@/components/JoinForm";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-between px-6 py-8">
      <header className="text-lg font-semibold tracking-tight">
        Track<span className="text-burgundy">ony</span>
      </header>

      <section>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Show someone where you are, with your say.
        </h1>
        <p className="mt-4 max-w-md text-neutral-600">
          Start sharing from your phone and send a code. They see you move on a satellite map until you stop.
        </p>
        <Link href="/share" className="btn btn-primary mt-8 w-full sm:w-auto">Share my location</Link>
        <div className="mt-10 border-t border-black/10 pt-6">
          <JoinForm />
        </div>
      </section>

      <footer className="text-xs text-neutral-500">
        Sharing is always visible on your screen and ends the moment you press stop.
      </footer>
    </main>
  );
}
