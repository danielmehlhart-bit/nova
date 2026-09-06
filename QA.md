# NOVA — browser clickthrough and fixes

Date: 2026-09-06. Target: the user's existing `http://localhost:3000/` tab in the Codex in-app browser. Tested with real browser clicks, typed input, keyboard actions, reloads, screenshots, accessibility/DOM checks and browser console inspection. Browser interactions used CUA; deterministic engine tests supplement the clickthrough.

Viewports: existing desktop (approximately 1179×1210), 390×844, 320×568, and landscape 844×390. Temporary viewport overrides were reset at the end. These are responsive browser tests, not physical iPhone/Android testing.

## Final pass/fail record

| ID | Scenario and evidence | First result | Final result |
| --- | --- | --- | --- |
| 01 | Select existing Wonder Lab → Reshape → type “Redesign this place as octagon” → Send | FAIL: generic rejected-design response, repeated | PASS: octagonal preview on the same plot, preserving atelier purpose |
| 02 | In preview, type “Make it lower and blue” → Send | Not previously tested | PASS: visibly lower, blue octagonal design |
| 03 | Reload pending design → open Design | Not previously tested | PASS: named blueprint and plot preserved |
| 04 | Build/apply preview → inspect city → palette Undo | Not previously tested | PASS: revision 1 appeared on existing Wonder Lab; Undo restored the previous building |
| 05 | Failed design request recovery | FAIL: cleared input and vague failure; stale error after fallback | PASS: failed text retained for editing, clearer explanation; successful text commands clear stale AI/microphone errors |
| 06 | Click “Build two gardens near homes” → Build palette → Undo | Not previously tested | PASS: two gardens reported and placed; Undo removed the test change and updated conversation feedback |
| 07 | Find a resident: nonsense search, then “Mira”, then select result | Not previously tested | PASS: helpful empty state, one matching resident, correct speaker and live reply |
| 08 | Ask Mira “Design a place for your dream” | FAIL repeatedly: malformed color strings rejected as geometry | PASS after fix: “The Unnamed Resonance” preview, explicitly attributed to Mira; no construction without approval. Test proposal discarded |
| 09 | Mobile design dialog voice/text composer | FAIL: input below long descriptions | PASS at 390×844 and 320×568: voice/text area stays visible while content scrolls |
| 10 | Council → “Make it a shared experiment” → reopen Council | Not previously tested | PASS: choice removed, journal updated, next event day 12, shared-story progress 1/3 |
| 11 | Pause + mute spoken replies → Reload | FAIL: both reset | PASS: “Resume time” and “Enable spoken replies” retained; city remained at day 5 |
| 12 | Garden tool → focus map → ArrowRight → Enter on road → ArrowRight → Enter on free plot → Undo → Escape | Not previously tested | PASS: road rejected, free plot built, Undo restored it, Escape left build mode |
| 13 | Day/night switch and two zoom-in clicks | Not previously tested | PASS: visible night colors and larger geometry; restored daylight and normal zoom |
| 14 | Small-screen navigation and world visibility | FAIL: tiny initial island, unlabeled icons, overlapping controls; Design label clipped at 320px | PASS: closer map, readable menu labels, compact title, no clipped Design action, usable map controls |
| 15 | Landscape 844×390 | FAIL: fixed 420px minimum forced page overflow | PASS: entire primary interface fits; named menu actions remain visible |
| 16 | Escape from Design → Help → Begin a new city → Keep this city | Not previously tested | PASS: modal focus returns, help accessible, reset requires explicit confirmation; Cancel preserved the city |
| 17 | Click microphone, then use typed “Pause” after device failure | Environment cannot open a microphone | PASS for error/fallback UI: helpful message, text command works and clears stale error. Actual recording/transcription/playback in this browser remains BLOCKED by microphone availability |
| 18 | Fresh desktop reload and browser console | FAIL: server/client progress-label locale mismatch | PASS: explicit English progress locale; no new browser errors/warnings captured after final reload |

No failing application case remains in the tested set. This is not a claim that all possible inputs, devices or long-running states are bug-free.

## Root causes and changes

- Model colors sometimes arrived as `efbe8e` rather than `#efbe8e` (confirmed by a temporary diagnostic restricted to geometry fields). Canonicalize missing-prefix/short hex colors; enforce the six-digit hex pattern in the output schema. Removed the temporary diagnostic afterward. No keys, credentials or raw provider errors were logged.
- Fit finite generated dimensions into bounded plot geometry before independent final validation. Preserve name, color and polygon intent; reject unsupported colors, non-finite numbers and executable/URL-like values. No extra model request is used for repair.
- Keep failed requests editable; avoid stale error/status text after successful actions. Isolate design replies so reopening a saved draft does not show unrelated welcome text.
- Keep the design voice composer visible during scrolling. Differentiate Apply redesign from creating a new place. Name icon controls accessibly and expose labels at narrow breakpoints.
- Improve mobile map scale and selection focus, compact high-contrast world heading, responsive control placement and landscape height. These are usability corrections, not the deferred Three.js redesign.
- Persist pause and spoken-reply preferences. Use the same English number locale in server/client progress controls.

## Supporting verification and limits

- 23 deterministic tests cover generated geometry fitting, malformed colors, save validation, revisions, stale targets, placement, progression and free-question routing.
- Type checking, authored-code lint and production build pass.
- Real browser requests exercised both AURA and resident design generation, a free revision and a resident conversation. Earlier direct API tests are documented in README.
- Not claimed as tested: physical-device microphone and speech playback, touch hardware/pinch gestures, Safari/Firefox/Android engines, sustained FPS or GPU/thermal behavior.
- Onboarding narrative and Three.js graphics remain deliberately deferred in NEXT.md.

## Private publication — 6 September 2026

Deployment checks were performed on the maintainer’s private instance. Its access configuration and credentials are not part of this repository.

- PASS: owner-only access verified, protected server secret present with no plaintext returned, source and packaged output contain no key.
- PASS: first deployment succeeded; the actual HTTPS page loads and reports Live AI.
- PASS: AURA answered a free question about meaning after material abundance through the hosted API.
- FAIL discovered on the hosted page: “what could make tomorrow meaningful for people who already have everything?” opened People because “people” plus “who” matched a menu shortcut.
- Correction: require an explicit introduction/list request for the People shortcut; regression coverage includes the reproduced question and valid menu requests. Ordinary questions remain available to the AI conversation.
- Device-local saves remain separate across browsers and devices; this release does not add cloud save synchronization.
- PASS after deployment of version 2: the exact previously failing “people who already have everything” question receives a relevant live AURA answer without opening People. No browser errors or warnings were reported.
- PASS: authenticated production `/api/ai` reports enabled; production `/api/transcribe` recognizes the existing short speech fixture. This validates hosted transcription, not physical handset microphone capture or playback.
- Version 2 is live with server environment revision 1. All 23 tests, type checking, lint and the production build passed before publishing.

## Standalone open-source checkout — 6 September 2026

- Private hosting metadata and original development history are excluded. The public checkout has its own standalone Vite/Cloudflare configuration.
- The current server key is absent from the original Git blobs and the public source. No secret file or personal family detail is included.
- Updated the affected pinned React, Vinext, Vite and Cloudflare toolchain packages to available security fixes; npm audit reports zero known vulnerabilities at this snapshot. This is not a guarantee of vulnerability-free software.
- All 23 deterministic tests, type checking, authored-code lint and the standalone production build pass without a Sites project.
- Paid live tests are optional and were not repeated with maintainer credentials in the public checkout. Hosted AI/voice checks above refer to the separate private deployment.
