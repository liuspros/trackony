# Trackony

Live location sharing: a phone opens a session and publishes its GPS position to Firestore; anyone with the 8-character code watches it move on a satellite (or street) map.

## Run
1. `npm install`
2. `.env.local` already holds your Firebase web config.
3. In the Firebase console: **Authentication → Sign-in method → enable Anonymous**, and **Firestore → create database**.
4. Publish rules: paste `firestore.rules` into Firestore → Rules (or `firebase deploy --only firestore:rules`).
5. `npm run dev`. Open `/share` on a phone (GPS needs HTTPS, so deploy to Vercel and add the same env vars there) and `/watch/CODE` anywhere else.

## Structure
- `src/lib/firebase.js` — app, Firestore, anonymous auth
- `src/lib/sessions.js` — start / push / end / subscribe (all Firestore access)
- `src/lib/geo.js` — codes, distance, formatting
- `src/hooks/useShareLocation.js` — GPS watch, throttled writes, wake lock
- `src/hooks/useLiveSession.js` — live snapshot, trail, stale detection
- `src/components/LiveMap.jsx` — Leaflet map, satellite/street toggle
- `src/app/` — `/` home, `/share`, `/watch/[code]`

## Limit
Browsers pause GPS when the screen locks. For continuous background tracking, the sharing side needs a native app (Expo) using the same `sessions` documents.
