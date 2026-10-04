import { doc, setDoc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db, ensureUser } from "./firebase";

const ref = (code) => doc(db, "sessions", code);

/** Phone side: open a sharing session. */
export async function startSession(code) {
  const user = await ensureUser();
  await setDoc(ref(code), {
    ownerUid: user.uid,
    active: true,
    lat: null,
    lng: null,
    createdAt: serverTimestamp(),
  });
}

/** Phone side: publish the latest position. */
export function pushLocation(code, p) {
  return updateDoc(ref(code), {
    lat: p.lat,
    lng: p.lng,
    acc: p.acc ?? null,
    speed: p.speed ?? null,
    heading: p.heading ?? null,
    updatedAt: Date.now(),
    active: true,
  });
}

/** Phone side: stop sharing and wipe the last known position. */
export function endSession(code) {
  return updateDoc(ref(code), { active: false, lat: null, lng: null });
}

/** Viewer side: live updates for one session. Returns an unsubscribe function. */
export function subscribeSession(code, onData, onError) {
  let unsub = () => {};
  let cancelled = false;
  ensureUser()
    .then(() => {
      if (cancelled) return;
      unsub = onSnapshot(ref(code), (s) => onData(s.exists() ? s.data() : null), onError);
    })
    .catch(onError);
  return () => {
    cancelled = true;
    unsub();
  };
}
