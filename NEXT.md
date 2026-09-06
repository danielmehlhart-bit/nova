# NOVA — next chapters

## Current build: founding a community (6 September 2026)

The newly authorized redesign is implemented as the default game. `NOVA-REDESIGN.md` records actual scope and deferred systems; `playtests/2026-09-06-founding.md` records the current test pass. Earlier roadmap sections below remain historical context and future work.

- [x] Empty-land introduction, explicit mayor role, first housing and real arrivals.
- [x] Flexible housing beyond the example camps/towers: custom size, privacy, setting, name and procedural courtyard shape; existing housing can adapt.
- [x] Thirteen starting places, editable daily programmes and real neighborhood effects.
- [x] Autonomous choices, friendships, resident-initiated circles, meetings, memories and voluntary relocation.
- [x] Six chapters, evolving charter, citizen decisions with real votes and review cooldown, group-aware reports.
- [x] Three.js scene with softened forms, animated resident bodies, map indicators, paths, day/night lighting and instanced rendering.
- [x] Compact phone controls, shared voice/text, free AI using the actual new world context, separate legacy save, export/import/backup restoration.
- [ ] Physical iPhone/Android microphone, GPU, keyboard and thermal testing; browser emulation cannot establish these.
- [ ] Human opening-playtest: observe first action, emotional connection, one understood consequence, and desire to continue. Refine before increasing content volume.
- [ ] Richer character assets/animations, interiors and pathfinding; multi-plot procedural designs.
- [ ] Broader society simulation and public community constitution experiment, with persistent global cost budgets before public AI access.

## Open-source development

Public repository: https://github.com/danielmehlhart-bit/nova

Open source is a core project principle. NOVA is released under MIT so other developers can inspect, modify, fork and contribute. Keep the roadmap and simulation assumptions understandable. Source availability does not include free AI credits or access to a maintainer’s private deployment. Community operating costs and funding remain unresolved; private playtesting, compact mobile UI and the first enjoyable story stay the immediate priorities.

See CONTRIBUTING.md for the current scope and contribution workflow.

## Current direction — focused playtesting first (6 September 2026)

The long-term vision is a participatory futures experiment with a playful city-building core. The immediate priority is much smaller: make NOVA enjoyable and understandable on phones. The creator is exploring the concept, not committing to building a large community platform now.

An independently operated private prototype has been deployed. Live AI replies and hosted speech transcription have passed smoke tests. The compact mobile UI is implemented; the player still lacks a clear first action, emotional attachment and an enjoyable progression loop. These are the next product problems to solve. English remains the primary game language; voice and touch/text must all work.

Priority order:
1. Compact mobile interface: give the city most of the screen.
2. One complete 10–15-minute personal story with visible consequences and a satisfying ending.
3. Playtest that small experience with the creator, record friction and enjoyment, then iterate.
4. Only after the small experience is enjoyable, expand chapters and the evolving constitution.
5. Community publishing/voting, monetization, research partnerships and a renderer migration remain later work.

This document records plans, not features already implemented. Preserve the working private game, existing saves and protected AI/voice setup. Do not interpret the future vision as an instruction to build every feature now. Publishing the source does not change access to the separately hosted prototype or configure paid services.

## First playable story — implemented after the 15-minute baseline

See `playtests/2026-09-06-flow.md` for the measured 15m46s baseline and observed failures. This is an agent playtest, not a human retention study.

- The map now states **You are the mayor** and offers a persistent next action. Fresh cities wait for the first invitation or an explicit choice to explore before time/council prompts compete for attention.
- Three short chapters: Mira’s first listening, Juno’s imperfect table and Ada’s shared sky watch. Choose a setting, create or reuse a real place, respond to another perspective, host a gathering and keep a personal memory.
- Construction and hosting return to the city view. A small named gathering marker makes the event locatable; full graphical detail remains deferred.
- Gathering choices produce different authored memories and resident recollections. Actual dream completions also enter the memory book, once per dream. Mira’s optional short musical sketch uses device audio.
- Core chapter actions work locally through buttons or the shared voice/text command channel. Story windows include a microphone action. Free AI receives the real chapter/memory context and the explicit mayor role; conversations alone must not invent completed events.
- The next city-wide goal explains what is still missing, including individual quality measures. Conversation history opens at the latest message.

Next: have a human play this opening without explanation. Observe the first action, one emotional connection, understanding of a choice, and whether the next invitation feels worth pursuing. Adjust pacing from that evidence; three authored invitations are a small first slice, not a finished long-term retention system. Add more visible consequences in the later art pass before expanding content volume.

## Mobile interface — first slice implemented; handset validation next

Player report: the AURA/conversation area occupies nearly half of the smartphone screen. The city is difficult to see and interact with.

Implemented on 6 September: a 111px collapsed Talk / Write / Menu dock, one-line reply preview, dismissible conversation sheet with a direct reply action, contextual build palette, preserved drafts, visible active/error states and larger touch targets. Responsive clickthrough passes at 320px and 390px, reduced height, landscape and desktop; see QA.md. A guided next-action card and three playable invitations now follow this slice; physical handset validation remains pending.

Proposed first implementation slice:
- Collapse AURA into a narrow bottom dock with a large microphone action, a way to type, and an expandable conversation/menu control. Show at most one short reply preview while collapsed.
- Open the full conversation in a dismissible bottom sheet on tap or swipe. Preserve messages, the current speaker and unfinished text when it closes. Provide explicit buttons as alternatives to gestures.
- Keep only one contextual objective card on the map, with a clear next action; details and city statistics open on demand.
- Collapse the conversation after a completed exchange when appropriate; do not automatically hide an input in use, a permission/error message, or a decision awaiting the player.
- Account for keyboard, safe-area insets, portrait/landscape and long replies. Make speech playback interruptible. Keep AI loading and microphone states understandable without a large permanent panel.
- Retain access to Build, People, Council, Design, undo and help through the compact menu. Avoid stacking several panels over the world.

Acceptance targets:
- With keyboard and sheets closed, roughly two-thirds or more of the usable portrait screen remains available to the world; judge actual usable map area, not just nominal canvas size.
- At 320px and 390px widths, the primary action is easy to tap and the player can select a plot without closing multiple overlays.
- Opening/closing a conversation and switching speakers does not lose input or context. A failed microphone attempt leaves a usable typing path.
- Test on the deployed private version and, when the creator can, a physical phone. Desktop emulation cannot establish handset microphone or touch behavior.

## Next: prove one enjoyable play loop

Prototype loop: notice a person or event → become curious → choose or design something → see the world change → receive a personal reaction → discover the next possibility.

The first slice should have one main resident, one central wish, a small number of meaningful choices and an ending. Use Mira's music gathering below. Offer both a quick placement option and optional free design; architectural editing must not block the story. A quieter neighbouring activity introduces a second person's perspective only after the first success.

Pacing proposal, to test rather than treat as a fixed formula:
- First minute: meet Mira, understand the mayor's role and see one useful next action.
- Minutes 1–5: choose a place, create or adapt it, and immediately see Mira approach/use it.
- Minutes 5–10: another resident joins or responds; an understandable tension invites a small revision.
- Minutes 10–15: a modest shared event, a personal response, and a first provisional principle for the city. Offer a new thread of curiosity and a comfortable place to stop.

Reward and emotional feedback:
- Immediate: a responsive placement animation, an optional short sound and a clearly changed place.
- Personal: the resident notices the player's actual choice, remembers it and later refers to it.
- Social: someone joins, a friendship or shared activity becomes visible, and the place acquires a story.
- Creative: the player's design and decisions make this city recognizably theirs.
- Discovery: a new question, surprising resident idea or small new possibility follows an action.
- Completion: a short recap of what became possible, with a next optional step. Avoid depending only on percentage bars or population totals.

Treat the user's request for “dopamine hits” as a request for satisfying feedback, curiosity and momentum; do not claim a measured neurological effect. Use meaningful accomplishment and variety, not obligatory daily streaks, penalties for absence, paid random rewards or artificial waiting. A resident can change or abandon a dream and still have a good outcome; fulfillment is not a productivity quota.

Implementation boundary: keep story beats, eligibility conditions, completion checks and consequences explicit in the simulation. AI supplies bounded dialogue and proposals grounded in that state; it must not invent completed objectives or secretly grade a political preference. Reuse the current renderer with a few readable movements, reactions and visual cues. No engine migration is required to test this loop.

Private playtest questions:
- Can the creator say what to do next after the first minute without external explanation?
- Does the first action produce a visible consequence within a few minutes?
- Does he recognize/care about Mira and remember why he made a decision?
- Does he voluntarily want to see the next event, and can he also stop without feeling penalized?
- Where does he hesitate, lose the map, miss feedback or find dialogue repetitive?

Record pass/fail usability findings and separate subjective enjoyment notes in QA.md. Iterate one observed problem at a time. Do not expand the feature set simply because the first test is not fun; improve the existing loop first.

## Implemented: voice-designed places

Design and modify buildings and places through natural speech, with procedural geometry beyond the fixed building catalog. Residents contribute their own design ideas.

Acceptance criteria:
- Separate a place’s social purpose from its geometric shape.
- Generate geometry from a bounded, declarative design; never run model-generated code.
- Preview, revise, build and undo designs through the existing simulation/placement rules.
- Let residents propose designs through that same pipeline, leaving the decision to the player.
- Preserve existing saves and keep geometry practical for mobile devices.

Delivered in this chapter:
- A Design panel with a procedural preview, voice/text revisions, explicit build/discard, and resident proposal attribution.
- Layered polygonal/rounded/tapered volumes and dome caps, with bounded dimensions and colors. Preview and city rendering use the same generated geometry.
- Selected existing places can be reshaped while preserving their social purpose and capacity. Revisions persist in existing saves, with session undo and stale-preview protection.
- Natural-language prompts use the existing protected AI/voice pipeline; the fixed catalog remains available.
- Two short live API checks passed: a resident's original five-part design and its free-language revision; approval then placed a valid persistent building.

Current scope: one plot per design, one pending proposal at a time, up to 12 geometry parts, opaque colors, and the existing Canvas renderer. No arbitrary topology, transparent materials, procedural scripts or multi-plot footprints. Three.js and richer scene detail are explicitly deferred below. The 23 deterministic tests cover geometry bounds, save compatibility, proposal/approval, revisions, stale targets, placement protection and free-question routing. Browser interaction and responsive UX were subsequently tested and corrected (see QA.md); the latest phone feedback above establishes further usability work. Physical-device audio, other browser engines and sustained FPS validation remain outstanding.

## Story material for the first playable slice

The current interface offers tools and an open world without a personal reason to act. Replace that uncertainty with a short, optional story built around: meet a person → understand a wish → make something possible → see what happens.

1. A “Begin with voice” action lets AURA introduce the player’s role: everyone is provided for; the player makes room for meaningful lives. AURA introduces Mira.
2. Mira wants to make music with people who think they have no talent. The player can ask questions, help or suggest something else.
3. A small current-goal card (“Help Mira make room for music”) offers a speakable, clickable suggestion and shows a suitable place on the map.
4. Make consequences visible: construction, Mira visiting, neighbours joining, then a personal response (“We sound terrible. We’re meeting again tomorrow.”). Numbers alone are insufficient feedback.
5. Introduce an everyday ethical question: another resident wants a quiet garden nearby. Let the player explore coexistence rather than a single correct answer.

After the introduction, a discreet “What’s happening next?” card should show a resident wish, why it matters, and one possible action. AURA should answer “What could I do now?” from the real game state. Keep the introduction skippable and residents autonomous; avoid turning their lives into a mandatory task list.

This chapter was previously deferred. The latest discussion promotes it to the next planned gameplay slice, after compacting the mobile interface. First prove this one story before building the full constitution or community systems below.

## Later vision: mayor of a city after compulsory work

Premise: machines and AI guarantee material abundance. The player is a mayor who shapes places, institutions and ways of living together. The core question is: “We solved the problem of having enough. How do we build a good life together?” This is an explicit fictional premise, not a prediction that automation will resolve every real-world problem.

Residents are intelligent, autonomous people with dreams, relationships, doubts, memories and changing opinions. They can disagree with the mayor, refuse participation or start their own projects. The mayor can enable opportunities and propose rules, but cannot compel fulfillment or agreement. Optimism comes from the ability to understand one another, revise rules and create possibilities despite uncertainty.

Foundational themes:
- Money: with housing, food, health and material needs guaranteed, does money serve any purpose? Explore moneyless access, equal optional allowances and voluntary exchange without making survival conditional on work.
- Allocation: distinguish material abundance from non-replicable locations, personal attention and consensual participation. Compare rotation, waiting lists, lotteries and invitations. A moneyless city can still develop exclusion and status differences.
- Meaning: nobody must justify their existence through usefulness, yet people may want to contribute or feel needed. Include rest, care, craft, self-chosen difficulty and the right to change direction.
- Childhood and learning: “What should our children become?” opens questions about curiosity, belonging, care and chosen challenges in a world without compulsory work.
- Example story, “What Should I Become?”: a parent asks what to tell a child who wants to be a doctor when AURA can already heal exceptionally well. Speak with the child to discover whether they love biology, caring for people, difficult learning or something else. Different answers lead to different places and opportunities; avoid prescribing one correct life.
- Everyday dilemmas: a music festival versus quiet; perfect personalization versus unplanned encounters; collective memory versus privacy; shared activity versus the right to withdraw.

Possible chapter arc:
1. **A Place to Begin** — help residents discover a first self-chosen direction.
2. **Finding Each Other** — individual dreams become a shared project.
3. **Room to Disagree** — respond to conflicting needs without erasing a person's perspective.
4. **The First Charter / Festival of Possibility** — recognize the city's emerging principles and celebrate what happened.

Keep an immediate action, a chapter objective and an optional longer horizon legible. The festival begins when the player and story are ready, without punishing real-world absence. It provides closure while the city can continue afterward.

## Later vision: an evolving constitution and open governance experiment

The constitution emerges from actual decisions, resident deliberation and consequences. Each article records its origin, objections, observed effects and revision history. It begins with provisional principles rather than a large setup questionnaire. Example: after creating space for someone who wants solitude, the city debates a right to withdraw from collective activity without losing access, dignity or belonging.

Governance itself is open to examination, including current democratic arrangements at municipal level. Avoid left/right labels as shortcuts or a predetermined winning system. Explore elected councils, rotating randomly selected citizen assemblies, direct participation, delegable votes, expert councils, AI-assisted administration, strong mayoral authority and hybrids with different rules for different issues.

For each arrangement, ask who decides, who may dissent, who checks power, how errors are corrected and how rules can change. The mayor can devolve their own authority. Possible pivotal scene: “You helped us build this city. Should you still be the one who governs it?”

Shared test situations across governance arrangements:
- A popular decision burdens a small minority.
- The AI makes a consequential mistake despite a strong past record.
- Some residents do not want to participate in decisions.
- Decision-makers resist giving up authority.
- An apparently successful policy has unexpected effects.

Example council question: “AURA consistently makes better predictions than the council. Should it also make the decisions?” Explore what “better” means and who chooses the objectives. Do not conflate predictive accuracy with legitimate authority.

The simulation cannot be value-free. Publish its assumptions and inspect multiple outcomes—well-being, self-determination, protection from arbitrary power, participation burden, exclusion, adaptability—rather than hiding an ideological preference inside one score. Different players may weigh these differently; individual consequences remain visible. AI-resident behavior is not empirical proof that a real political system would work.

## Later vision: the NOVA Futures Atlas

Different players become mayors of different cities and develop different constitutions. The community compares, discusses and develops these futures together. This goes beyond the current private prototype and is not required for the creator’s next playtest.

Proposed features:
- Public city pages containing a constitution, important decisions, open questions and declared simulation assumptions.
- Shared starting scenarios/challenges to make comparisons more meaningful.
- Copy and revise another city's constitution with visible attribution and version lineage.
- Read-only visits and short experiences from a resident's perspective before evaluating a city—for example a parent, a socially isolated person or someone who disagrees with the majority.
- Community assessments of desirability, practical clarity, resilience under disagreement, revisability and possible real-world relevance. “Realistic” needs these distinctions; popularity alone is not validation.
- Periodic syntheses of recurring principles, contradictions, counterarguments and unexpected ideas. Preserve interesting minority proposals as well as popular ones.

Sharing proposal: clearly disclose during entry that a participating city contributes its constitution and a decision summary to the Atlas by default, under a city name/pseudonym. Offer a private mode. Do not automatically publish private conversations, voice recordings or personal information. Sharing and deletion controls must be designed before community launch; the existing private site's access must not silently change.

Longer-term output: a living public report or collection of possible futures, including the assumptions and limits of the exercise. Community votes indicate participants' views, not a representative public mandate. Consider funding/access effects on who participates; paid support must not buy extra voting weight.

## Later: positioning, public launch and sustainable AI costs

Working positioning: **NOVA — A Living Futures Experiment**.

Campaign line:
> **NOVA — What comes after work?**
> Build a city where everyone has enough. Discover how we want to live.

Pitch for the planned experience: become mayor of a future city where machines do the work and people have their own dreams, doubts and ideas of a good life. Shape places, question money, education and governance, develop a constitution with residents, and compare your future with those imagined by others. Do not advertise these planned community/story features as already available.

Promotional material could show a brief playable dilemma—“What should our children become?” or “If an AI makes better decisions, should it govern?”—and invite the viewer to make a choice. Establish an enjoyable small game before running a broad campaign.

Proposed sustainable operation:
- Give NOVA its own API project, protected server credential and operating budget. This separates project management; it does not make inference free or automatically transfer charges to players. API billing is separate from ChatGPT subscriptions.
- Start with the creator’s private test. Later, consider an invited pilot of 50–100 people to measure actual cost per session, dialogue quality and voluntary return before choosing prices or public quotas.
- Potential model: a complete free introductory chapter, then a supporter subscription with a clear conversation allowance. Sponsors, educational partners or research funding could fund free places without determining constitutional outcomes. No price or funding arrangement is committed.
- Keep most simulation and routine resident behavior local/deterministic. Use AI for meaningful conversations, proposals and selected deliberations; do not run continuous paid model calls for every resident.
- Before broad public access: implement accounts, persistent per-user usage accounting, request/concurrency limits, bounded inputs/outputs, abuse controls and a global application budget. The current in-memory rate limiter is not a durable global spending cap.
- Configure explicit provider hard spend limits as an additional control, with alerts before exhaustion and a useful limited/offline mode. Provider enforcement can lag slightly; do not promise a perfectly exact financial ceiling. Funded usage still needs sufficient provider rate limits and concurrency handling.
- Measure tokens, audio duration, retries and peak use before pricing. Hosting, storage, moderation, payment fees and support are additional costs. Own-key access could be an optional advanced route later, with appropriate secret handling, rather than a requirement for ordinary players.

Illustrative pricing snapshot checked 2026-09-06, not a measured NOVA session: GPT-4.1 mini at $0.40/M input and $1.60/M output tokens; gpt-4o-mini-transcribe estimated at $0.003/minute. Thirty requests averaging 6,000 input and 500 output tokens plus five minutes of audio cost about $0.111 in those API charges, or $111 per 1,000 such sessions. Cached inputs, longer histories, generated designs, retries and model changes affect the result. Current spoken replies use device speech synthesis; this example does not include paid voice generation. Recheck prices before budgeting.

Sources:
- [Separate ChatGPT/API billing](https://help.openai.com/en/articles/9039756)
- [GPT-4.1 mini pricing](https://developers.openai.com/api/docs/models/gpt-4.1-mini)
- [Transcription pricing](https://developers.openai.com/api/docs/pricing)
- [Spend alerts and hard spend limits](https://developers.openai.com/api/docs/guides/spend-limits)

## Later: richer graphics with predictable browser performance

Research date: 2026-09-06. Explicitly recorded for later; do not migrate the renderer in the procedural-design chapter.

### Current implementation

NOVA uses TypeScript (compiled to JavaScript), React for its interface, CSS, and a custom Canvas 2D isometric renderer in `app/CityCanvas.tsx`. Vinext/Vite provides the application/server build; AI and audio endpoints run server-side. There is no Three.js, physics engine or WebAssembly requirement. The renderer currently caps animation at 30 FPS and device pixel ratio at 2. These are implementation limits, not measured cross-device performance guarantees.

### What other browser builders use

- [3d.city](https://github.com/lo-th/3d.city): the project documents Three.js for 3D graphics and micropolisJS simulation in a dedicated Web Worker. This is a relevant example of separating simulation and graphics; its performance claims are the author’s, not a NOVA benchmark.
- [Cimulity](https://github.com/zeikar/cimulity): a browser city simulator using Next.js, TypeScript and PixiJS. This illustrates keeping a web UI and a specialized 2D renderer rather than migrating the whole game to a desktop engine.
- [Phaser](https://docs.phaser.io/phaser/getting-started/what-is-phaser): a JavaScript/TypeScript game framework oriented to 2D games. Worth considering for sprite/isometric games, but it would overlap with NOVA’s existing input, simulation and UI systems and does not directly solve arbitrary 3D architectural geometry.
- [Godot web export](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html): an alternative full-engine route, with web-specific renderer/export constraints. A migration would introduce an additional engine/runtime and rewrite significant game/UI integration. Not recommended for this existing browser-first TypeScript application.

These are concrete examples, not evidence of market share or a claim that one framework is always fastest.

### Recommendation for NOVA (engineering judgment)

Keep TypeScript, React, the simulation, saves, AI and voice endpoints. Prototype **Three.js for the world view**, initially using WebGL2 and an orthographic camera that preserves the readable isometric view. React Three Fiber is optional integration, not a requirement; start with a contained imperative Three.js renderer because the current map already owns an animation loop and input. Reassess after a small comparison prototype. Do not change programming language for visual quality; Rust/C++/WASM would only be justified by a measured simulation bottleneck later.

Three.js enables real spatial geometry, camera depth, lighting and materials; it does not automatically create good art or remove performance costs. Prefer a detailed, stylized miniature city: balconies, roof gardens, varied facades, visible entrances and paths, a few readable resident animations, soft daylight and subtle night lighting. Add detail where the camera can actually show it. Start with restrained lighting and inexpensive contact shadows; reserve postprocessing and real-time shadows for measured higher-quality tiers.

Code changes to plan:
1. Add a renderer boundary (`CityView` plus an isolated `ThreeCityRenderer`) with the same state, selection and command contracts. Keep `CityCanvas` as a working fallback during migration.
2. Convert the validated, renderer-independent procedural designs into cached `BufferGeometry`. Rebuild only the edited building. Keep social purpose and geometry separate. No model-generated JavaScript, shaders, imports or asset URLs.
3. Share geometry/materials, instance repeating trees, windows and resident bodies, and merge static geometry by material/chunk where appropriate. Unique designed buildings still need budgets; instancing is not a solution for every unique mesh.
4. Keep per-frame animation out of React state; send meaningful world changes to the renderer. Profile simulation and geometry generation before moving heavy computation into a Web Worker. Use incremental updates and transferable buffers if that becomes necessary.
5. Provide low/medium/high quality tiers: adaptive pixel ratio (start 1–1.5 on mobile), distance-based detail, capped animated residents, bounded texture sizes, conservative transparency and shadows. Pause rendering in hidden tabs; dispose replaced GPU resources and recover gracefully from context loss.

### Performance acceptance before replacing Canvas

These are targets to validate, not promises about current performance:
- Aim for 60 FPS on a representative desktop and sustained 30 FPS on representative midrange phones; assess frame-time percentiles and stalls, not just an average FPS counter.
- Benchmark a mostly filled island with many distinct procedural designs, resident movement, panning/zooming and simultaneous voice use. Include a 10-minute run to reveal heat and memory growth.
- Test Safari on iPhone/Mac, Chrome on Android/Windows and Firefox desktop. Verify touch selection, microphone flow, loading, context loss and the low-quality fallback.
- Track draw calls, triangles, GPU/CPU frame time, memory and transferred assets. Establish budgets from the baseline prototype, then reject details that break them. Avoid promising “no stutter on every device”.
- Ship the new renderer only if it improves visible detail while meeting the targets on the selected test devices. Otherwise keep the existing renderer and reduce complexity.

References informing the performance plan:
- [Three.js: optimize lots of objects](https://threejs.org/manual/en/optimize-lots-of-objects.html) — draw-call overhead and combining geometry.
- [Three.js: InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html) — reuse geometry/materials across transformed instances and dispose resources.
- [PixiJS performance tips](https://pixijs.com/8.x/guides/concepts/performance-tips) — batching, texture atlases, scene complexity and mobile tradeoffs; relevant if we choose to retain 2D.
- [React Three Fiber performance pitfalls](https://github.com/pmndrs/react-three-fiber/blob/master/docs/advanced/pitfalls.mdx) — avoid React state updates in render loops and reuse objects.
