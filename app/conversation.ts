import {
  BUILDINGS,
  KEYS,
  METRICS,
  counts,
  decide,
  EVENTS,
  harmony,
  isLand,
  isRoad,
  pendingEvent,
  place,
  type Kind,
  type State,
} from './simulation';
import { activity, feeling, profile, remember } from './citizens';
export type Speaker = number | 'aura';
export type Reply = {
  state: State;
  text: string;
  speaker: Speaker;
  action?:
    | 'pause'
    | 'resume'
    | 'fast'
    | 'night'
    | 'day'
    | 'undo'
    | 'help'
    | 'people'
    | 'council';
  built?: boolean;
  topic?: string;
};
const aliases: Record<Kind, string[]> = {
  home: ['cloudhome', 'cloud home', 'home', 'housing', 'house', 'residence'],
  garden: ['living garden', 'garden', 'park'],
  agora: ['agora', 'plaza', 'community center', 'meeting place'],
  atelier: ['wonder lab', 'wonder laboratory', 'lab', 'workshop', 'atelier'],
  observatory: ['observatory', 'observatories', 'star tower', 'telescope'],
  wild: ['wild grove', 'grove', 'forest', 'wilderness', 'wild space'],
  dream: ['dream pod', 'dream capsule', 'pod', 'dream world'],
  archive: ['memory house', 'memory houses', 'archive', 'museum'],
  core: ['aura core', 'core'],
};
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function findKinds(text: string): Kind[] {
  const hits = KEYS.map((k) => ({
    k,
    found: aliases[k]
      .map((a) => ({
        a,
        i: text.search(new RegExp('\\b' + esc(a) + '(?:s|es)?\\b')),
      }))
      .filter((x) => x.i >= 0),
  })).filter((o) => o.found.length);
  return hits
    .filter(
      (h) =>
        !h.found.every((f) =>
          hits.some(
            (j) =>
              j.k !== h.k &&
              j.found.some(
                (g) =>
                  g.i <= f.i &&
                  g.i + g.a.length >= f.i + f.a.length &&
                  g.a.length > f.a.length,
              ),
          ),
        ),
    )
    .map((h) => h.k);
}
export function autoBuild(
  s: State,
  kind: Kind,
  quantity: number,
  near?: Kind,
): { state: State; built: number } {
  let next = s,
    built = 0;
  for (let i = 0; i < quantity; i++) {
    const all = [];
    for (let x = 0; x < 17; x++)
      for (let y = 0; y < 17; y++) {
        if (
          !isLand(x, y) ||
          isRoad(x, y) ||
          next.tiles.some((t) => t.x === x && t.y === y)
        )
          continue;
        const neighbors = next.tiles.filter(
          (t) => Math.abs(t.x - x) + Math.abs(t.y - y) <= 2,
        );
        const preferred =
          near ||
          (kind === 'garden' || kind === 'agora'
            ? 'home'
            : kind === 'observatory'
              ? 'atelier'
              : kind === 'home'
                ? 'garden'
                : undefined);
        const score =
          (preferred
            ? neighbors.filter((t) => t.kind === preferred).length * 18
            : 0) +
          neighbors.length * 2 -
          Math.hypot(x - 8, y - 8) * 0.65 +
          (isRoad(x + 1, y) ||
          isRoad(x - 1, y) ||
          isRoad(x, y + 1) ||
          isRoad(x, y - 1)
            ? 3
            : 0);
        all.push({ x, y, score });
      }
    all.sort((a, b) => b.score - a.score);
    if (!all.length) break;
    const r = place(next, all[0].x, all[0].y, kind);
    if (r.ok) {
      next = r.state;
      built++;
    }
  }
  return { state: next, built };
}
export function converse(
  s: State,
  raw: string,
  current: Speaker,
  previousTopic = '',
): Reply {
  const text = raw
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[?!.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  let speaker = current;
  const saidName =
    s.people.find((p) => {
      const pr = profile(p.id);
      return new RegExp('\\b' + esc(pr.name.toLowerCase()) + '\\b').test(text);
    }) ||
    s.people
      .slice(0, 6)
      .find((p) =>
        new RegExp(
          '\\b' + esc(profile(p.id).name.split(' ')[0].toLowerCase()) + '\\b',
        ).test(text),
      );
  if (saidName) speaker = saidName.id;
  else if (/\b(aura|city intelligence)\b/.test(text)) speaker = 'aura';
  const out = (reply: string, extra: Partial<Reply> = {}): Reply => ({
    state: s,
    text: reply,
    speaker,
    ...extra,
  });
  if (
    /\b(don't|do not|never|cancel)\b/.test(text) &&
    /\b(build|place|create|add|remove)\b/.test(text)
  )
    return out('Understood. I have not changed the city.');
  if (
    /^(pause|stop time|freeze|hold on|pause the (game|city|simulation))$/.test(
      text,
    )
  )
    return out('Take your time. The city can wait.', { action: 'pause' });
  if (
    /^(resume|continue|play|start time|resume the (game|city|simulation))$/.test(
      text,
    )
  )
    return out('The days are moving again.', { action: 'resume' });
  if (/\b(speed up|fast forward|faster)\b/.test(text))
    return out('A little faster. One day every second.', { action: 'fast' });
  if (/^(undo|undo that|undo last (build|building|action))$/.test(text))
    return out('Let us revisit the last change.', { action: 'undo' });
  if (
    /\b(night mode|make it night|show me the night|switch to night)\b/.test(
      text,
    )
  )
    return out('The city under the stars.', { action: 'night' });
  if (/\b(day mode|make it day|daylight|switch to day)\b/.test(text))
    return out('A new light on everything.', { action: 'day' });
  if (/^(help|what can i say|how (do i|to) play|show commands)$/.test(text))
    return out(
      'Try “build two gardens near homes”, “talk to Mira”, “how is the city?” or “open the council”. You can always use the building palette too.',
      { action: 'help' },
    );
  const event = pendingEvent(s);
  if (event >= 0) {
    const choice =
      /\b(option one|option 1|first option|first choice|choose one|choose 1)\b/.test(
        text,
      )
        ? 0
        : /\b(option two|option 2|second option|second choice|choose two|choose 2)\b/.test(
              text,
            )
          ? 1
          : EVENTS[event].options.findIndex((o) =>
              text.includes(o.label.toLowerCase()),
            );
    if (choice >= 0) {
      const next = decide(s, event, choice);
      return out(EVENTS[event].options[choice].result, {
        state: next,
        speaker: 'aura',
        topic: 'council',
      });
    }
  }
  if (/\b(council|decision|ethical dilemma)\b/.test(text))
    return out(
      event >= 0
        ? EVENTS[event].title +
            '. ' +
            EVENTS[event].text +
            ' Option one: ' +
            EVENTS[event].options[0].label +
            '. Option two: ' +
            EVENTS[event].options[1].label +
            '.'
        : s.decisions.length === EVENTS.length
          ? 'The council has written its first charter. Our next chapter belongs to the people who live here.'
          : 'The next council conversation opens on day ' +
            EVENTS.find((e) => e.day > s.day)?.day +
            '. There is time to listen before deciding.',
      {
        action: event >= 0 ? 'council' : undefined,
        speaker: 'aura',
        topic: 'council',
      },
    );
  const command =
    /^(?:(?:aura|please|can you|could you|would you|let's|i want you to)\s+)*(?:build|place|add|create|plant|make room for|give us)\b/.test(
      text,
    );
  if (command) {
    if (/\bzero\b|[-−]\s*\d/.test(text))
      return out('Choose a positive quantity between one and ten.');
    const sections = text.split(/\b(?:near|beside|next to|around|by the)\b/),
      kinds = findKinds(sections[0]);
    const inferred =
      speaker !== 'aura' && /\b(dream|project|what you need)\b/.test(text)
        ? profile(speaker).kind
        : undefined;
    const kind = kinds[0] || inferred;
    if (!kind)
      return out(
        'I can build Cloudhomes, gardens, Agoras, Wonder Labs, observatories, Wild Groves, Dream Pods or Memory Houses. Which would you like?',
      );
    if (kinds.length > 1)
      return out(
        'Let us place one kind at a time so I get your request right. For example: “build two gardens near homes”.',
      );
    const numMatch = sections[0].match(
      /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|an)\b/,
    );
    const numbers: Record<string, number> = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
      a: 1,
      an: 1,
    };
    const amount = numMatch ? numbers[numMatch[1]] || Number(numMatch[1]) : 1;
    if (!Number.isFinite(amount) || amount < 1 || amount > 10)
      return out(
        'I can place between one and ten buildings per request. How many would you like?',
      );
    const near =
      sections.length > 1
        ? findKinds(sections.slice(1).join(' '))[0]
        : undefined;
    const result = autoBuild(s, kind, amount, near);
    return out(
      result.built
        ? `${result.built === 1 ? 'A ' + BUILDINGS[kind].name : result.built + ' ' + BUILDINGS[kind].name + ' buildings'} ${result.built === 1 ? 'is' : 'are'} ready${near ? ' near ' + BUILDINGS[near].name + ' buildings' : ''}. ${kind === 'home' ? 'Room for ' + result.built * 48 + ' more people.' : kind === 'dream' ? 'A door into another world. Let us keep doors to one another open too.' : 'A new possibility, at no cost.'}${result.built < amount ? ' The island has room for only ' + result.built + ' of the ' + amount + ' requested buildings.' : ''}`
        : 'The island has no open building tiles left. Rewild a building to make room.',
      { state: result.state, built: result.built > 0, speaker: 'aura' },
    );
  }
  if (
    /\b(build|place|garden|lab|home|observatory)\b/.test(text) &&
    /\b(should|recommend|need|where|help|improve)\b/.test(text) &&
    speaker === 'aura'
  ) {
    const low = METRICS.reduce((a, b) =>
      s.stats[a.key] < s.stats[b.key] ? a : b,
    );
    return out(
      `Our lowest measure is ${low.label.toLowerCase()} at ${Math.round(s.stats[low.key])}. ${low.key === 'meaning' ? 'A Wonder Lab or Observatory gives people space for their own questions.' : low.key === 'connection' ? 'Agoras and gardens close to homes invite people to meet. Dream Pods can make belonging harder.' : low.key === 'freedom' ? 'Wild Groves make room for life nobody needs to plan.' : 'Gardens and Wild Groves let nature grow alongside the city.'} If you like, tell me what to build.`,
      { topic: 'advice' },
    );
  }
  if (
    /^(?:(?:aura|please) )*(?:(?:can|could|would) you )?(?:show(?: me)?|meet|introduce(?: me to)?|let me meet) (?:the |our |your |all (?:the )?)?(?:residents|citizens|people)(?: (?:of|in) (?:nova|(?:the |our )?city))?(?: please)?$/.test(text) ||
    /^(?:aura )?who (?:are (?:the |our )?(?:residents|citizens|people)|lives (?:here|in (?:nova|the city)))$/.test(text)
  )
    return out(
      'Everyone here has a life beyond the city statistics. Choose someone, or say “talk to Mira”.',
      { action: 'people', speaker: 'aura' },
    );
  if (speaker !== 'aura') {
    const p = s.people[speaker];
    if (!p)
      return out('That person has not arrived in NOVA yet.', {
        speaker: 'aura',
      });
    const pr = profile(p.id);
    const answer = (reply: string, topic: string) =>
      out(reply, {
        state: remember(
          s,
          p.id,
          'On day ' + s.day + ', you asked about ' + topic + '.',
        ),
        speaker,
        topic,
      });
    if (
      /\b(thank|beautiful|love that|good luck|believe in you|support you|sounds great|go for it|you can do it)\b/.test(
        text,
      )
    )
      return answer(
        p.trust > 50
          ? 'You keep showing up. That matters more than fixing everything for me.'
          : 'Thank you. I do not need you to do it for me. But having someone who cares makes the first step easier.',
        'encouragement',
      );
    if (/\b(remember|memory|last time|our conversation)\b/.test(text))
      return answer(
        p.memories.length
          ? 'I remember. ' +
              p.memories[0] +
              ' ' +
              (p.trust > 50
                ? 'I feel comfortable thinking out loud with you now.'
                : 'I like that you came back.')
          : 'This is our first real conversation. I would like to remember it as the beginning of something.',
        'our conversations',
      );
    if (
      /\b(why|tell me more|go on|what do you mean)\b/.test(text) &&
      text.split(' ').length < 8
    )
      return answer(
        previousTopic === 'fear'
          ? pr.belief
          : previousTopic === 'beliefs'
            ? pr.why
            : pr.why + ' ' + pr.belief,
        'beliefs',
      );
    if (/\b(fear|worr|afraid|concern|unhappy|problem)\w*\b/.test(text))
      return answer(pr.fear + ' ' + pr.belief, 'fear');
    if (
      /\b(work|money|job|abundance|meaning|purpose|ethic|moral|freedom|believe|think about|perfect|ai|machine|real)\w*\b/.test(
        text,
      )
    )
      return answer(pr.belief + ' ' + pr.why, 'beliefs');
    if (/\b(feel|happy|how are you|how is life|doing today)\b/.test(text))
      return answer(
        feeling(s, p) +
          '. Today I am ' +
          activity(s, p) +
          '. ' +
          (p.progress >= 100
            ? pr.finished
            : 'My project is ' +
              Math.floor(p.progress) +
              ' percent of the way there, but I am not in a hurry.'),
        'life today',
      );
    if (
      /\b(dream|wish|want|hope|project|goal|need|help|aspiration)\w*\b/.test(
        text,
      )
    )
      return answer(
        (p.progress >= 100
          ? pr.finished + ' '
          : 'I want to ' +
            pr.wish.charAt(0).toLowerCase() +
            pr.wish.slice(1) +
            '. ') +
          pr.why +
          ' ' +
          (s.tiles.some((t) => t.kind === pr.kind)
            ? 'I have a place to begin. Now I need time, and perhaps someone to share it with.'
            : 'A ' +
              BUILDINGS[pr.kind].name +
              ' would give this idea a place to grow.'),
        'my dream',
      );
    if (
      /\b(hello|hi|hey|talk|meet|who|about yourself)\b/.test(text) ||
      saidName
    )
      return answer(
        'I am ' +
          pr.name +
          '. Today I am ' +
          activity(s, p) +
          '. I have been thinking about how to ' +
          pr.wish.charAt(0).toLowerCase() +
          pr.wish.slice(1) +
          '. What would you like to know?',
        'getting to know each other',
      );
    return answer(
      'I am not sure I have a good answer to that. I can tell you about my dream, how I feel, what worries me, or what I believe a good life could be.',
      'a new question',
    );
  }
  if (
    /\b(how|status|doing|feeling|happy|city|everyone|population)\b/.test(text)
  ) {
    const c = counts(s),
      finished = s.people.filter((p) => p.progress >= 100).length;
    return out(
      `NOVA is home to ${s.population} people, with room for ${c.home * 48}. Quality of life is ${harmony(s)} out of 100. ${finished} personal dreams have come to life. ` +
        (s.stats.connection < 55
          ? 'Some people feel a little disconnected. Agoras and gardens near homes could help.'
          : 'People are finding their own rhythms. Ask someone what they dream about.'),
      { topic: 'city' },
    );
  }
  if (
    /\b(work|story|year|why|abundance|money|purpose|future|ai|machine|freedom|meaning)\b/.test(
      text,
    )
  )
    return out(
      'In 2145, the last compulsory work shift ended. Machines now provide everything people need. It is 2186, and NOVA is our experiment: what if a city measured possibility instead of productivity? I can arrange the buildings. Only its people can decide what makes a good life.',
      { topic: 'story' },
    );
  if (/\b(hello|hi|hey|aura|thanks|thank you)\b/.test(text))
    return out(
      'I am here. We can shape the city, talk to its people, or simply let a day unfold. What would you like to make possible?',
    );
  return out(
    'I can help with the city, introduce you to a resident, or bring a question to the council. Try “build a garden near homes”, “talk to Juno”, or “how is the city?”. This edition uses local, story-driven conversations rather than open-ended AI.',
    { topic: 'help' },
  );
}
