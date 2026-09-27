# TripDibo

A personal travel workspace for plans, bookings, tickets, and a Gemini travel assistant. Built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, and Zustand.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. For a production build, run `npm run build` followed by `npm start`. Run `npm run lint` for lint checks.

## Gemini assistant

1. Create a key in [Google AI Studio](https://aistudio.google.com/apikey).
2. Copy .env.example to .env.local and set GEMINI_API_KEY. Keep the key server-only; never prefix it with NEXT_PUBLIC_.
3. Restart the Next.js server, then open **AI assistant** in the main navigation. Choose a trip or create one there.
4. Use **Check AI connection** to verify that the key can access the configured model.

GEMINI_MODEL defaults to gemini-3.8-flash, listed in Google's current [pricing](https://ai.google.dev/gemini-api/docs/pricing) and [structured-output documentation](https://ai.google.dev/gemini-api/docs/generate-content/structured-output). Set another available Gemini text model in .env.local if needed. Free-tier access has quotas and availability requirements; paid-project billing follows Google's terms. The app does not enable billing or automatically switch to another model.

No Ollama process or local model download is needed. Existing ai:start/ai:pull helpers are retained for older local setups but are not used by the assistant.

The server sends your recent chat and selected trip context to Google Gemini: destination, dates, traveler count, budget, itinerary, booking schedules and costs, expense descriptions and amounts, and packing names. Ticket files, booking references, guest names, booking notes, and booking links are excluded from automatic context. Chat is sent as written. Google's free tier may use submitted content to improve its products; see its [terms](https://ai.google.dev/gemini-api/terms).

Responses are structured itinerary, budget, and packing drafts. Changes require an explicit apply action. The app checks dates, currencies, and amounts, calculates totals, avoids counting linked booking payments twice, and skips matching plans. Gemini has no live price, availability, browsing, payment, or booking tools in this integration. Costs are estimates.

Requests use Google's HTTPS API with the key in a server-only header. Connection checks retrieve model metadata without generating content. Clear errors cover missing/invalid keys, unavailable models, quotas, blocked responses, timeouts, and invalid output. No key or raw provider diagnostic is returned to the browser.

This is still a local personal workspace without accounts. Add authentication and per-user quota controls before exposing its server API publicly.

## What you can do

- Create and edit trips with dates, destinations, cover photography, travelers, currencies, and budgets.
- Search, sort, filter by travel status, switch grid/list views, and save favorite trips.
- Create and edit dated itinerary entries, organized by day and time.
- Start with Relaxed, Adventure, or Culture templates. Templates add up to three days within your trip dates and a packing checklist; identical existing entries are skipped.
- Track expenses, remaining budget, and the equal share per traveler in the trip currency.
- Save hotels, flights, bus/train tickets, car reservations, and other bookings with references, operators, routes, local times, timezone labels, seats/rooms, guests, status, links, and notes.
- Attach up to three PDF or image documents per booking, up to 5 MB each, and download them later.
- Add bookings to the itinerary; repeated additions update the existing linked entry.
- Optionally link each booking to one expense that updates with its cost. Removing a booking retains the recorded payment. Cancelling a booking does not imply a refund.
- Chat with the Gemini AI assistant and review itinerary, budget, and packing proposals before saving them.
- Assign and check off packing items, and collect and vote on ideas.
- Export a trip or the entire workspace as JSON using the download controls.
- Use the responsive mobile navigation and persistent light/dark appearance.

## Storage and boundaries

Trips and booking records use this browser's local storage. Ticket files use IndexedDB in the same browser. The existing `tourdibo-trip-storage-v2` key is retained to preserve earlier trips. There is no account, cloud sync, or live multi-user collaboration. Clearing site data removes local records and documents. JSON exports contain document metadata, not document bytes; download important ticket files separately. An import UI is not currently provided. Local records are not encrypted by the app.

Currencies label entered amounts; changing a trip's currency does not convert existing expenses. Bookings in another currency are excluded from trip totals until their cost is entered in the trip currency. Manually changing a trip budget or currency clears an outdated AI budget breakdown. Equal shares are planning estimates, not payment settlements. Trip starters are editable templates.

Cover photography loads from Unsplash. Google fonts load through Next.js font optimization. Internet access is needed for those assets; saved records stay in this browser, while assistant requests send the selected context to Google.

## Implementation

- `src/app/page.tsx`: dashboard, discovery, saved trips, filters, and export.
- `src/app/trip/[id]/page.tsx`: itinerary, budget, packing, and ideas workspace.
- `src/components/TripForm.tsx`: shared trip creation and editing.
- `src/components/Modal.tsx`: native accessible dialog, keyboard dismissal, focus restoration, and scroll locking.
- `src/store/useTripStore.ts`: persisted trip data and related actions.
- `src/lib/travel.ts`: date, status, currency formatting, image presets, and download helpers.
- `src/components/BookingsPanel.tsx`: bookings and ticket forms.
- `src/components/AssistantPanel.tsx`: chat and proposal review/application.
- `src/app/assistant/page.tsx`: direct AI entry point and trip selection.
- `src/app/api/assistant/route.ts`: Gemini connection status and structured generation.
- `src/lib/assistant.ts`: context allowlist, instructions, and response validation.
- `src/lib/ticket-files.ts`: IndexedDB document storage.

## Verification

Run `npm test`, `npm run lint`, and `npm run build`. Tests cover booking validation, expense synchronization, persistence compatibility, model-context privacy, cost calculations, proposal validation, and the assistant API contract. API tests substitute Gemini responses; live generation additionally requires a valid key and available quota.
