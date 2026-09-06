# NOVA · After Work

An optimistic, English-language, voice-first city simulator set in 2186. Machines provide unlimited material abundance; the player makes room for purpose, belonging, freedom and nature.

## Run

Requires Node 22.13 or newer. Clone this repository and run the commands below from its root.

The city simulation and basic commands work without an API key. To enable free AI conversations and procedural voice designs, copy `.env.example` to `.env.local`, enter your own OpenAI API key locally, then start the server. Never post or commit the key. Microphone access requires localhost or HTTPS on a deployed instance.

```sh
npm ci
npm run dev
```

## Validate

```sh
npm test
npx tsc --noEmit
npm run lint
npm run build
```

The lint script checks authored game code and tests. Generated Shadcn components are retained unchanged; the scaffold's full-catalog lint currently reports unrelated accessibility and React-compiler diagnostics.

## Playing

You are NOVA’s mayor. Start with **Meet Mira** on the map, or say “What should I do first?”. Three invitations connect real places to shared experiences: Mira’s first listening, Juno’s imperfect table and Ada’s sky watch. Choose a setting, build or reuse a place, hear another perspective and host the gathering. Your choices become saved memories; actual resident dream completions also enter the memory book. The guided chapters use local game rules and do not require paid AI calls. Choose to explore freely whenever you prefer.


On a phone, use Talk to speak English, Write to type, and Menu for Build, People, Council and Design. Tap the short reply to read the full conversation, then Continue conversation to answer. On desktop, the composer and city actions remain visible. Examples:

- “Build two gardens near homes”
- “Build three Cloudhomes”
- “Talk to Mira”
- “What is your dream?”
- “What worries you?”
- “Open the council”
- “Choose option one”
- “Pause”, “Resume”, “Make it night”, “Undo”

Drag to pan, pinch or scroll to zoom. With the map focused, use arrow keys to choose a tile, Enter to place and Home to recenter. Number keys 1–8 choose blueprints; Space pauses; V starts voice; Escape cancels building.

Reach 240 people, six building types, three council decisions and at least 75 in all four life measures. Keep playing after the charter milestone. Time pauses for council questions, dialogs, microphone input and hidden tabs.

## Voice-designed places

Open **Design** or say “Design a circular music pavilion with a green roof”. AURA returns a preview made of procedural geometric parts. Say “Make it lower and blue” to revise it, then “Build this design” (or use the button) to place it. “Discard this design” sets the proposal aside. No city construction occurs until approval.

Select an existing place on the map and use **Reshape this place**, or say “Redesign this building with terraces”. Its social purpose and housing capacity stay unchanged. New shapes and revision numbers are saved; session Undo restores the previous building state. Stale previews cannot overwrite a place that has since changed.

Talk to a resident and ask “Design a place for your dream”. Their proposal uses the same preview, revision and placement system. They can suggest a place without building it themselves.

Each design occupies one plot and combines at most 12 bounded polygonal, rounded, tapered or dome-shaped volumes. Colors are opaque. Geometry remains independent of social purpose, React and Canvas so a later Three.js renderer can reuse it. Proposals are limited to one pending design at a time; a new proposal replaces the previous preview. Multi-plot buildings, arbitrary mesh topology and material shaders are not implemented.

The optional test `NOVA_LIVE_TESTS=1 node tests/live-design.mjs` makes two short requests: a resident design proposal and a natural-language revision, followed by local approval/save validation. All passed for this build. It does not read the API key.

## Residents and conversation

Every resident has a persistent personal project, personality, perspective, trust level and bounded conversation memories. Projects advance when the city offers an appropriate place and enough freedom. Six featured characters have individually authored stories; other residents are generated deterministically.

Live mode connects to OpenAI on the server. GPT-4.1 mini generates free conversations using the character profile, real city measures, recent dialogue and persistent memories. Residents can choose a new personal project and activity, which then influence the local simulation. AURA can propose bounded, validated construction in response to open-ended player instructions. Residents cannot directly build or override city rules. Simple explicit building/time/council commands still run locally without a paid AI call.

No background AI requests run. Sending a conversational message makes one bounded Responses API request (maximum 2,400 output tokens, 25-second timeout, `store: false`). The server uses strict structured output plus independent validation and returns only the response and permitted game effects. Raw provider errors and credentials are not logged. The original hosted prototype uses a separate owner-only access gate. That hosting gate is not included in this standalone source checkout. Its per-isolate request throttle limits casual bursts, but is not a global spending cap; public AI endpoints need authentication and persistent usage budgets before broad access.

Voice input in live mode uses a user-initiated MediaRecorder clip (maximum 25 seconds) sent to the server, then to `gpt-4o-mini-transcribe`. The game does not persist audio. Browser-provided recognition remains available in local fallback mode when supported. Replies use the device’s English speech-synthesis voices. Text and touch work independently of speech support. Actual microphone capture and device-specific speech playback have not been hardware-tested; a short generated audio clip is used for the server transcription integration check.

### Server secret

`OPENAI_API_KEY` is read only by server routes, from the runtime environment. Local development can load it from the user-provided, Git-ignored `.env.local`. Never use a `VITE_` or `NEXT_PUBLIC_` prefix. Never commit the environment file, include it in an archive, print its content, or return the key from an endpoint. `/api/ai` reports only availability and the model name. For your own deployment, configure this variable in your hosting provider’s protected server-secret store. Local environment files must not be included in deployment artifacts. You do not need the maintainer’s hosting account or any private project identifiers.

The optional live test is separate from `npm test`: `NOVA_LIVE_TESTS=1 node tests/live-ai.mjs`. It makes exactly two short conversation calls and one transcription call. `NOVA_TEST_AUDIO_ONLY=1` restricts it to transcription. It expects a verified, nonempty `/tmp/nova-voice-test.wav` and a running local server. It never reads or outputs a key.

## Persistence and architecture

The city is stored only in this browser's localStorage, with validation on load and explicit save-failure feedback. No account synchronization or background progression is implemented. Clearing browser storage or confirming “Begin another NOVA” replaces the save. Buildings can be undone within the session, subject to available housing.

- `app/design.ts`: validated renderer-independent geometry and cached faces.
- `app/design-contract.ts` / `app/design-actions.ts`: proposal schema, purpose, placement and revision rules.
- `app/DesignPreview.tsx`: preview of the same geometry used in the city.
- `app/simulation.ts`: economy, placement, life measures, council and milestones.
- `app/citizens.ts`: resident profiles, projects, feelings and memories.
- `app/conversation.ts`: shared voice/text command and dialogue engine.
- `app/api/ai/route.ts`: protected server-side Responses API integration.
- `app/api/transcribe/route.ts`: bounded server-side transcription.
- `app/ai-contract.ts` and `app/ai-actions.ts`: validated context, resident plans and permitted effects.
- `app/useVoice.ts`: feature detection, recognition, error handling and spoken replies.
- `app/CityCanvas.tsx`: state-driven isometric rendering, touch, keyboard, panning and zoom.
- `app/page.tsx`: accessible UI, local save and game orchestration.
- `tests/game.test.mjs`: deterministic engine and full progression tests.

The UI uses React, Vinext, Canvas 2D and the scaffold's accessible dialog/progress primitives. It has no remote image or font dependencies. Motion respects the system's reduced-motion preference.

Optional imperative WebMCP tools are registered when `document.modelContext` is available: `read_nova_city` and `give_nova_instruction`. The browser reports both tools registered. This QA pass used real clicks and keyboard input; WebMCP execution itself was not exercised. A real browser clickthrough and responsive UX iteration were performed; see QA.md for individual pass/fail results and remaining hardware/browser-engine limits. Build, type checking, authored-code lint and 27 deterministic tests pass.

## Open development and costs

NOVA is an early open-source prototype. Contributions, forks and experiments are welcome. Source availability does not include hosted AI credits: each operator supplies and pays for their own AI access. There is no subscription, public community platform, cloud save service or shared AI allowance in this repository. Sustainable community funding is still an open design question.

Current focus: a compact phone interface, one satisfying resident story, and visible consequences. The evolving constitution and community Futures Atlas are future plans, not shipped features. See [NEXT.md](NEXT.md), [CONTRIBUTING.md](CONTRIBUTING.md) and [QA.md](QA.md).

The standalone build uses Vinext/Vite and the Cloudflare Vite plugin; `npm run build` generates a Worker-compatible server and client assets. No private Sites project is required. `npm start` runs Wrangler locally against the production build; it does not publish a server. Protect and budget AI endpoints before exposing a deployment.

## License

MIT — see [LICENSE](LICENSE). Preserve the copyright/license notices and the
[third-party notices](THIRD_PARTY_NOTICES.md). Modification, redistribution and
commercial use are permitted; AI services and hosting remain separately funded.
