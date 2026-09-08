# iFidget

A touch-first, premium pocket playground with twelve interactive fidgets. Built with Next.js and React, with synthesized Web Audio sounds and optional device motion.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. Use `npm run build`, `npm run typecheck`, `npm run lint`, and `npm test` to verify changes.

## Deploy to Vercel

Import this repository in Vercel and choose the **Next.js** framework preset. The build command is `npm run build`; leave the output directory on its default. No environment variables or external services are required. Alternatively run `vercel` from the project directory if you already use the Vercel CLI.

The project uses standard Next.js scripts and has no hosting-provider-specific runtime dependencies.

## iPhone behavior

- Sound starts after a tap, follows mute, and suspends when the page is hidden.
- Use Settings → Tilt & shake to grant motion permission. Gravity responds to accelerometer gravity data; Rain stick responds to shake acceleration. Both also work with touch or keyboard.
- Motion requires HTTPS (provided by Vercel) or localhost. Opening the dev server through an unsecured LAN address does not enable motion on iPhone.
- Standard `navigator.vibrate` is feature-detected. Safari on iPhone does not expose it, so the app honestly reports vibration unavailable and retains visual and audio feedback. A website cannot guarantee native iPhone haptics.
- Safari → Share → Add to Home Screen opens the experience as a standalone web app. An internet connection is still required; offline caching is not implemented.
- Only sound, haptic preference, and favorites are stored locally. No sensor data is uploaded.

## Fidgets

Pop it, Switchboard, Click wheel, Gravity, Key crush, Still water, Orbit, Zip it, Bubble wrap, Soft landing, Rain stick, and Squish. Reset starts the current toy fresh; the heart saves favorites; expand enters focus mode.

Physical sound, motion permissions, and vibration should be verified on a real iPhone before a public release. Desktop production checks cannot verify hardware behavior.
