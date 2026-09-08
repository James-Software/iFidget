# iFidget

A premium, mobile-first sensory playground for iPhone, built with React and Next.js. Deploy to Vercel using the Next.js preset.

## Development
- `npm install`, `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck`, `npm test`.
- Keep interaction logic in `components/fidget-playground.tsx`, sound in `lib/feedback.ts`, catalog data in `lib/fidgets.ts`, and visual styling in `app/globals.css`.
- Keep core interactions local. No accounts, analytics, microphone, or external sound downloads are needed.

## Interaction requirements
- Sound belongs to a discrete state change: a popped bubble, a depressed key, a switch flip, or a crossed detent. Never make repeated sounds from holding or generic pointer movement.
- Use `lib/snaps.ts` for wheel and zipper detents, including hysteresis and angular wraparound. Use `lib/press.ts` only for tap toys with an immediate discrete state change.
- Default to a white, monochrome interface. On phones the play view contains only an upright toy and the fully rounded More Fidgets button at the bottom. Put secondary controls in the chooser. Respect reduced-motion preferences for blur transitions.
- Keep collection previews memoized and avoid updating page state for each interaction.
- Use Pointer Events with capture and handle pointer cancellation. Touch targets must be at least 44px.
- Request motion permission only from an explicit user gesture. Always retain touch fallbacks.
- Safari does not expose standard vibration on iPhone. Feature-detect `navigator.vibrate`; never promise vibration when unavailable. Sound and visual feedback must work independently.
- Start Web Audio only after user interaction. Respect mute, reduced motion, background visibility, and cleanup of animation frames, timers, and listeners.
- Make fidgets keyboard operable. Use descriptive button labels and visible focus styles.
- Preserve safe-area padding, narrow-screen layouts, and zoom accessibility.

## Verification
- Run a production build and TypeScript check for functional changes.
- Verify sensor permissions and physical haptics on real hardware before claiming they are tested.
- Keep the project Vercel-ready; do not publish without a user request.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
