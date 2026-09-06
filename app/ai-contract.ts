import { spec, ACTIVITY, waterQuality } from './community';
import { chapterOf, journeyOf } from './journey';
import { designSchema, validDesign } from './design';
import { validDesignRequest, type DesignRequest } from './design-contract';
import {
  KEYS,
  type Kind,
  type State,
  counts,
  pendingEvent,
  EVENTS,
} from './simulation';
import { profile, type Person } from './citizens';
export type AIPlan = {
  wish: string;
  kind: Kind;
  activity: string;
  reflection: string;
};
export type AIReply = {
  design?: DesignRequest | null;
  reply: string;
  memory: string;
  plan: AIPlan | null;
  builds: { kind: Kind; count: number; near: Kind | null }[];
};
export type AIContext = {
  message: string;
  sharedLife?: string;
  selected?: State['tiles'][number] | { x: number; y: number } | null;
  pendingDesign?: DesignRequest | null;
  places?: { x: number; y: number; kind: Kind; name: string }[];
  city: {
    day: number;
    population: number;
    stats: State['stats'];
    buildings: ReturnType<typeof counts>;
    council: string | null;
  };
  resident:
    | (ReturnType<typeof profile> & {
        id: number;
        progress: number;
        trust: number;
        memories: string[];
      })
    | null;
  history: { speaker: string; text: string }[];
};
export function residentProfile(p: Person) {
  return {
    ...profile(p.id),
    ...(p.ai
      ? { wish: p.ai.wish, kind: p.ai.kind, activity: p.ai.activity }
      : {}),
  };
}
export function contextFor(
  s: State,
  message: string,
  speaker: number | 'aura',
  history: { speaker: number | 'aura' | 'you'; text: string }[],
  selection?: { x: number; y: number } | null,
): AIContext {
  const p = speaker === 'aura' ? null : s.people[speaker];
  return {
    message,
    sharedLife: JSON.stringify(
      s.community
        ? {
            mode: 'founding-community',
            role: 'founding mayor',
            hour: s.community.clock % 24,
            chapter: s.community.level + 1,
            government: s.community.government,
            quietHours: s.community.quietHours,
            waterQuality: waterQuality(s),
            residentLife: p ? s.community.lives[p.id] : null,
            groups: s.community.groups.slice(-2).map((g) => ({
              name: g.name,
              activity: g.activity,
              members: g.members.length,
              meetings: g.meetings,
            })),
            recentEvents: s.community.events.slice(0, 2).map((e) => ({
              title: e.title.slice(0, 100),
              text: e.text.slice(0, 220),
            })),
            selectedPlace: selection
              ? s.tiles
                  .filter((t) => t.x === selection.x && t.y === selection.y)
                  .map((t) => ({
                    form: spec(t).form,
                    name: spec(t).name,
                    programmes: spec(t).programs,
                  }))
              : null,
            places: s.tiles.slice(-3).map((t) => ({
              name: spec(t).name,
              programmes: spec(t).programs.map(
                (p) => `${ACTIVITY[p.activity]} ${p.start}-${p.end}`,
              ),
            })),
          }
        : {
            role: 'mayor',
            chapter: chapterOf(s)?.title || 'Open city life',
            phase: journeyOf(s).phase,
            venue: journeyOf(s).venue || null,
            latestMemories: (s.moments || [])
              .slice(0, 3)
              .map((m) => ({ title: m.title, text: m.text, day: m.day })),
          },
    ).slice(0, 3200),
    selected: selection
      ? s.tiles.find((t) => t.x === selection.x && t.y === selection.y) ||
        selection
      : null,
    pendingDesign: s.designProposal || null,
    places: s.tiles
      .filter((t) => t.kind !== 'core')
      .slice(-12)
      .map((t) => ({
        x: t.x,
        y: t.y,
        kind: t.kind,
        name: t.design?.name || t.place?.name || t.kind,
      })),
    city: {
      day: s.day,
      population: s.population,
      stats: s.stats,
      buildings: counts(s),
      council: s.community
        ? null
        : pendingEvent(s) >= 0
          ? EVENTS[pendingEvent(s)].title
          : null,
    },
    resident: p
      ? {
          ...residentProfile(p),
          ...(s.community
            ? {
                activity:
                  ACTIVITY[s.community.lives[p.id].activity] +
                  ': ' +
                  s.community.lives[p.id].reason,
              }
            : {}),
          id: p.id,
          progress: p.progress,
          trust: p.trust,
          memories: p.memories,
        }
      : null,
    history: history.slice(-8).map((m) => ({
      speaker:
        m.speaker === 'you'
          ? 'Player'
          : m.speaker === 'aura'
            ? 'AURA'
            : profile(m.speaker).name,
      text: m.text.slice(0, 900),
    })),
  };
}
const str = (x: unknown, max: number) =>
  typeof x === 'string' && x.length <= max;
export function validAIContext(input: unknown): input is AIContext {
  try {
    const v = input as AIContext;
    return (
      !!v &&
      str(v.message, 600) &&
      (v.sharedLife === undefined || str(v.sharedLife, 3200)) &&
      (v.pendingDesign == null || validDesignRequest(v.pendingDesign)) &&
      (v.selected == null ||
        (Number.isInteger(v.selected.x) &&
          Number.isInteger(v.selected.y) &&
          v.selected.x >= 0 &&
          v.selected.x < 17 &&
          v.selected.y >= 0 &&
          v.selected.y < 17 &&
          (!('kind' in v.selected) ||
            KEYS.includes(v.selected.kind) ||
            v.selected.kind === 'core') &&
          (!('design' in v.selected) ||
            v.selected.design === undefined ||
            validDesign(v.selected.design)))) &&
      (v.places === undefined ||
        (Array.isArray(v.places) &&
          v.places.length <= 12 &&
          v.places.every(
            (p) =>
              Number.isInteger(p.x) &&
              p.x >= 0 &&
              p.x < 17 &&
              Number.isInteger(p.y) &&
              p.y >= 0 &&
              p.y < 17 &&
              KEYS.includes(p.kind) &&
              str(p.name, 70),
          ))) &&
      v.message.trim().length > 0 &&
      Number.isInteger(v.city.day) &&
      v.city.day >= 1 &&
      Number.isInteger(v.city.population) &&
      v.city.population >= 0 &&
      v.city.population < 15000 &&
      Object.values(v.city.stats).length === 4 &&
      ['meaning', 'connection', 'freedom', 'nature'].every((k) => {
        const n = v.city.stats[k as keyof State['stats']];
        return Number.isFinite(n) && n >= 0 && n <= 100;
      }) &&
      KEYS.every(
        (k) =>
          Number.isInteger(v.city.buildings[k]) &&
          v.city.buildings[k] >= 0 &&
          v.city.buildings[k] <= 289,
      ) &&
      (v.city.council === null || str(v.city.council, 150)) &&
      Array.isArray(v.history) &&
      v.history.length <= 8 &&
      v.history.every((m) => str(m.speaker, 100) && str(m.text, 900)) &&
      (v.resident === null ||
        (Number.isInteger(v.resident.id) &&
          v.resident.id >= 0 &&
          v.resident.id < 15000 &&
          ['name', 'trait', 'wish', 'why', 'fear', 'belief', 'activity'].every(
            (k) => str(v.resident![k as keyof typeof v.resident], 1500),
          ) &&
          KEYS.includes(v.resident.kind) &&
          Number.isFinite(v.resident.progress) &&
          v.resident.progress >= 0 &&
          v.resident.progress <= 100 &&
          Array.isArray(v.resident.memories) &&
          v.resident.memories.length <= 5 &&
          v.resident.memories.every((m) => str(m, 300))))
    );
  } catch {
    return false;
  }
}
export function validAIReply(input: unknown): input is AIReply {
  try {
    const v = input as AIReply;
    return (
      !!v &&
      (v.design == null || validDesignRequest(v.design)) &&
      str(v.reply, 1600) &&
      v.reply.trim().length > 0 &&
      str(v.memory, 240) &&
      Array.isArray(v.builds) &&
      v.builds.length <= 3 &&
      v.builds.every(
        (b) =>
          KEYS.includes(b.kind) &&
          Number.isInteger(b.count) &&
          b.count >= 1 &&
          b.count <= 5 &&
          (b.near === null || KEYS.includes(b.near)),
      ) &&
      v.builds.reduce((n, b) => n + b.count, 0) <= 10 &&
      (v.plan === null ||
        (str(v.plan.wish, 240) &&
          v.plan.wish.trim().length > 0 &&
          KEYS.includes(v.plan.kind) &&
          str(v.plan.activity, 240) &&
          str(v.plan.reflection, 300)))
    );
  } catch {
    return false;
  }
}
export const replySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['reply', 'memory', 'plan', 'builds', 'design'],
  properties: {
    design: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          additionalProperties: false,
          required: ['blueprint', 'kind', 'near', 'target'],
          properties: {
            blueprint: designSchema,
            kind: { type: 'string', enum: KEYS },
            near: { anyOf: [{ type: 'null' }, { type: 'string', enum: KEYS }] },
            target: {
              anyOf: [
                { type: 'null' },
                {
                  type: 'object',
                  additionalProperties: false,
                  required: ['x', 'y'],
                  properties: {
                    x: { type: 'integer', minimum: 0, maximum: 16 },
                    y: { type: 'integer', minimum: 0, maximum: 16 },
                  },
                },
              ],
            },
          },
        },
      ],
    },
    reply: { type: 'string' },
    memory: { type: 'string' },
    plan: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          additionalProperties: false,
          required: ['wish', 'kind', 'activity', 'reflection'],
          properties: {
            wish: { type: 'string' },
            kind: { type: 'string', enum: KEYS },
            activity: { type: 'string' },
            reflection: { type: 'string' },
          },
        },
      ],
    },
    builds: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['kind', 'count', 'near'],
        properties: {
          kind: { type: 'string', enum: KEYS },
          count: { type: 'integer' },
          near: { anyOf: [{ type: 'null' }, { type: 'string', enum: KEYS }] },
        },
      },
    },
  },
};
