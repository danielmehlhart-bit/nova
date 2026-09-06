import { isLand, type State, type Tile, type Kind } from './simulation';
import { profile, seedPeople } from './citizens';
export type Activity =
  | 'rest'
  | 'social'
  | 'create'
  | 'swim'
  | 'dance'
  | 'learn'
  | 'reflect'
  | 'explore';
export type Form =
  | 'customhome'
  | 'camp'
  | 'cottage'
  | 'tower'
  | 'woodland'
  | 'pool'
  | 'pavilion'
  | 'workshop'
  | 'garden'
  | 'sanctuary'
  | 'learning'
  | 'wetland'
  | 'observatory';
export type Program = { activity: Activity; start: number; end: number };
export type PlaceSpec = {
  form: Form;
  name: string;
  programs: Program[];
  capacity: number;
  quiet: number;
  privacy: number;
  footprint: number;
  description: string;
};
export type Life = {
  id: number;
  home: number;
  at: number;
  target: number;
  activity: Activity;
  reason: string;
  belonging: number;
  autonomy: number;
  comfort: number;
  friends: number[];
  visits: number;
  quiet: boolean;
  interest: Activity;
  housing: 'nature' | 'privacy' | 'community';
  lastChoice: number;
};
export type Circle = {
  id: string;
  name: string;
  activity: Activity;
  founder: number;
  members: number[];
  venue: number;
  meetings: number;
  lastMeeting: number;
};
export type CivicEvent = {
  id: string;
  time: number;
  title: string;
  text: string;
  person?: number;
  place?: number;
  tone: 'good' | 'concern' | 'notice';
};
export type Community = {
  started: boolean;
  clock: number;
  level: number;
  acknowledged: number;
  lives: Life[];
  groups: Circle[];
  events: CivicEvent[];
  history: { day: number; belonging: number; trust: number; nature: number }[];
  government: 'mayor' | 'assembly' | 'circles';
  quietHours: boolean;
  openAccess: boolean;
  reviewAt: number;
  reviews: number;
  rules: { day: number; text: string }[];
  incidentAt: number;
};
export const ACTIVITY: Record<Activity, string> = {
  rest: 'Resting',
  social: 'Conversation',
  create: 'Making & art',
  swim: 'Swimming',
  dance: 'Dancing',
  learn: 'Learning',
  reflect: 'Reflection & ritual',
  explore: 'Exploring nature',
};
const p = (activity: Activity, start = 8, end = 22): Program => ({
  activity,
  start,
  end,
});
export const PLACES: Record<Form, PlaceSpec> = {
  customhome: {
    form: 'customhome',
    name: 'Courtyard living',
    capacity: 24,
    quiet: 65,
    privacy: 65,
    footprint: 4,
    programs: [p('rest', 0, 24), p('social', 9, 21)],
    description:
      'A home you can shape: private rooms, a shared courtyard and a scale of your choosing.',
  },
  camp: {
    form: 'camp',
    name: 'Meadow campsite',
    capacity: 12,
    quiet: 65,
    privacy: 30,
    footprint: 1,
    programs: [p('rest', 0, 24), p('social', 17, 21)],
    description:
      'A first home under canvas. Close to nature and each other; little privacy.',
  },
  cottage: {
    form: 'cottage',
    name: 'Garden homes',
    capacity: 16,
    quiet: 85,
    privacy: 90,
    footprint: 3,
    programs: [p('rest', 0, 24)],
    description:
      'Private rooms, planted terraces and space to retreat. More land per resident.',
  },
  tower: {
    form: 'tower',
    name: 'Sky residence',
    capacity: 64,
    quiet: 40,
    privacy: 75,
    footprint: 5,
    programs: [p('rest', 0, 24), p('social', 9, 21)],
    description:
      'Many homes on one plot. Neighbors close by; busy shared spaces need balance.',
  },
  woodland: {
    form: 'woodland',
    name: 'Woodland cabins',
    capacity: 10,
    quiet: 95,
    privacy: 80,
    footprint: 2,
    programs: [p('rest', 0, 24), p('explore', 7, 20)],
    description:
      'Quiet homes among trees. A little apart from the life of the commons.',
  },
  pool: {
    form: 'pool',
    name: 'Community pool',
    capacity: 0,
    quiet: 55,
    privacy: 40,
    footprint: 3,
    programs: [p('swim', 8, 20)],
    description:
      'Water, a sunny deck and an easy way to spend time together. Water is recycled on site.',
  },
  pavilion: {
    form: 'pavilion',
    name: 'Open commons',
    capacity: 0,
    quiet: 60,
    privacy: 20,
    footprint: 1,
    programs: [p('social', 7, 23)],
    description:
      'A table, a roof and an invitation. A place for unplanned encounters.',
  },
  workshop: {
    form: 'workshop',
    name: 'Wonder workshop',
    capacity: 0,
    quiet: 45,
    privacy: 50,
    footprint: 2,
    programs: [p('create', 8, 22)],
    description:
      'Make something imperfect, with as much or as little machine help as you want.',
  },
  garden: {
    form: 'garden',
    name: 'Living garden',
    capacity: 0,
    quiet: 95,
    privacy: 60,
    footprint: -3,
    programs: [p('explore', 6, 22), p('social', 9, 19)],
    description: 'A shaded place for seeds, stories and slow afternoons.',
  },
  sanctuary: {
    form: 'sanctuary',
    name: 'House of reflection',
    capacity: 0,
    quiet: 95,
    privacy: 80,
    footprint: 1,
    programs: [p('reflect', 6, 22)],
    description:
      'Prayer, silence, remembrance or a secular ritual. Participation is always a personal choice.',
  },
  learning: {
    form: 'learning',
    name: 'Discovery house',
    capacity: 0,
    quiet: 70,
    privacy: 50,
    footprint: 2,
    programs: [p('learn', 8, 21), p('create', 14, 18)],
    description:
      'A place to ask a question, follow a curiosity and learn across generations.',
  },
  wetland: {
    form: 'wetland',
    name: 'Living water garden',
    capacity: 0,
    quiet: 90,
    privacy: 40,
    footprint: -6,
    programs: [p('explore', 7, 21)],
    description:
      'Engineered roots restore water and habitat. Supports the water cycle of 80 residents.',
  },
  observatory: {
    form: 'observatory',
    name: 'Sky observatory',
    capacity: 0,
    quiet: 90,
    privacy: 70,
    footprint: 2,
    programs: [p('learn', 18, 24), p('reflect', 19, 24)],
    description:
      'Watch the sky together. Bring questions, or simply enjoy the night.',
  },
};
export const formKind = (f: Form): Kind =>
  PLACES[f].capacity
    ? 'home'
    : (
        {
          pool: 'agora',
          pavilion: 'agora',
          workshop: 'atelier',
          garden: 'garden',
          sanctuary: 'archive',
          learning: 'atelier',
          wetland: 'wild',
          observatory: 'observatory',
        } as Record<string, Kind>
      )[f] || 'agora';
export const tileKey = (t: { x: number; y: number }) => t.y * 17 + t.x;
export function spec(t: Tile): PlaceSpec {
  if (t.place) return t.place;
  const f: Form = (
    {
      home: 'tower',
      garden: 'garden',
      agora: 'pavilion',
      atelier: 'workshop',
      observatory: 'observatory',
      wild: 'garden',
      archive: 'sanctuary',
      dream: 'sanctuary',
      core: 'wetland',
    } as Record<Kind, Form>
  )[t.kind];
  return PLACES[f];
}
export const capacity = (s: State) =>
  s.tiles.reduce((n, t) => n + spec(t).capacity, 0);
const clamp = (n: number) => Math.max(0, Math.min(100, n));
const rand = (a: number, b: number) => {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
export function foundingState(): State {
  return {
    version: 1,
    day: 1,
    population: 0,
    tiles: [],
    people: [],
    stats: { meaning: 50, connection: 50, freedom: 75, nature: 100 },
    bonus: { meaning: 0, connection: 0, freedom: 0, nature: 0 },
    decisions: [],
    log: [],
    won: false,
    community: {
      started: false,
      clock: 8,
      level: 0,
      acknowledged: 0,
      lives: [],
      groups: [],
      events: [],
      history: [],
      government: 'mayor',
      quietHours: false,
      openAccess: true,
      reviewAt: 56,
      reviews: 0,
      rules: [],
      incidentAt: 0,
    },
  };
}
export function putPlace(
  s: State,
  idea: PlaceSpec,
  point?: { x: number; y: number },
): { state: State; text: string; tile?: Tile } {
  let location = point;
  if (!location) {
    const options = [];
    for (let y = 1; y < 16; y++)
      for (let x = 1; x < 16; x++)
        if (isLand(x, y) && !s.tiles.some((t) => t.x === x && t.y === y))
          options.push({ x, y });
    options.sort(
      (a, b) =>
        (a.x - 8) ** 2 + (a.y - 8) ** 2 - ((b.x - 8) ** 2 + (b.y - 8) ** 2),
    );
    location = options[0];
  }
  if (
    !location ||
    !isLand(location.x, location.y) ||
    s.tiles.some((t) => t.x === location!.x && t.y === location!.y)
  )
    return {
      state: s,
      text: 'Choose an empty piece of land. Existing places stay until you choose to change them.',
    };
  const tile: Tile = {
    ...location,
    kind: formKind(idea.form),
    place: structuredClone(idea),
  };
  return {
    state: { ...s, tiles: [...s.tiles, tile] },
    tile,
    text: `${idea.name} is ready.${idea.capacity ? ` Room for ${idea.capacity} people. The first arrivals come as time passes.` : ' Watch who chooses to visit.'}`,
  };
}
export function removePlace(s: State, key: number) {
  const tile = s.tiles.find((t) => tileKey(t) === key);
  if (!tile) return { state: s, text: 'Choose a place first.' };
  if (capacity(s) - spec(tile).capacity < s.population)
    return {
      state: s,
      text: 'People live here. Provide enough alternative homes before removing this place.',
    };
  return {
    state: { ...s, tiles: s.tiles.filter((t) => tileKey(t) !== key) },
    text: 'The materials return to the commons. People will find another place to meet.',
  };
}
export function programActive(p: Program, hour: number) {
  return hour >= p.start && hour < p.end;
}
export function housingPreference(id: number) {
  return (['community', 'privacy', 'nature'] as const)[id % 3];
}
export function interest(id: number): Activity {
  return (
    [
      'create',
      'create',
      'social',
      'swim',
      'explore',
      'learn',
      'reflect',
      'dance',
    ] as Activity[]
  )[id % 8];
}
export function event(s: State, e: Omit<CivicEvent, 'time'>): State {
  const c = s.community!;
  if (c.events.some((x) => x.id === e.id)) return s;
  return {
    ...s,
    community: {
      ...c,
      events: [{ ...e, time: c.clock }, ...c.events].slice(0, 60),
    },
  };
}
export function waterQuality(s: State) {
  return clamp(
    100 -
      Math.max(
        0,
        s.population -
          24 -
          s.tiles.filter((t) => spec(t).form === 'wetland').length * 80,
      ) *
        1.2,
  );
}
export function satisfaction(l: Life) {
  return Math.round((l.belonging + l.autonomy + l.comfort) / 3);
}
export function communityTick(original: State): State {
  if (!original.community?.started) return original;
  let s = original;
  const clock = s.community!.clock + 1,
    hour = clock % 24,
    day = Math.floor(clock / 24) + 1;
  const newCount = Math.min(
    capacity(s),
    200,
    s.population + (hour >= 7 && hour <= 19 ? 2 : 0),
  );
  const people = s.people.slice();
  for (let id = people.length; id < newCount; id++)
    people.push({ ...seedPeople(id + 1, day)[id], born: day });
  const lives = s.community!.lives.map((l) => ({
    ...l,
    friends: [...l.friends],
  }));
  const homes = s.tiles.filter((t) => spec(t).capacity > 0);
  const assigned = new Map<number, number>();
  const chooseHome = (id: number) =>
    homes
      .filter((t) => (assigned.get(tileKey(t)) || 0) < spec(t).capacity)
      .sort((a, b) => {
        const score = (t: Tile) => {
          const q = spec(t);
          return housingPreference(id) === 'privacy'
            ? q.privacy
            : housingPreference(id) === 'nature'
              ? q.quiet - q.footprint * 5
              : 100 - q.privacy + q.capacity / 2;
        };
        return score(b) - score(a);
      })[0];
  for (const l of lives) {
    const old = homes.find((t) => tileKey(t) === l.home);
    if (old && (assigned.get(l.home) || 0) < spec(old).capacity)
      assigned.set(l.home, (assigned.get(l.home) || 0) + 1);
    else l.home = -1;
  }
  for (const l of lives)
    if (l.home < 0) {
      const h = chooseHome(l.id);
      if (h) {
        l.home = tileKey(h);
        assigned.set(l.home, (assigned.get(l.home) || 0) + 1);
      }
    }
  // At a daily checkpoint, residents can move themselves when a better home has room.
  if (hour === 9)
    for (const l of lives) {
      if (l.comfort >= 65) continue;
      const old = homes.find((t) => tileKey(t) === l.home),
        preferred = chooseHome(l.id);
      if (!old || !preferred || tileKey(preferred) === l.home) continue;
      const fit = (t: Tile) =>
        l.housing === 'privacy'
          ? spec(t).privacy
          : l.housing === 'nature'
            ? spec(t).quiet
            : 100 - spec(t).privacy + spec(t).capacity / 2;
      if (fit(preferred) < fit(old) + 15) continue;
      assigned.set(l.home, Math.max(0, (assigned.get(l.home) || 1) - 1));
      l.home = tileKey(preferred);
      assigned.set(l.home, (assigned.get(l.home) || 0) + 1);
      s = event(s, {
        id: `move-${l.id}-${day}`,
        title: `${profile(l.id).name.split(' ')[0]} chose a new home`,
        text: `Moved from ${spec(old).name} to ${spec(preferred).name}, looking for ${l.housing === 'privacy' ? 'more privacy' : l.housing === 'nature' ? 'more quiet and nature' : 'closer company'}.`,
        tone: 'good',
        person: l.id,
        place: l.home,
      });
    }
  for (let id = lives.length; id < newCount; id++) {
    const home = chooseHome(id);
    if (!home) break;
    const key = tileKey(home);
    assigned.set(key, (assigned.get(key) || 0) + 1);
    lives.push({
      id,
      home: key,
      at: key,
      target: key,
      activity: 'rest',
      reason: 'I have just arrived. I am getting to know my new home.',
      belonging: 48,
      autonomy: 75,
      comfort: 65,
      friends: [],
      visits: 0,
      quiet: id % 3 !== 0,
      interest: interest(id),
      housing: housingPreference(id),
      lastChoice: clock,
    });
  }
  s = {
    ...s,
    day,
    population: newCount,
    people,
    community: { ...s.community!, clock, lives },
  };
  if (original.population === 0 && newCount > 0)
    s = event(s, {
      id: 'arrival',
      title: 'Your first neighbors arrive',
      text: 'Mira and Juno have chosen to make a home here. Give them a little time, then hear what they need.',
      tone: 'good',
      person: 0,
    });
  const groups = s.community!.groups.map((g) => ({
    ...g,
    members: [...g.members],
  }));
  for (const l of lives) {
    const aiPlan = people[l.id]?.ai;
    if (aiPlan)
      l.interest = (
        {
          atelier: 'create',
          agora: 'social',
          observatory: 'learn',
          garden: 'explore',
          wild: 'explore',
          dream: 'reflect',
          archive: 'learn',
          home: 'social',
          core: 'social',
        } as const
      )[aiPlan.kind];
    const home = homes.find((t) => tileKey(t) === l.home);
    if (!home) continue;
    const hp = spec(home),
      noise = s.tiles.reduce((n, t) => {
        const near = Math.abs(t.x - home.x) + Math.abs(t.y - home.y) <= 2;
        return (
          n +
          (near &&
          spec(t).programs.some(
            (p) => p.activity === 'dance' && programActive(p, hour),
          ) &&
          !(s.community!.quietHours && hour >= 20)
            ? 22
            : 0)
        );
      }, 0);
    const fit =
      l.housing === 'nature'
        ? hp.quiet
        : l.housing === 'privacy'
          ? hp.privacy
          : Math.min(95, 55 + hp.capacity);
    const activeGroup = groups.find(
      (g) =>
        g.members.includes(l.id) &&
        g.members.length >= 2 &&
        s.tiles.some(
          (t) =>
            tileKey(t) === g.venue &&
            spec(t).programs.some(
              (p) => p.activity === g.activity && programActive(p, hour),
            ),
        ),
    );
    const options: {
      key: number;
      activity: Activity;
      score: number;
      reason: string;
    }[] = [];
    for (const t of s.tiles) {
      const key = tileKey(t);
      const distance = Math.abs(t.x - home.x) + Math.abs(t.y - home.y);
      for (const program of spec(t).programs) {
        if (
          (!s.community!.openAccess &&
            groups.some(
              (g) =>
                g.venue === key &&
                g.activity === program.activity &&
                !g.members.includes(l.id),
            )) ||
          !programActive(program, hour) ||
          program.activity === 'rest' ||
          (s.community!.quietHours &&
            hour >= 20 &&
            program.activity === 'dance')
        )
          continue;
        const crowded = lives.filter(
          (other) => other.id !== l.id && other.target === key,
        ).length;
        let score =
          (program.activity === l.interest ? 28 : 8) +
          (100 - l.belonging) * (program.activity === 'social' ? 0.48 : 0.13) -
          distance * 2 +
          rand(l.id + key, Math.floor(clock / 3)) * 12;
        if (
          activeGroup?.venue === key &&
          activeGroup.activity === program.activity
        )
          score += 24;
        if (l.quiet && program.activity === 'dance') score -= 30;
        if (crowded > 10 && l.quiet) score -= 20;
        options.push({
          key,
          activity: program.activity,
          score,
          reason:
            activeGroup?.venue === key
              ? `My ${activeGroup.name} friends are meeting. I chose to join them.`
              : program.activity === l.interest
                ? `I enjoy ${ACTIVITY[program.activity].toLowerCase()}. ${spec(t).name} makes room for that.`
                : `I wanted ${l.belonging < 55 ? 'some company' : 'a change of scene'}, so I chose ${spec(t).name}.`,
        });
      }
    }
    options.push({
      key: l.home,
      activity: 'rest',
      score:
        hour < 7 || hour >= 23
          ? 160
          : 12 + (100 - l.comfort) * 0.4 + rand(l.id, clock) * 12,
      reason:
        hour < 7 || hour >= 23
          ? 'It is late. I am going home to rest.'
          : 'I wanted a quiet pause at home. I can choose to join people later.',
    });
    if (
      clock - l.lastChoice >= 3 ||
      !s.tiles.some((t) => tileKey(t) === l.target)
    ) {
      options.sort((a, b) => b.score - a.score);
      const chosen = options[0];
      l.target = chosen.key;
      l.activity = chosen.activity;
      l.reason = chosen.reason;
      l.lastChoice = clock;
    }
    // Each step is an hour. Travel completes before the next decision; renderer interpolates the same route.
    l.at = l.target;
    const company = lives.filter(
      (o) => o.id !== l.id && o.target === l.target && o.activity !== 'rest',
    );
    const connected = l.activity !== 'rest' && company.length > 0;
    l.belonging = clamp(
      l.belonging + (connected ? 2.6 : l.activity === 'rest' ? -0.25 : -0.1),
    );
    const comfortTarget = clamp(
      fit +
        (l.activity === 'rest' ? 8 : 0) -
        (l.quiet ? noise * 1.4 : noise * 0.3) -
        (100 - waterQuality(s)) * 0.3,
    );
    l.comfort = clamp(l.comfort + (comfortTarget - l.comfort) * 0.12);
    l.autonomy = clamp(
      l.autonomy +
        ((l.activity === l.interest ? 85 : 65) +
          (s.community!.openAccess ? 5 : -12) -
          l.autonomy) *
          0.05,
    );
    if (connected) {
      l.visits++;
      for (const o of company.slice(0, 4))
        if (!l.friends.includes(o.id) && rand(l.id + o.id, clock) > 0.45)
          l.friends = [...l.friends, o.id].slice(-8);
    }
    const person = people[l.id];
    if (person) {
      if (
        person.progress < 100 &&
        person.progress + (l.activity === l.interest ? 0.6 : 0.03) >= 100
      ) {
        s = event(s, {
          id: `dream-${l.id}-${day}`,
          title: `${profile(l.id).name.split(' ')[0]} reached a personal milestone`,
          text: `${person.ai?.wish || profile(person.id).wish}. A project advanced through time spent on a chosen interest. Visit to hear what might come next.`,
          tone: 'good',
          person: l.id,
          place: l.target,
        });
      }
      people[l.id] = {
        ...person,
        progress: clamp(
          person.progress + (l.activity === l.interest ? 0.6 : 0.03),
        ),
        trust: clamp(person.trust + (satisfaction(l) - 55) * 0.01),
      };
    }
  }
  // A willing resident initiates; invitees decide by shared interest and their own preference.
  if (hour === 17 && groups.length < 10) {
    for (const initiator of lives) {
      if (
        initiator.friends.length < 2 ||
        groups.some((g) => g.founder === initiator.id)
      )
        continue;
      const venue = s.tiles.find((t) =>
        spec(t).programs.some((p) => p.activity === initiator.interest),
      );
      if (!venue) continue;
      const members = [
        initiator.id,
        ...initiator.friends
          .filter(
            (id) =>
              lives[id] &&
              (lives[id].interest === initiator.interest ||
                lives[id].belonging < 75) &&
              !(lives[id].quiet && initiator.interest === 'dance'),
          )
          .slice(0, 6),
      ];
      if (members.length < 2) continue;
      const names: Record<Activity, string> = {
        rest: 'Slow mornings',
        social: 'The open table',
        create: 'Imperfect makers',
        swim: 'The evening swimmers',
        dance: 'Afterglow',
        learn: 'One more question',
        reflect: 'The quiet circle',
        explore: 'Wandering together',
      };
      const g: Circle = {
        id: `circle-${initiator.id}`,
        name: names[initiator.interest],
        activity: initiator.interest,
        founder: initiator.id,
        members,
        venue: tileKey(venue),
        meetings: 0,
        lastMeeting: 0,
      };
      groups.push(g);
      s = event(s, {
        id: g.id,
        title: `${profile(initiator.id).name.split(' ')[0]} started ${g.name}`,
        text: `${members.length} neighbors chose to join. ${initiator.friends.length - (members.length - 1)} invited friends chose something else. Their next meeting follows the place’s opening hours.`,
        tone: 'good',
        person: initiator.id,
        place: g.venue,
      });
      break;
    }
  }
  for (const g of groups) {
    if (!s.tiles.some((t) => tileKey(t) === g.venue)) continue;
    const together = lives.filter(
      (l) =>
        g.members.includes(l.id) &&
        l.target === g.venue &&
        l.activity === g.activity,
    );
    if (together.length >= 2 && clock - g.lastMeeting >= 20) {
      g.meetings++;
      g.lastMeeting = clock;
      for (const l of together) {
        const person = people[l.id];
        people[l.id] = {
          ...person,
          memories: [
            `Day ${day}: I met ${g.name} at ${spec(s.tiles.find((t) => tileKey(t) === g.venue)!).name}.`,
            ...person.memories,
          ].slice(0, 5),
        };
      }
    }
  }
  const avg = (key: 'belonging' | 'autonomy' | 'comfort') =>
    lives.length ? lives.reduce((n, l) => n + l[key], 0) / lives.length : 50;
  const nature = clamp(
    100 -
      s.tiles.reduce((n, t) => n + spec(t).footprint, 0) * 1.3 -
      (100 - waterQuality(s)) * 0.25,
  );
  s = {
    ...s,
    people,
    stats: {
      meaning: lives.length
        ? lives.reduce((n, l) => n + (l.activity === l.interest ? 90 : 50), 0) /
          lives.length
        : 50,
      connection: avg('belonging'),
      freedom: avg('autonomy'),
      nature,
    },
    community: {
      ...s.community!,
      lives,
      groups,
      history:
        hour === 12
          ? [
              ...s.community!.history,
              {
                day,
                belonging: Math.round(avg('belonging')),
                trust: Math.round(
                  people.reduce((n, p) => n + p.trust, 0) /
                    Math.max(1, people.length),
                ),
                nature: Math.round(nature),
              },
            ].slice(-24)
          : s.community!.history,
    },
  };
  if (hour === 16 && lives.length && clock - s.community!.incidentAt > 72) {
    const unhappy = lives.find((l) => l.comfort < 35 || l.belonging < 35);
    if (unhappy) {
      const serious = people[unhappy.id].trust < 25;
      s = event(s, {
        id: `concern-${day}`,
        title: serious ? 'Trust needs repair' : 'A neighbor asks to be heard',
        text: serious
          ? 'Some residents no longer trust that their needs will be heard. The citizen hour can review the rules; different homes and places may help with the underlying concern.'
          : `${profile(unhappy.id).name.split(' ')[0]} says: “I am struggling to feel at home. Can we talk about what is missing?”`,
        tone: 'concern',
        person: unhappy.id,
        place: unhappy.home,
      });
      s = { ...s, community: { ...s.community!, incidentAt: clock } };
    }
  }
  const level = levelOf(s);
  if (level > s.community!.level) {
    s = { ...s, community: { ...s.community!, level } };
    s = event(s, {
      id: `level-${level}`,
      title: `Chapter ${level + 1} · ${LEVELS[level].name}`,
      text: LEVELS[level].reward,
      tone: 'good',
    });
  }
  return s;
}
export const LEVELS = [
  { name: 'A place to begin', reward: 'Make room for the first eight people.' },
  {
    name: 'First neighbors',
    reward:
      'People have arrived. Their voices and needs are now part of the landscape.',
  },
  {
    name: 'Finding each other',
    reward:
      'Shared places are being used. Residents can form their own circles.',
  },
  {
    name: 'A life of our own',
    reward:
      'A resident circle has met. Help your community agree how to live together.',
  },
  {
    name: 'Living together',
    reward:
      'Your first civic decision is recorded. Keep listening as the city grows.',
  },
  {
    name: 'A flourishing community',
    reward:
      'Your city supports different lives. New ideas and different futures remain open.',
  },
];
export function levelOf(s: State) {
  const c = s.community!;
  if (s.population < 8) return 0;
  if (
    !c.lives.some((l) => l.visits >= 3) ||
    !s.tiles.some((t) => !spec(t).capacity)
  )
    return 1;
  if (!c.groups.some((g) => g.meetings >= 1)) return 2;
  if (!c.reviews) return 3;
  if (
    s.population < 24 ||
    s.stats.connection < 65 ||
    s.stats.freedom < 65 ||
    s.stats.nature < 65
  )
    return 4;
  return 5;
}
export function nextStep(s: State) {
  const level = levelOf(s);
  if (level === 0 && capacity(s) >= 8)
    return {
      title: 'Your first neighbors are on their way',
      text: `${s.population} of your first eight neighbors have arrived. Leave time running; people arrive between 07:00 and 19:00. You can already plan a shared place.`,
      action: 'Create a place to meet',
      panel: 'build',
    };
  return [
    {
      title: 'Make a home, your way',
      text: 'Eight people are ready to begin. Invent a place to live, or adapt a starting idea. Small, shared, private or something entirely your own. There is no cost.',
      action: 'Create your first homes',
      panel: 'build',
    },
    {
      title: 'A home needs a neighborhood',
      text: 'Create a shared place. Let time run so neighbors can discover it and get to know each other.',
      action: 'Make a place to meet',
      panel: 'build',
    },
    {
      title: 'Give a shared interest a place',
      text: 'Let residents meet repeatedly. Workshops, pools and gardens give friendships room to become circles.',
      action: 'Meet your neighbors',
      panel: 'people',
    },
    {
      title: 'How shall we live together?',
      text: 'Your first circle has met. Hear the community and make your first agreement.',
      action: 'Open the citizen hour',
      panel: 'civic',
    },
    {
      title: 'A city for different lives',
      text: 'Reach 24 residents and 65 in belonging, freedom and nature. Read the report to see who needs attention.',
      action: 'Read the city report',
      panel: 'report',
    },
    {
      title: 'Let your city surprise you',
      text: 'Your community is flourishing. Follow new circles, reshape places and revisit the rules you made.',
      action: 'Explore community life',
      panel: 'people',
    },
  ][level];
}
export function concerns(s: State) {
  const c = s.community!;
  const list: {
    title: string;
    text: string;
    person?: number;
    action: string;
  }[] = [];
  const lonely = c.lives.filter((l) => l.belonging < 50);
  const uncomfortable = c.lives.filter((l) => l.comfort < 50);
  if (lonely.length)
    list.push({
      title: `${lonely.length} people want more connection`,
      text: 'Regular shared activities can help. Not everyone wants the same gathering.',
      person: lonely[0].id,
      action: 'Create a meeting place',
    });
  if (uncomfortable.length)
    list.push({
      title: `${uncomfortable.length} people need a better fit`,
      text: 'Privacy, housing preferences and nearby evening noise affect comfort.',
      person: uncomfortable[0].id,
      action: 'Review homes and quiet hours',
    });
  if (waterQuality(s) < 75)
    list.push({
      title: 'The water landscape needs support',
      text: 'Homes recycle water locally. A growing community also needs space for ecological restoration.',
      action: 'Add a living water garden',
    });
  if (!list.length)
    list.push({
      title: s.population
        ? 'There is room to let life happen'
        : 'Your community is waiting',
      text: s.population
        ? 'No urgent concern in the current measures. You can watch, talk or let people organize.'
        : 'Create homes, then watch the first arrivals.',
      action: s.population ? 'Meet someone' : 'Create homes',
    });
  return list;
}
export const POLICIES = [
  {
    id: 'late',
    title: 'Keep evenings open',
    text: 'Places may follow their own evening programmes. Nearby residents will experience the noise.',
  },
  {
    id: 'private',
    title: 'Let circles reserve their gatherings',
    text: 'Circle activities become members-only while a meeting is underway. Protect intimacy, but watch who feels excluded.',
  },
  {
    id: 'quiet',
    title: 'Quiet evenings',
    text: 'Music pauses after 20:00. Earlier dance sessions remain open.',
  },
  {
    id: 'open',
    title: 'Open commons',
    text: 'Every gathering welcomes visitors; participation is voluntary.',
  },
  {
    id: 'choice',
    title: 'A right to step away',
    text: 'People may decline a gathering. Restore open access and protect individual choice.',
  },
];
export function civicDecision(s: State, policy: string) {
  const c = s.community!;
  if (
    !s.population ||
    !POLICIES.some((p) => p.id === policy) ||
    (c.reviews > 0 && c.clock < c.reviewAt)
  )
    return s;
  const selected = POLICIES.find((p) => p.id === policy)!;
  const supports = (l: Life) =>
    policy === 'quiet'
      ? l.quiet
      : policy === 'late'
        ? !l.quiet || l.interest === 'dance'
        : policy === 'private'
          ? l.housing === 'privacy' && l.belonging >= 60
          : policy === 'open'
            ? l.housing === 'community' || l.belonging < 60
            : true;
  // One delegate per active circle, plus every unrepresented resident.
  // Each delegate carries their circle's majority preference; no invented votes.
  const delegates = c.government === 'circles';
  const represented = new Set<number>();
  const ballots: boolean[] = [];
  if (delegates)
    for (const group of c.groups) {
      const members = group.members
        .filter((id) => !represented.has(id))
        .map((id) => c.lives[id])
        .filter(Boolean);
      if (!members.length) continue;
      members.forEach((l) => represented.add(l.id));
      ballots.push(members.filter(supports).length > members.length / 2);
    }
  const voters = delegates
    ? c.lives.filter((l) => !represented.has(l.id))
    : c.lives;
  ballots.push(...voters.map(supports));
  const favor = ballots.filter(Boolean).length;
  const votes = c.government !== 'mayor';
  const passed = !votes || favor > ballots.length / 2;
  const result = votes
    ? `${favor}/${ballots.length} supported it ${delegates ? 'through circle delegates and unrepresented residents' : 'in an assembly vote'}.`
    : 'The mayor decided; residents can ask for review.';
  let next: State = {
    ...s,
    people: s.people.map((p) => ({
      ...p,
      trust: clamp(
        p.trust +
          (supports(c.lives[p.id]) === passed ? 3 : -3) +
          (votes ? 1 : 0),
      ),
    })),
    community: {
      ...c,
      quietHours:
        passed && policy === 'quiet'
          ? true
          : passed && policy === 'late'
            ? false
            : c.quietHours,
      openAccess:
        passed && (policy === 'open' || policy === 'choice')
          ? true
          : passed && policy === 'private'
            ? false
            : c.openAccess,
      reviews: c.reviews + 1,
      reviewAt: c.clock + 72,
      rules: [
        {
          day: s.day,
          text: `${selected.title}: ${passed ? 'adopted' : 'not adopted'}. ${result}`,
        },
        ...c.rules,
      ].slice(0, 20),
    },
  };
  next = event(next, {
    id: `agreement-${c.reviews + 1}`,
    title: passed
      ? `${selected.title} begins`
      : 'The community chose another path',
    text: `${votes ? result + ' ' : ''}${passed ? selected.text : 'The existing agreement remains.'} A new citizen hour is available in three days.`,
    tone: 'notice',
  });
  return next;
}
export function setGovernment(
  s: State,
  government: Community['government'],
): State {
  if (!['mayor', 'assembly', 'circles'].includes(government)) return s;
  return { ...s, community: { ...s.community!, government } };
}
export function parsePlace(text: string): PlaceSpec | null {
  const t = text.toLowerCase();
  let f: Form | undefined;
  if (
    /\b(co.?living|courtyard|terraced|terraces|communal home|apartments|lofts|shared house)\b/.test(
      t,
    )
  )
    f = 'customhome';
  else if (/\b(camp(site|ground)?|tent(s)?|zeltplatz)\b/.test(t)) f = 'camp';
  else if (/\b(high.?rise|tower|skyscraper|hochhaus)\b/.test(t)) f = 'tower';
  else if (/\b(cabin|woodland home|forest home)/.test(t)) f = 'woodland';
  else if (/\b(pool|swimming|swim)\b/.test(t)) f = 'pool';
  else if (/\b(wetland|water garden|sewage|wastewater)\b/.test(t))
    f = 'wetland';
  else if (/\b(workshop|atelier|art studio|wonder lab)\b/.test(t))
    f = 'workshop';
  else if (
    /\b(sanctuary|temple|church|mosque|prayer|meditation|reflection)\b/.test(t)
  )
    f = 'sanctuary';
  else if (/\b(school|learning|discovery|library)\b/.test(t)) f = 'learning';
  else if (/\b(observatory|telescope)\b/.test(t)) f = 'observatory';
  else if (/\b(garden|park|forest|grove)\b/.test(t)) f = 'garden';
  else if (/\b(commons|agora|meeting|pavilion|disco|club|cafe|café)\b/.test(t))
    f = 'pavilion';
  else if (/\b(home|house|cottage|housing|shelter|unterkunft)/.test(t))
    f = 'cottage';
  if (!f) return null;
  const chosen = structuredClone(PLACES[f]);
  if (chosen.capacity) {
    const number = t.match(
      /(?:for|with|housing)\s+(\d{1,3})\s*(?:people|residents|neighbors|rooms|homes|families)?/,
    );
    if (number) chosen.capacity = Math.max(1, Math.min(200, Number(number[1])));
    if (/\b(private|privacy|separate rooms)\b/.test(t)) chosen.privacy = 90;
    if (/\b(communal|shared|co.?living)\b/.test(t))
      chosen.programs = [p('rest', 0, 24), p('social', 8, 22)];
    if (number || chosen.form === 'customhome')
      chosen.footprint = Math.min(
        20,
        Math.max(1, Math.ceil(chosen.capacity / 16 + chosen.privacy / 35)),
      );
  }
  return changeProgram(chosen, text);
}
export function changeProgram(base: PlaceSpec, text: string): PlaceSpec {
  const next = structuredClone(base),
    t = text.toLowerCase();
  const clock = t.match(/(?:after|from|at)\s+(\d{1,2})(?::\d{2})?\s*(pm|am)?/);
  let start = clock ? Number(clock[1]) : 18;
  if (clock?.[2] === 'am' && start === 12) start = 0;
  if (clock?.[2] === 'pm' && start < 12) start += 12;
  start = Math.max(0, Math.min(23, start));
  const add = (activity: Activity) => {
    next.programs = next.programs.filter((p) => p.activity !== activity);
    next.programs.push({ activity, start, end: 24 });
  };
  if (/\b(disco|danc(e|ing)|nightclub|party)\b/.test(t)) {
    add('dance');
    if (base.form === 'pool')
      next.programs = next.programs
        .map((p) =>
          p.activity === 'swim' ? { ...p, end: Math.min(p.end, start) } : p,
        )
        .filter((p) => p.end > p.start);
    next.name = base.form === 'pool' ? 'Pool & afterglow' : base.name;
  }
  if (/\b(artist(s)?|art club|painting|making)\b/.test(t)) add('create');
  if (/\b(meditat(e|ion)|prayer|ritual)\b/.test(t) && base.form !== 'sanctuary')
    add('reflect');
  if (/\b(quiet|silent)\b/.test(t)) {
    next.quiet = 95;
    next.programs = next.programs.filter((p) => p.activity !== 'dance');
  }
  return next;
}
export function validPlace(p: unknown): p is PlaceSpec {
  if (!p || typeof p !== 'object') return false;
  const q = p as PlaceSpec;
  return (
    Object.hasOwn(PLACES, q.form) &&
    typeof q.name === 'string' &&
    q.name.length > 0 &&
    q.name.length <= 70 &&
    typeof q.description === 'string' &&
    q.description.length <= 500 &&
    [q.capacity, q.quiet, q.privacy, q.footprint].every(Number.isFinite) &&
    q.capacity >= 0 &&
    q.capacity <= 200 &&
    Number.isInteger(q.capacity) &&
    q.quiet >= 0 &&
    q.quiet <= 100 &&
    q.privacy >= 0 &&
    q.privacy <= 100 &&
    q.footprint >= -10 &&
    q.footprint <= 20 &&
    Array.isArray(q.programs) &&
    q.programs.length <= 8 &&
    q.programs.every(
      (p) =>
        Object.hasOwn(ACTIVITY, p.activity) &&
        Number.isInteger(p.start) &&
        p.start >= 0 &&
        p.start < 24 &&
        Number.isInteger(p.end) &&
        p.end > p.start &&
        p.end <= 24,
    )
  );
}
export function validCommunity(c: unknown, s: State): c is Community {
  try {
    if (!c || typeof c !== 'object') return false;
    const q = c as Community;
    const integer = (n: number, max = 1e7) =>
      Number.isInteger(n) && n >= 0 && n <= max;
    return (
      typeof q.started === 'boolean' &&
      integer(q.clock) &&
      integer(q.level, 5) &&
      integer(q.acknowledged, 5) &&
      integer(q.reviewAt) &&
      integer(q.reviews) &&
      integer(q.incidentAt) &&
      ['mayor', 'assembly', 'circles'].includes(q.government) &&
      typeof q.quietHours === 'boolean' &&
      typeof q.openAccess === 'boolean' &&
      Array.isArray(q.lives) &&
      q.lives.length === s.population &&
      q.lives.every(
        (l, i) =>
          l.id === i &&
          [l.home, l.at, l.target].every((k) => integer(k, 288)) &&
          Object.hasOwn(ACTIVITY, l.activity) &&
          Object.hasOwn(ACTIVITY, l.interest) &&
          typeof l.reason === 'string' &&
          l.reason.length <= 500 &&
          [l.belonging, l.autonomy, l.comfort].every(
            (n) => Number.isFinite(n) && n >= 0 && n <= 100,
          ) &&
          Array.isArray(l.friends) &&
          l.friends.length <= 8 &&
          l.friends.every((id) => integer(id, s.population - 1)) &&
          typeof l.quiet === 'boolean' &&
          ['nature', 'privacy', 'community'].includes(l.housing) &&
          integer(l.lastChoice) &&
          integer(l.visits),
      ) &&
      Array.isArray(q.groups) &&
      q.groups.length <= 10 &&
      q.groups.every(
        (g) =>
          typeof g.name === 'string' &&
          g.name.length <= 100 &&
          typeof g.id === 'string' &&
          g.id.length <= 80 &&
          Object.hasOwn(ACTIVITY, g.activity) &&
          integer(g.founder, s.population - 1) &&
          integer(g.venue, 288) &&
          integer(g.meetings) &&
          integer(g.lastMeeting) &&
          Array.isArray(g.members) &&
          g.members.length <= 10 &&
          g.members.every((id) => integer(id, s.population - 1)),
      ) &&
      Array.isArray(q.events) &&
      q.events.length <= 60 &&
      q.events.every(
        (e) =>
          typeof e.id === 'string' &&
          e.id.length <= 100 &&
          integer(e.time) &&
          typeof e.title === 'string' &&
          e.title.length <= 200 &&
          typeof e.text === 'string' &&
          e.text.length <= 800 &&
          ['good', 'concern', 'notice'].includes(e.tone) &&
          (e.person === undefined || integer(e.person, s.population - 1)) &&
          (e.place === undefined || integer(e.place, 288)),
      ) &&
      Array.isArray(q.history) &&
      q.history.length <= 24 &&
      q.history.every(
        (h) =>
          integer(h.day) &&
          [h.belonging, h.trust, h.nature].every(
            (n) => Number.isFinite(n) && n >= 0 && n <= 100,
          ),
      ) &&
      Array.isArray(q.rules) &&
      q.rules.length <= 20 &&
      q.rules.every(
        (r) =>
          integer(r.day) && typeof r.text === 'string' && r.text.length <= 500,
      )
    );
  } catch {
    return false;
  }
}
