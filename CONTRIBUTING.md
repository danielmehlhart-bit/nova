# Contributing to NOVA

Thanks for helping explore a hopeful future through a playable city.

NOVA is an early prototype maintained in spare time. Small, focused contributions
are easier to review than a new framework or a large feature bundle. Start with
[NEXT.md](NEXT.md) and open an issue before a substantial architecture change.

## Current priorities

1. Give the city more room on phone screens; make voice, touch and typing usable.
2. Build one enjoyable resident story with clear choices and visible consequences.
3. Improve accessibility, reliable saves and reproducible bug reports.

The constitution, governance experiments and community atlas are a longer-term
direction. Please distinguish implemented behavior from ideas in proposals and PRs.

## Local development

Use Node 22.13 or newer, run `npm ci`, then `npm run dev`. The simulation and basic
commands do not require an API key. Optional live AI requires your own key in
ignored `.env.local`; see `.env.example`. Each operator funds their own API usage.

Before a PR, run:

```sh
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Describe the problem, the resulting behavior and how you checked it. Include a
screen recording or screenshot for UI changes when useful, after removing private
content. For phone changes, state the device/browser and distinguish emulation
from real hardware. Do not claim microphone or touch support from emulation alone.

Live integration tests are optional, explicitly enabled and bill your own API
account. Normal tests must remain deterministic and free of network/API charges.

## Design principles

- English is the primary UI language; voice must have usable text/touch alternatives.
- Residents have agency. A dream can change; fulfillment is not an employment quota.
- Keep the game optimistic while allowing disagreement and difficult questions.
- Governance comparisons must state assumptions and expose tradeoffs; an AI
  simulation is not evidence that a political system will work in reality.
- Preserve existing saves and validate all AI proposals before applying effects.
- Keep geometry independent of simulation and React. Measure performance before
  replacing the renderer or adding a heavier engine.
- Do not add continuous per-resident AI requests or surprise background charges.

## Secrets and third-party material

Never include API keys, `.env.local`, credentials, voice recordings, private chats,
account-specific hosting settings or machine-local paths in a commit or issue.
An `.env.example` must contain only empty values or obvious non-secret examples.

Submit code and assets you have permission to contribute under the repository's
license. Preserve third-party notices and identify new asset/dependency licenses.
Submitting a contribution does not transfer your copyright to the maintainer.

Please discuss ideas and implementations respectfully; do not target contributors
or real groups of people. Community hosting and funding remain open questions.
