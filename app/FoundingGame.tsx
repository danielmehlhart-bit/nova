'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Mic,
  Square,
  Send,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Plus,
  Users,
  BarChart3,
  Landmark,
  BookOpen,
  Trees,
  Sun,
  Moon,
  ArrowUpRight,
  Sparkles,
  Home,
  Settings,
  Undo2,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import CommunityWorld from './CommunityWorld';
import {
  foundingState,
  communityTick,
  PLACES,
  ACTIVITY,
  LEVELS,
  POLICIES,
  spec,
  tileKey,
  putPlace,
  removePlace,
  nextStep,
  concerns,
  satisfaction,
  capacity,
  waterQuality,
  parsePlace,
  PLACES as HOME_STARTS,
  changeProgram,
  civicDecision,
  setGovernment,
  type PlaceSpec,
  type Activity,
} from './community';
import { validSave, type State, type Tile } from './simulation';
import { profile } from './citizens';
import { contextFor, validAIReply } from './ai-contract';
import { applyAIReply } from './ai-actions';
import { buildDesign } from './design-actions';
import DesignPreview from './DesignPreview';
import { useVoice } from './useVoice';
import './community.css';
const SAVE = 'nova-community-v2',
  BACKUP = 'nova-community-backup';
type Panel =
  | 'build'
  | 'people'
  | 'civic'
  | 'report'
  | 'journal'
  | 'chat'
  | 'settings'
  | 'place'
  | 'design'
  | null;
type Message = { speaker: 'aura' | 'you' | number; text: string; day: number };
const welcome =
  '2186. Machines provide the essentials. No money. No compulsory work. But a good life together is still ours to invent. You are the founding mayor. Start with homes: tents, cabins, a tower — your choice.';
const fullName = (speaker: 'aura' | 'you' | number) =>
  speaker === 'aura'
    ? 'AURA'
    : speaker === 'you'
      ? 'You'
      : profile(speaker).name;
function Meter({
  label,
  value,
  color = '#a4bd8b',
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="f-meter">
      <div>
        <span>{label}</span>
        <strong>
          {Math.round(value)}
          <small> / 100</small>
        </strong>
      </div>
      <div className="f-track">
        <i style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Inline SVG is the chart, not an external image. */
function Trend({ points, color }: { points: number[]; color: string }) {
  return (
    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- Inline vector chart with an accessible name.
    <svg
      viewBox="0 0 280 64"
      role="img"
      aria-label="Daily trend, oldest to newest"
    >
      <path d="M0 63H280" stroke="#d8dfd1" />
      <polyline
        points={points
          .map(
            (v, i) =>
              `${(i * 280) / Math.max(1, points.length - 1)},${62 - v * 0.6}`,
          )
          .join(' ')}
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
/* oxlint-enable jsx-a11y/prefer-tag-over-role */
export default function FoundingGame({ onLegacy }: { onLegacy: () => void }) {
  const [state, setState] = useState<State>(foundingState),
    [ready, setReady] = useState(false),
    [panel, setPanel] = useState<Panel>(null),
    [paused, setPaused] = useState(false),
    [speed, setSpeed] = useState(1),
    [skyOverride, setNight] = useState<boolean | null>(null),
    [quality, setQuality] = useState<'low' | 'high'>('low'),
    [selected, setSelected] = useState<number | null>(null),
    [focus, setFocus] = useState<{ key: number; serial: number } | null>(null),
    [person, setPerson] = useState<number | null>(null),
    [tool, setTool] = useState<PlaceSpec | null>(null),
    [idea, setIdea] = useState(''),
    [search, setSearch] = useState(''),
    [input, setInput] = useState(''),
    [writing, setWriting] = useState(false),
    [aiReady, setAiReady] = useState(false),
    [thinking, setThinking] = useState(false),
    [speaker, setSpeaker] = useState<'aura' | number>('aura'),
    [messages, setMessages] = useState<Message[]>([
      { speaker: 'aura', text: welcome, day: 1 },
    ]),
    [notice, setNotice] = useState(''),
    [saveError, setSaveError] = useState(''),
    [reset, setReset] = useState(false),
    [hasPrevious, setHasPrevious] = useState(false),
    [undone, setUndone] = useState<Tile[][]>([]),
    [showLevel, setShowLevel] = useState(false);
  const stateRef = useRef(state),
    busy = useRef(false),
    mounted = useRef(true),
    abortRef = useRef<AbortController | null>(null),
    submitRef = useRef<(s: string) => Promise<void>>(async () => {}),
    titleRef = useRef<HTMLHeadingElement>(null),
    dialogRef = useRef<HTMLDivElement>(null),
    messageRef = useRef<HTMLDivElement>(null);
  const voice = useVoice((text) => void submitRef.current(text), aiReady);
  const c = state.community!,
    night = skyOverride ?? (c.clock % 24 >= 19 || c.clock % 24 < 7),
    step = nextStep(state),
    place = state.tiles.find((t) => tileKey(t) === selected),
    life = person === null ? undefined : c.lives[person],
    resident = person === null ? undefined : state.people[person];
  useEffect(() => {
    mounted.current = true;
    const hydration = setTimeout(() => {
      try {
        const raw = localStorage.getItem(SAVE);
        if (raw) {
          const data = JSON.parse(raw);
          if (validSave(data) && data.community) {
            setState(data);
            if (data.community.started)
              setMessages([
                { speaker: 'aura', text: nextStep(data).text, day: data.day },
              ]);
          } else
            setSaveError(
              'This save could not be loaded. It has been left untouched. Start a new community only when you are ready.',
            );
        }
        setHasPrevious(!!localStorage.getItem('nova-after-work-v1'));
        setPaused(localStorage.getItem('nova-community-paused') === 'true');
        setQuality(
          localStorage.getItem('nova-community-quality') === 'high'
            ? 'high'
            : 'low',
        );
      } catch {
        setSaveError(
          'Your browser could not load local saves. Keep this tab open to preserve this session.',
        );
      }
      setReady(true);
    }, 0);
    const abort = new AbortController();
    void fetch('/api/ai', { signal: abort.signal })
      .then((r) => r.json())
      .then((d) => {
        if (mounted.current)
          setAiReady(
            !!d && typeof d === 'object' && 'enabled' in d && !!d.enabled,
          );
      })
      .catch(() => {});
    return () => {
      clearTimeout(hydration);
      mounted.current = false;
      abort.abort();
      abortRef.current?.abort();
    };
  }, []);
  useEffect(() => {
    stateRef.current = state;
    if (!ready || saveError) return;
    try {
      localStorage.setItem(SAVE, JSON.stringify(state));
    } catch {
      queueMicrotask(() =>
        setSaveError(
          'Your city is running, but the browser could not save it. Export a copy in Settings.',
        ),
      );
    }
  }, [state, ready, saveError]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem('nova-community-paused', String(paused));
      localStorage.setItem('nova-community-quality', quality);
    } catch {
      /* Gameplay remains available. */
    }
  }, [paused, quality, ready]);
  useEffect(() => {
    if (
      !ready ||
      !c.started ||
      paused ||
      panel ||
      person !== null ||
      voice.listening ||
      voice.transcribing ||
      thinking ||
      showLevel
    )
      return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setState((old) => communityTick(old));
    }, 2500 / speed);
    return () => clearInterval(timer);
  }, [
    ready,
    c.started,
    paused,
    panel,
    person,
    voice.listening,
    voice.transcribing,
    thinking,
    speed,
    showLevel,
  ]);
  useEffect(() => {
    if (c.level > c.acknowledged) {
      const timer = setTimeout(() => setShowLevel(true), 0);
      return () => clearTimeout(timer);
    }
  }, [c.level, c.acknowledged]);
  useEffect(() => {
    if (panel) {
      titleRef.current?.focus({ preventScroll: true });
      if (dialogRef.current) dialogRef.current.scrollTop = 0;
    }
  }, [panel, person]);
  useEffect(() => {
    if (panel === 'chat')
      messageRef.current?.lastElementChild?.scrollIntoView({
        block: 'nearest',
      });
  }, [panel, messages.length]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 7500);
    return () => clearTimeout(timer);
  }, [notice]);
  const commit = (s: State) => {
    stateRef.current = s;
    setState(s);
  };
  const say = (text: string, who: 'aura' | number = 'aura') => {
    setMessages((m) => [
      ...m.slice(-29),
      { speaker: who, text, day: stateRef.current.day },
    ]);
    voice.say(text, who);
  };
  const go = (key: number) => {
    setSelected(key);
    setFocus({ key, serial: (focus?.serial || 0) + 1 });
  };
  const begin = () => {
    commit({
      ...stateRef.current,
      community: { ...stateRef.current.community!, started: true },
    });
    setPanel('build');
    say(
      'Welcome, Mayor. Choose a first home. Describe your own way of living, or adapt any starting idea. All sizes and forms are possible from the beginning.',
    );
  };
  const build = (blueprint: PlaceSpec, point?: { x: number; y: number }) => {
    const before = stateRef.current;
    const result = putPlace(before, blueprint, point);
    if (result.tile) {
      setUndone((u) => [...u.slice(-9), before.tiles]);
      commit(result.state);
      setTool(null);
      setPanel(null);
      go(tileKey(result.tile));
    }
    setNotice(result.text);
    say(result.text);
  };
  const selectPlot = (x: number, y: number) => {
    if (busy.current) return;
    if (tool) {
      build(tool, { x, y });
      return;
    }
    setSelected(y * 17 + x);
    if (stateRef.current.tiles.some((t) => t.x === x && t.y === y))
      setPanel('place');
  };
  const open = (p: Panel) => {
    setTool(null);
    setPanel(p);
    setPerson(null);
  };
  const visitPerson = (id: number) => {
    if (!stateRef.current.people[id]) return;
    setPerson(id);
    setSpeaker(id);
    setPanel('people');
  };
  const applyDesign = () => {
    const before = stateRef.current,
      result = buildDesign(before);
    if (result.tile) {
      setUndone((u) => [...u.slice(-9), before.tiles]);
      commit(result.state);
      go(tileKey(result.tile));
      setPanel(null);
    }
    say(result.text);
  };
  const submit = async (raw: string) => {
    const text = raw.trim().slice(0, 600);
    if (!text || busy.current) return;
    voice.quiet();
    voice.clearError();
    setInput('');
    setWriting(false);
    setMessages((m) => [
      ...m.slice(-29),
      { speaker: 'you', text, day: stateRef.current.day },
    ]);
    const s = stateRef.current,
      t = text.toLowerCase().replace(/[.!?]+$/, '');
    if (
      /^(what should i do( first| next)?|what is my (role|goal)|help|what now)$/.test(
        t,
      )
    ) {
      say('You are the founding mayor. ' + nextStep(s).text);
      return;
    }
    if (/^(pause|pause time)$/.test(t)) {
      setPaused(true);
      say('Time is paused.');
      return;
    }
    if (/^(resume|resume time|continue time)$/.test(t)) {
      setPaused(false);
      say('Your community carries on.');
      return;
    }
    if (/^(make it night|show night)$/.test(t)) {
      setNight(true);
      return;
    }
    if (/^(make it day|show daylight)$/.test(t)) {
      setNight(false);
      return;
    }
    const screens: Record<string, Panel> = {
      'open the council': 'civic',
      'open the citizen hour': 'civic',
      'show the report': 'report',
      'show my city': 'report',
      'open memories': 'journal',
      'open build': 'build',
      'meet the residents': 'people',
    };
    if (screens[t]) {
      open(screens[t]);
      return;
    }
    if (/^(talk to|speak to) aura$/.test(t)) {
      setSpeaker('aura');
      say('I am here, Mayor. What would you like to explore?');
      return;
    }
    const talkName = t.match(/^(?:talk to|speak to) (.+)$/);
    const who = speaker;
    if (talkName) {
      const found = s.people.find((p) =>
        profile(p.id).name.toLowerCase().includes(talkName[1]),
      );
      if (!found) {
        say(
          'That person has not arrived yet. Open People to meet your neighbors.',
        );
        return;
      }
      setSpeaker(found.id);
      setPerson(found.id);
      setPanel('chat');
      say(s.community!.lives[found.id].reason, found.id);
      return;
    }
    if (/^(build|approve|place|accept) (this |the )?design$/.test(t)) {
      applyDesign();
      return;
    }
    if (/^(discard|cancel) (this |the )?design$/.test(t)) {
      commit({ ...s, designProposal: undefined });
      say('The design has been set aside.');
      return;
    }
    const directBuild =
      /^(please )?(build|create|make|add|place|start|set up)\b/.test(t) &&
      !/^make it (night|day)/.test(t);
    const blueprint = parsePlace(text);
    const newDesign =
      /\b(propose|design|create) (a|an|new)\b/.test(t) &&
      !/\b(this|selected|redesign|reshape|replace)\b/.test(t);
    const customShape =
      /\b(redesign|reshape|octagon|circular|round building|terrace|geometr|dome|facade)\b/.test(
        t,
      );
    const programEdit =
      /\b(after|from|at)\s+\d|\b(quiet|disco|artists|dancing)\b/.test(t) &&
      /^(please )?(make|change|turn|let|use|set|add)\b/.test(t);
    if (
      programEdit &&
      selected !== null &&
      s.tiles.some((tile) => tileKey(tile) === selected) &&
      !customShape &&
      !/^(build|create|place)\b/.test(t)
    ) {
      const tile = s.tiles.find((tile) => tileKey(tile) === selected)!;
      const next = changeProgram(spec(tile), text);
      if (
        JSON.stringify(next.programs) === JSON.stringify(spec(tile).programs) &&
        next.quiet === spec(tile).quiet
      ) {
        say(
          'I can change this place’s activity and opening hours. Try “Make it a disco after 18” or edit its programme below.',
        );
        setPanel('place');
        return;
      }
      commit({
        ...s,
        tiles: s.tiles.map((t) => (t === tile ? { ...t, place: next } : t)),
      });
      say(
        `${next.name} now offers ${next.programs.map((p) => `${ACTIVITY[p.activity].toLowerCase()} from ${p.start}:00 to ${p.end}:00`).join(', ')}. People choose whether to join.`,
      );
      setPanel(null);
      return;
    }
    if (directBuild && blueprint && !customShape) {
      const number = t.match(/\b(two|three|four|five|[1-5])\b/),
        count = number
          ? ({ two: 2, three: 3, four: 4, five: 5 } as Record<string, number>)[
              number[1]
            ] || Number(number[1])
          : 1;
      let next = s,
        last: Tile | undefined;
      for (let i = 0; i < count; i++) {
        const r = putPlace(next, blueprint);
        next = r.state;
        last = r.tile;
      }
      if (last) {
        setUndone((u) => [...u.slice(-9), s.tiles]);
        commit(next);
        go(tileKey(last));
        setPanel(null);
        say(
          `${count} ${blueprint.name.toLowerCase()} ${count === 1 ? 'is' : 'are'} ready. ${blueprint.capacity ? 'Let time run to welcome people.' : 'Watch who chooses to visit.'}`,
        );
      } else say('There is no free plot. Choose a place to change or remove.');
      return;
    }
    if (!aiReady) {
      const l = typeof who === 'number' ? s.community!.lives[who] : undefined;
      say(
        l
          ? `${l.reason} ${l.comfort < 50 ? 'I would appreciate a quieter home with a little more privacy.' : l.belonging < 50 ? 'I would like more chances to meet people.' : 'I am finding my own rhythm here.'}`
          : 'You can describe a campsite, homes, a pool or another place in the library. Free conversations become available when the AI connection returns.',
        who,
      );
      return;
    }
    busy.current = true;
    setThinking(true);
    const abort = new AbortController();
    abortRef.current = abort;
    const timer = setTimeout(() => abort.abort(), 30000);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          contextFor(
            s,
            text,
            who,
            messages,
            selected === null || newDesign
              ? null
              : { x: selected % 17, y: Math.floor(selected / 17) },
          ),
        ),
        signal: abort.signal,
      });
      const data = await response.json();
      if (!response.ok || !validAIReply(data))
        throw new Error(
          !!data &&
            typeof data === 'object' &&
            'error' in data &&
            typeof data.error === 'string'
            ? data.error
            : 'The conversation could not continue. Please try again.',
        );
      if (!mounted.current) return;
      // A request for a new place cannot silently retarget the last selected home.
      const reply =
        newDesign && data.design
          ? { ...data, design: { ...data.design, target: null } }
          : data;
      const applied = applyAIReply(stateRef.current, who, reply);
      commit(applied.state);
      say(applied.text, who);
      if (data.design && applied.state.designProposal) setPanel('design');
      else if (panel === 'chat' || person !== null) setPanel('chat');
    } catch (error) {
      if (mounted.current) {
        const text =
          error instanceof Error && error.name === 'AbortError'
            ? 'The reply took too long. Your city is unchanged. Try again.'
            : error instanceof Error
              ? error.message
              : 'The conversation could not continue.';
        setNotice(text);
        setInput(raw);
        setWriting(true);
      }
    } finally {
      clearTimeout(timer);
      busy.current = false;
      if (mounted.current) setThinking(false);
    }
  };
  useEffect(() => {
    submitRef.current = submit;
  });
  const undo = () => {
    const previous = undone.at(-1);
    if (!previous) {
      setNotice('There is no building change to undo in this session.');
      return;
    }
    if (capacity({ ...state, tiles: previous }) < state.population) {
      setNotice(
        'New residents have moved in. Keep enough homes before undoing.',
      );
      return;
    }
    commit({ ...stateRef.current, tiles: previous });
    setUndone((u) => u.slice(0, -1));
    setSelected(null);
    setNotice('The last building change is undone.');
  };
  const schedule = (activity: Activity, start: number, end: number) => {
    if (!place) return;
    if (end <= start) {
      setNotice('The end time must be later than the start time.');
      return;
    }
    const next = structuredClone(spec(place));
    next.programs = next.programs.filter((p) => p.activity !== activity);
    next.programs.push({ activity, start, end });
    commit({
      ...state,
      tiles: state.tiles.map((t) => (t === place ? { ...t, place: next } : t)),
    });
  };
  const exportSave = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(stateRef.current)], {
        type: 'application/json',
      }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nova-community.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const latest = messages.at(-1)!,
    averageComfort = c.lives.length
      ? c.lives.reduce((n, l) => n + l.comfort, 0) / c.lives.length
      : 50;
  return (
    <main className="founding-game">
      <header className="f-header">
        <div className="f-brand">
          <Sparkles />
          <span>
            NOVA<small>AFTER WORK</small>
          </span>
        </div>
        <span className="f-world-label">
          A place to belong <span>2186 · no money, no compulsory work</span>
        </span>
        <div className="f-time">
          <span>
            DAY {state.day}
            <strong>{String(c.clock % 24).padStart(2, '0')}:00</strong>
          </span>
          <button
            aria-label={paused ? 'Resume time' : 'Pause time'}
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play size={17} /> : <Pause size={17} />}
          </button>
          <button
            aria-label={`Speed ${speed} times`}
            onClick={() => setSpeed(speed === 1 ? 3 : speed === 3 ? 6 : 1)}
          >
            {speed}×
          </button>
          <button
            aria-label="Settings and help"
            onClick={() => open('settings')}
          >
            <Settings size={17} />
          </button>
        </div>
      </header>
      <section className="f-landscape" aria-label="Your community">
        <CommunityWorld
          state={state}
          selected={selected}
          focus={focus}
          building={!!tool}
          night={night}
          quality={quality}
          onHighlight={setSelected}
          onPick={selectPlot}
          onPerson={visitPerson}
        />
        {c.started && (
          <aside className="f-objective">
            <span className="f-eyebrow">
              YOU ARE THE MAYOR · CHAPTER {c.level + 1}
            </span>
            <h1>{step.title}</h1>
            <p>{step.text}</p>
            <button onClick={() => open(step.panel as Panel)}>
              {step.action}
              <ArrowUpRight size={16} />
            </button>
          </aside>
        )}
        <button
          className="f-city-pulse"
          onClick={() => open('report')}
          aria-label="Open city report"
        >
          <Users size={16} />
          <b>{state.population}</b>
          <span>residents</span>
          <i />
          <span>{Math.round(state.stats.connection)}% belonging</span>
          <BarChart3 size={16} />
        </button>
        {c.started && c.events[0] && (
          <button
            className={`f-world-story ${c.events[0].tone}`}
            onClick={() => {
              const e = c.events[0];
              if (e.place !== undefined) go(e.place);
              open('journal');
            }}
          >
            <Sparkles size={17} />
            <span>
              <small>YOUR CITY IS ALIVE</small>
              {c.events[0].title}
            </span>
            <ChevronRight size={16} />
          </button>
        )}
        {tool && (
          <div className="f-placement">
            <span>
              <strong>{tool.name}</strong> · Tap an empty plot
            </span>
            <button onClick={() => build(tool)}>Place nearby</button>
            <button aria-label="Cancel placement" onClick={() => setTool(null)}>
              <X size={17} />
            </button>
          </div>
        )}
        <div className="f-map-tools">
          <button
            aria-label={night ? 'Show daylight' : 'Show nighttime'}
            onClick={() => setNight(!night)}
          >
            {night ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            aria-label="Center the island"
            onClick={() => {
              setFocus({ key: 144, serial: (focus?.serial || 0) + 1 });
            }}
          >
            <MapPin size={18} />
          </button>
          <button
            aria-label="Undo last building"
            onClick={undo}
            disabled={!undone.length}
          >
            <Undo2 size={18} />
          </button>
          <span>Drag to explore · Pinch to look closer</span>
        </div>
        {notice && (
          <output className="f-toast">
            {notice}
            <button aria-label="Dismiss message" onClick={() => setNotice('')}>
              <X size={14} />
            </button>
          </output>
        )}
      </section>
      <footer className="f-dock">
        <button className="f-reply" onClick={() => open('chat')}>
          <span className="f-avatar">
            {latest.speaker === 'aura' ? (
              <Sparkles size={15} />
            ) : latest.speaker === 'you' ? (
              'YOU'
            ) : (
              profile(latest.speaker).initials
            )}
          </span>
          <strong>{thinking ? 'Thinking…' : fullName(latest.speaker)}</strong>
          <span>
            {thinking ? 'Considering your city and your idea…' : latest.text}
          </span>
        </button>
        <button
          className="f-mute"
          aria-label={
            voice.spoken ? 'Mute spoken replies' : 'Enable spoken replies'
          }
          onClick={voice.toggleSpoken}
        >
          {voice.spoken ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>
        <div className="f-dock-actions">
          <button
            className={`f-talk ${voice.listening ? 'active' : ''}`}
            disabled={thinking || voice.transcribing}
            onClick={voice.listen}
            aria-label={
              voice.listening ? 'Finish speaking' : 'Talk to the city'
            }
          >
            {voice.listening ? <Square size={18} /> : <Mic size={18} />}
            <span>
              {voice.listening
                ? 'Finish'
                : voice.transcribing
                  ? 'One moment'
                  : 'Talk'}
            </span>
          </button>
          <button
            onClick={() => setWriting(!writing)}
            aria-label="Write an instruction"
          >
            <Send size={17} />
            <span>Write</span>
          </button>
          <button onClick={() => open('build')}>
            <Plus size={19} />
            <span>Create</span>
          </button>
          <button onClick={() => open('people')}>
            <Users size={19} />
            <span>People</span>
          </button>
          <button
            onClick={() => open('civic')}
            className={
              c.clock >= c.reviewAt && state.population ? 'attention' : ''
            }
          >
            <Landmark size={18} />
            <span>Citizen hour</span>
          </button>
          <button onClick={() => open('report')}>
            <BarChart3 size={18} />
            <span>Report</span>
          </button>
        </div>
        {writing && (
          <form
            className="f-input"
            onSubmit={(e) => {
              e.preventDefault();
              void submit(input);
            }}
          >
            <input
              aria-label="Your instruction"
              value={voice.listening ? voice.interim : input}
              onChange={(e) => setInput(e.target.value)}
              readOnly={thinking || voice.listening}
              placeholder="Build a campsite… or ask a question"
              maxLength={600}
            />
            <button
              disabled={!input.trim() || thinking || voice.listening}
              aria-label="Send instruction"
            >
              <Send size={18} />
            </button>
            <button
              type="button"
              aria-label="Close typing"
              onClick={() => setWriting(false)}
            >
              <X size={17} />
            </button>
          </form>
        )}
        {(voice.error ||
          voice.listening ||
          voice.transcribing ||
          saveError) && (
          <output className="f-status">
            {voice.error ||
              saveError ||
              (voice.transcribing
                ? 'Turning your voice into words…'
                : voice.interim || 'Listening…')}
          </output>
        )}
      </footer>
      <Dialog open={ready && !c.started} onOpenChange={() => {}}>
        <DialogContent className="f-dialog f-intro" showCloseButton={false}>
          <DialogHeader>
            <span className="f-eyebrow">NOVA · 2186</span>
            <DialogTitle>
              Everything is possible.
              <br />
              <em>Living together is new.</em>
            </DialogTitle>
            <DialogDescription>
              Machines provide food, energy and anything we can manufacture.
              There is no money. Nobody needs a job to survive.
            </DialogDescription>
          </DialogHeader>
          <p>
            But abundance hasn’t taught us how to live together. Eight people
            want to start a community on this island.
          </p>
          <div className="f-role">
            <span>YOUR ROLE</span>
            <strong>You are their founding mayor.</strong>
            <p>
              Create homes. Listen to different needs. Help a community find its
              own way of living.
            </p>
          </div>
          <p className="f-intro-note">
            A shared courtyard, a little retreat, an idea nobody has tried? Your
            first decision is yours. Materials are free; your choices shape
            people’s lives.
          </p>
          <button className="f-primary" onClick={begin}>
            Let’s begin on the green meadow <ArrowUpRight size={18} />
          </button>
          <button
            className="f-text-button"
            onClick={() => voice.say(welcome, 'aura')}
          >
            <Volume2 size={15} /> Listen to the introduction
          </button>
          {hasPrevious && (
            <button className="f-text-button" onClick={onLegacy}>
              Open my previous NOVA city
            </button>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={showLevel && c.started}
        onOpenChange={(open) => {
          if (!open) {
            commit({ ...state, community: { ...c, acknowledged: c.level } });
            setShowLevel(false);
          }
        }}
      >
        <DialogContent className="f-dialog f-celebrate">
          <DialogHeader>
            <span className="f-eyebrow">YOUR COMMUNITY IS GROWING</span>
            <DialogTitle>{LEVELS[c.level].name}</DialogTitle>
            <DialogDescription>{LEVELS[c.level].reward}</DialogDescription>
          </DialogHeader>
          <div className="f-chapter-orbit">
            <Sparkles size={38} />
            <span>CHAPTER {c.level + 1}</span>
          </div>
          <p>{step.text}</p>
          <button
            className="f-primary"
            onClick={() => {
              commit({ ...state, community: { ...c, acknowledged: c.level } });
              setShowLevel(false);
            }}
          >
            See what happens next <ArrowUpRight size={18} />
          </button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={panel !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPanel(null);
            setPerson(null);
          }
        }}
      >
        <DialogContent
          ref={dialogRef}
          initialFocus={titleRef}
          className={`f-dialog f-panel f-panel-${panel}`}
        >
          <DialogHeader>
            <span className="f-eyebrow">NOVA · YOUR COMMUNITY</span>
            <DialogTitle ref={titleRef} tabIndex={-1}>
              {
                (
                  {
                    build: 'Make room for life',
                    people: resident
                      ? profile(resident.id).name
                      : 'Your neighbors',
                    civic: 'The citizen hour',
                    report: 'How is life here?',
                    journal: 'A city with a story',
                    chat: `Talking with ${fullName(speaker)}`,
                    settings: 'Your NOVA',
                    place: place ? spec(place).name : 'Choose a place',
                    design: 'Your idea, taking shape',
                  } as Record<string, string>
                )[panel || 'settings']
              }
            </DialogTitle>
            <DialogDescription>
              {
                (
                  {
                    build:
                      'Choose a starting point or describe your own. Everything is available from the beginning.',
                    people: resident
                      ? 'A person with their own rhythm, choices and relationships.'
                      : 'Watch what people choose. Their lives do not wait for an instruction.',
                    civic:
                      'Listen, make a decision, then return to see what changed.',
                    report:
                      'Averages tell part of the story. Look at the people behind them.',
                    journal:
                      'Arrivals, resident initiatives and agreements that changed your city.',
                    chat: 'Speak freely or type. Conversations remember what actually happened.',
                    settings:
                      'Your city is saved in this browser. Your older city has its own separate save.',
                    place: 'Shape its programme and watch how people respond.',
                    design:
                      'A preview of real geometry. Nothing is built until you choose to place it.',
                  } as Record<string, string>
                )[panel || 'settings']
              }
            </DialogDescription>
          </DialogHeader>
          {panel === 'build' && (
            <>
              <form
                className="f-idea"
                onSubmit={(e) => {
                  e.preventDefault();
                  const parsed = parsePlace(idea);
                  if (
                    parsed &&
                    !/\b(round|circular|dome|octagon|terrace|facade|geometr)/i.test(
                      idea,
                    )
                  ) {
                    setTool(parsed);
                    setPanel(null);
                    say(
                      `Let’s make ${parsed.name.toLowerCase()}. Choose an empty plot, or use Place nearby.`,
                    );
                  } else {
                    void submit('Design ' + idea);
                  }
                }}
              >
                <label htmlFor="place-idea">What would you like to make?</label>
                <div>
                  <input
                    id="place-idea"
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="A pool that becomes a disco after 18"
                    maxLength={500}
                  />
                  <button
                    disabled={!idea.trim()}
                    aria-label="Use my place idea"
                  >
                    <ArrowUpRight size={19} />
                  </button>
                </div>
                <small>
                  Combine places, art, dancing and quiet hours. For a new shape,
                  say “Design a round pavilion”.
                </small>
              </form>
              <details className="f-home-studio">
                <summary>
                  Invent your own homes{' '}
                  <span>Size, privacy and shared life</span>
                </summary>
                <p>
                  These are your choices, not fixed building tiers. The shape
                  adapts to the number of residents. More private space has a
                  larger ecological footprint.
                </p>
                <form
                  className="f-housing-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fields = new FormData(e.currentTarget);
                    const residents = Math.max(
                      1,
                      Math.min(200, Number(fields.get('capacity'))),
                    );
                    const privacy = Number(fields.get('privacy')),
                      quiet = Number(fields.get('quiet'));
                    const q: PlaceSpec = {
                      ...structuredClone(HOME_STARTS.customhome),
                      name: (
                        (fields.get('name') as string) || 'Our kind of home'
                      )
                        .trim()
                        .slice(0, 100),
                      capacity: residents,
                      privacy,
                      quiet,
                      footprint: Math.min(
                        20,
                        Math.ceil(residents / 16 + privacy / 35),
                      ),
                      description:
                        'A home shaped by the mayor: room for ' +
                        residents +
                        ' people, with ' +
                        (privacy >= 70
                          ? 'more private space'
                          : 'closer shared living') +
                        '.',
                    };
                    setTool(q);
                    setPanel(null);
                    setNotice(
                      'Your housing idea is ready. Choose land or Place nearby.',
                    );
                  }}
                >
                  <label>
                    A name for your place
                    <input
                      name="name"
                      defaultValue="Our courtyard homes"
                      maxLength={100}
                      required
                    />
                  </label>
                  <label>
                    Room for people
                    <input
                      name="capacity"
                      type="number"
                      min={1}
                      max={200}
                      defaultValue={24}
                      required
                    />
                  </label>
                  <label>
                    Private space
                    <select name="privacy" defaultValue="65">
                      <option value="30">Mostly shared</option>
                      <option value="65">A balance</option>
                      <option value="90">Individual retreats</option>
                    </select>
                  </label>
                  <label>
                    Setting
                    <select name="quiet" defaultValue="65">
                      <option value="40">A lively cluster</option>
                      <option value="65">A sheltered courtyard</option>
                      <option value="90">Trees and quiet corners</option>
                    </select>
                  </label>
                  <button className="f-primary" type="submit">
                    Place my housing idea <ArrowUpRight size={17} />
                  </button>
                </form>
              </details>
              <p className="f-muted">
                A few starting ideas — each place can evolve.
              </p>
              <div className="f-catalog">
                {Object.values(PLACES).map((p) => (
                  <button
                    key={p.form}
                    className={`f-place-option ${p.capacity ? 'housing' : ''}`}
                    onClick={() => {
                      setTool(structuredClone(p));
                      setPanel(null);
                      setNotice('Choose an empty plot, or use Place nearby.');
                    }}
                  >
                    <span className={`f-place-icon ${p.form}`}>
                      {p.capacity ? (
                        <Home size={23} />
                      ) : p.form === 'garden' || p.form === 'wetland' ? (
                        <Trees size={23} />
                      ) : (
                        <Sparkles size={23} />
                      )}
                    </span>
                    <strong>{p.name}</strong>
                    <p>{p.description}</p>
                    <small>
                      {p.capacity
                        ? `${p.capacity} residents · ${p.privacy >= 70 ? 'more privacy' : 'shared living'}`
                        : p.programs
                            .map((p) => ACTIVITY[p.activity])
                            .join(' · ')}
                      <Plus size={15} />
                    </small>
                  </button>
                ))}
              </div>
            </>
          )}
          {panel === 'place' && place && (
            <>
              <div className="f-place-summary">
                <span className="f-pill">
                  {spec(place).capacity
                    ? `${spec(place).capacity} places to live`
                    : 'Shared place'}
                </span>
                <p>{spec(place).description}</p>
                <small>
                  Privacy {spec(place).privacy} · Quiet {spec(place).quiet} ·
                  Plot {place.x}, {place.y}
                </small>
              </div>
              {spec(place).capacity > 0 && (
                <form
                  className="f-housing-form"
                  key={tileKey(place)}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fields = new FormData(e.currentTarget),
                      q = structuredClone(spec(place));
                    q.name = (fields.get('name') as string)
                      .trim()
                      .slice(0, 100);
                    q.capacity = Math.max(
                      1,
                      Math.min(200, Number(fields.get('capacity'))),
                    );
                    q.privacy = Number(fields.get('privacy'));
                    q.footprint = Math.min(
                      20,
                      Math.ceil(q.capacity / 16 + q.privacy / 35),
                    );
                    if (
                      capacity(state) - spec(place).capacity + q.capacity <
                      state.population
                    ) {
                      setNotice(
                        'Keep enough homes for the people already living here.',
                      );
                      return;
                    }
                    commit({
                      ...state,
                      tiles: state.tiles.map((t) =>
                        t === place ? { ...t, place: q } : t,
                      ),
                    });
                    setNotice(
                      'Your housing choices are updated. Residents will respond as time passes.',
                    );
                  }}
                >
                  <label>
                    Place name
                    <input
                      name="name"
                      defaultValue={spec(place).name}
                      maxLength={100}
                      required
                    />
                  </label>
                  <label>
                    Room for people
                    <input
                      name="capacity"
                      type="number"
                      min={1}
                      max={200}
                      defaultValue={spec(place).capacity}
                      required
                    />
                  </label>
                  <label>
                    Private space
                    <select
                      name="privacy"
                      defaultValue={String(spec(place).privacy)}
                    >
                      {[...new Set([30, 65, 90, spec(place).privacy])]
                        .sort((a, b) => a - b)
                        .map((n) => (
                          <option key={n} value={n}>
                            {n} / 100
                          </option>
                        ))}
                    </select>
                  </label>
                  <button className="f-secondary" type="submit">
                    Adapt these homes
                  </button>
                </form>
              )}
              <h3>What happens here</h3>
              <div className="f-programs">
                {spec(place).programs.map((p, i) => (
                  <div key={`${p.activity}-${i}`}>
                    <span>{ACTIVITY[p.activity]}</span>
                    <strong>
                      {String(p.start).padStart(2, '0')}:00–{p.end}:00
                    </strong>
                  </div>
                ))}
              </div>
              <div className="f-shortcuts">
                <button onClick={() => schedule('dance', 18, 24)}>
                  Disco after 18:00
                </button>
                <button onClick={() => schedule('create', 18, 22)}>
                  Artists in the evening
                </button>
                <button
                  onClick={() => {
                    const q = changeProgram(spec(place), 'make it quiet');
                    commit({
                      ...state,
                      tiles: state.tiles.map((t) =>
                        t === place ? { ...t, place: q } : t,
                      ),
                    });
                  }}
                >
                  Make room for quiet
                </button>
              </div>
              <form
                className="f-program-editor"
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  schedule(
                    data.get('activity') as Activity,
                    Number(data.get('start')),
                    Number(data.get('end')),
                  );
                }}
              >
                <label>
                  Activity
                  <select name="activity">
                    {Object.entries(ACTIVITY)
                      .filter(([a]) => a !== 'rest')
                      .map(([a, label]) => (
                        <option key={a} value={a}>
                          {label}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  From
                  <select name="start" defaultValue="8">
                    {[6, 8, 12, 14, 18, 20].map((h) => (
                      <option key={h} value={h}>
                        {h}:00
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Until
                  <select name="end" defaultValue="24">
                    {[12, 18, 20, 22, 24].map((h) => (
                      <option key={h} value={h}>
                        {h}:00
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit">Set programme</button>
              </form>
              <button
                className="f-secondary"
                onClick={() => {
                  setPanel(null);
                  go(tileKey(place));
                }}
              >
                Watch this place <MapPin size={16} />
              </button>
              <button
                className="f-text-button"
                onClick={() => {
                  setPanel('chat');
                  setSpeaker('aura');
                  setInput('Redesign this place with rounded terraces');
                }}
              >
                Describe a different shape
              </button>
              <button
                className="f-danger"
                onClick={() => {
                  const r = removePlace(state, tileKey(place));
                  if (r.state !== state) {
                    setUndone((u) => [...u.slice(-9), state.tiles]);
                    commit(r.state);
                    setPanel(null);
                    setSelected(null);
                  }
                  setNotice(r.text);
                }}
              >
                Return this place to nature
              </button>
            </>
          )}
          {panel === 'people' &&
            (resident && life ? (
              <>
                <div className="f-person-heading">
                  <span style={{ background: profile(resident.id).color }}>
                    {profile(resident.id).initials}
                  </span>
                  <div>
                    <strong>{profile(resident.id).trait}</strong>
                    <small>
                      Prefers{' '}
                      {life.housing === 'nature'
                        ? 'life close to nature'
                        : life.housing === 'privacy'
                          ? 'space and privacy'
                          : 'close neighbors'}{' '}
                      · {life.quiet ? 'enjoys quiet' : 'enjoys lively places'}
                    </small>
                  </div>
                </div>
                <blockquote>“{life.reason}”</blockquote>
                <div className="f-person-meters">
                  <Meter label="Belonging" value={life.belonging} />
                  <Meter label="Comfort" value={life.comfort} />
                  <Meter label="Self-direction" value={life.autonomy} />
                </div>
                <h3>A dream of my own</h3>
                <Meter label="Personal project" value={resident.progress} />
                <p>{resident.ai?.wish || profile(resident.id).wish}</p>
                <p className="f-muted">
                  {life.friends.length} familiar neighbors ·{' '}
                  {ACTIVITY[life.activity]} · {life.visits} shared encounters
                </p>
                <button
                  className="f-primary"
                  onClick={() => {
                    setSpeaker(resident.id);
                    setPanel('chat');
                    say(life.reason, resident.id);
                  }}
                >
                  Talk with {profile(resident.id).name.split(' ')[0]}{' '}
                  <Mic size={17} />
                </button>
                <button
                  className="f-secondary"
                  onClick={() => {
                    go(life.target);
                    setPanel(null);
                    setPerson(null);
                  }}
                >
                  See where I am <MapPin size={17} />
                </button>
                {resident.memories.length > 0 && (
                  <>
                    <h3>What I remember</h3>
                    {resident.memories.map((m, i) => (
                      <p className="f-memory" key={i}>
                        {m}
                      </p>
                    ))}
                  </>
                )}
              </>
            ) : (
              <>
                <input
                  className="f-search"
                  aria-label="Find a resident"
                  placeholder="Find a neighbor…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {!state.population && (
                  <div className="f-empty">
                    <Users size={34} />
                    <h3>Your first neighbors are on their way.</h3>
                    <p>
                      Create somewhere to live, then let time pass. The first
                      eight people will arrive.
                    </p>
                    <button onClick={() => open('build')}>Create homes</button>
                  </div>
                )}
                <div className="f-people-list">
                  {state.people
                    .filter((p) =>
                      profile(p.id)
                        .name.toLowerCase()
                        .includes(search.toLowerCase()),
                    )
                    .map((p) => {
                      const l = c.lives[p.id];
                      return (
                        <button key={p.id} onClick={() => setPerson(p.id)}>
                          <span
                            className="f-avatar"
                            style={{ background: profile(p.id).color }}
                          >
                            {profile(p.id).initials}
                          </span>
                          <div>
                            <strong>{profile(p.id).name}</strong>
                            <small>
                              {ACTIVITY[l.activity]} · {satisfaction(l)}%
                              content
                            </small>
                            <p>{l.reason}</p>
                          </div>
                          <ChevronRight size={16} />
                        </button>
                      );
                    })}
                </div>
                <h3>Resident circles</h3>
                {!c.groups.length ? (
                  <p>
                    Circles grow from shared interests and repeated encounters.
                    Give people places and time to find each other.
                  </p>
                ) : (
                  c.groups.map((g) => (
                    <div className="f-circle" key={g.id}>
                      <span className="f-eyebrow">
                        RESIDENT-LED · {g.members.length} MEMBERS
                      </span>
                      <h3>{g.name}</h3>
                      <p>
                        Started by {profile(g.founder).name}. {g.meetings}{' '}
                        meetings so far.
                      </p>
                      <button
                        onClick={() => {
                          go(g.venue);
                          setPanel(null);
                        }}
                      >
                        Visit their meeting place <ArrowUpRight size={15} />
                      </button>
                    </div>
                  ))
                )}
              </>
            ))}
          {panel === 'report' && (
            <>
              <div className="f-report-summary">
                <div>
                  <strong>{state.population}</strong>
                  <span>people · {capacity(state)} places to live in total</span>
                </div>
                <div>
                  <strong>{c.groups.length}</strong>
                  <span>resident-led circles</span>
                </div>
              </div>
              <div className="f-report-meters">
                <Meter
                  label="Belonging"
                  value={state.stats.connection}
                  color="#c3966d"
                />
                <Meter
                  label="Self-direction"
                  value={state.stats.freedom}
                  color="#789eb7"
                />
                <Meter label="Comfort" value={averageComfort} color="#a495b5" />
                <Meter label="Nature" value={state.stats.nature} />
              </div>
              <h3>Where your attention helps</h3>
              {concerns(state).map((issue) => (
                <article className="f-concern" key={issue.title}>
                  <h4>{issue.title}</h4>
                  <p>{issue.text}</p>
                  {issue.person !== undefined ? (
                    <button onClick={() => visitPerson(issue.person!)}>
                      Hear {profile(issue.person).name.split(' ')[0]}{' '}
                      <ArrowUpRight size={15} />
                    </button>
                  ) : (
                    <button onClick={() => open('build')}>
                      {issue.action} <ArrowUpRight size={15} />
                    </button>
                  )}
                </article>
              ))}
              <h3>Different homes, different experiences</h3>
              {(['community', 'privacy', 'nature'] as const).map(
                (preference) => {
                  const lives = c.lives.filter((l) => l.housing === preference);
                  return (
                    <div className="f-cohort" key={preference}>
                      <span>
                        {preference === 'community'
                          ? 'Close neighbors'
                          : preference === 'privacy'
                            ? 'Space & privacy'
                            : 'Life near nature'}
                        <small>{lives.length} residents</small>
                      </span>
                      <strong>
                        {lives.length
                          ? Math.round(
                              lives.reduce((n, l) => n + satisfaction(l), 0) /
                                lives.length,
                            ) + '%'
                          : '—'}
                      </strong>
                    </div>
                  );
                },
              )}
              <h3>Life over time</h3>
              {c.history.length < 2 ? (
                <p>
                  Daily observations appear here as your community lives through
                  its first days.
                </p>
              ) : (
                <>
                  <span className="f-muted">
                    Belonging · last {c.history.length} observations
                  </span>
                  <Trend
                    points={c.history.map((h) => h.belonging)}
                    color="#bd946b"
                  />
                  <span className="f-muted">Nature</span>
                  <Trend
                    points={c.history.map((h) => h.nature)}
                    color="#7e9e6b"
                  />
                </>
              )}
              <h3>Abundance has a landscape</h3>
              <Meter
                label="Water-cycle health"
                value={waterQuality(state)}
                color="#7bacb0"
              />
              <p>
                Homes reclaim water automatically. Above 24 people, living water
                gardens help restore the wider ecosystem; each supports another
                80 residents.
              </p>
              <div className="f-level-list">
                {LEVELS.map((l, i) => (
                  <div key={l.name} className={i <= c.level ? 'reached' : ''}>
                    <span>{i + 1}</span>
                    <div>
                      <strong>{l.name}</strong>
                      <small>{l.reward}</small>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {panel === 'civic' && (
            <>
              <div className="f-civic-summary">
                <span className="f-eyebrow">
                  {state.population
                    ? `${state.population} VOICES · DAY ${state.day}`
                    : 'FIRST, WELCOME YOUR NEIGHBORS'}
                </span>
                <h3>
                  {c.clock >= c.reviewAt
                    ? 'It is time to listen again.'
                    : 'A city’s rules begin with its people.'}
                </h3>
                <p>
                  People may disagree without becoming enemies. Choose a
                  process, hear the concerns and make an agreement you can
                  revisit.
                </p>
              </div>
              {concerns(state)
                .slice(0, 2)
                .map((issue) => (
                  <blockquote key={issue.title}>
                    {issue.title}. {issue.text}
                  </blockquote>
                ))}
              <h3>Who decides?</h3>
              <div className="f-governments">
                {(['mayor', 'assembly', 'circles'] as const).map((g) => (
                  <button
                    key={g}
                    aria-pressed={c.government === g}
                    onClick={() => commit(setGovernment(state, g))}
                  >
                    <strong>
                      {g === 'mayor'
                        ? 'Mayor’s decision'
                        : g === 'assembly'
                          ? 'Citizens’ assembly'
                          : 'Resident circles'}
                    </strong>
                    <span>
                      {g === 'mayor'
                        ? 'Act directly, explain your choice, hear objections.'
                        : g === 'assembly'
                          ? 'Every resident votes from their own preferences.'
                          : 'Delegate a reversible trial to resident groups.'}
                    </span>
                  </button>
                ))}
              </div>
              <h3>An agreement to try</h3>
              {c.reviews > 0 && c.clock < c.reviewAt && (
                <p className="f-muted">
                  Let this agreement run. The next decision opens on day{' '}
                  {Math.floor(c.reviewAt / 24) + 1}. You can still listen and
                  change places.
                </p>
              )}
              <div className="f-policy-list">
                {POLICIES.map((p) => (
                  <button
                    key={p.id}
                    disabled={
                      !state.population ||
                      thinking ||
                      (c.reviews > 0 && c.clock < c.reviewAt)
                    }
                    onClick={() => {
                      const next = civicDecision(state, p.id);
                      commit(next);
                      say(next.community!.events[0].text);
                      setPanel(null);
                    }}
                  >
                    <strong>{p.title}</strong>
                    <span>{p.text}</span>
                    <small>
                      {c.government === 'assembly'
                        ? 'Put it to a vote'
                        : 'Begin this agreement'}{' '}
                      <ArrowUpRight size={15} />
                    </small>
                  </button>
                ))}
              </div>
              <h3>Your emerging charter</h3>
              {c.rules.length ? (
                c.rules.map((r, i) => (
                  <p className="f-memory" key={i}>
                    Day {r.day} · {r.text}
                  </p>
                ))
              ) : (
                <p>
                  No rules have been agreed yet. Your first decision becomes the
                  first entry.
                </p>
              )}
            </>
          )}
          {panel === 'journal' && (
            <>
              {c.events.length ? (
                c.events.map((e) => (
                  <article className={`f-journal-event ${e.tone}`} key={e.id}>
                    <span className="f-eyebrow">
                      DAY {Math.floor(e.time / 24) + 1} ·{' '}
                      {e.tone === 'good'
                        ? 'A MOMENT TO KEEP'
                        : e.tone === 'concern'
                          ? 'A VOICE TO HEAR'
                          : 'CITY LIFE'}
                    </span>
                    <h3>{e.title}</h3>
                    <p>{e.text}</p>
                    {e.person !== undefined && (
                      <button onClick={() => visitPerson(e.person!)}>
                        Talk with {profile(e.person).name.split(' ')[0]}
                      </button>
                    )}
                    {e.place !== undefined && (
                      <button
                        onClick={() => {
                          go(e.place!);
                          setPanel(null);
                        }}
                      >
                        Visit the place
                      </button>
                    )}
                  </article>
                ))
              ) : (
                <div className="f-empty">
                  <BookOpen size={32} />
                  <h3>Your first page is unwritten.</h3>
                  <p>Build a home, welcome people and let life begin.</p>
                </div>
              )}
            </>
          )}
          {panel === 'chat' && (
            <>
              <label className="f-speaker-label">
                Who are you talking with?
                <select
                  value={speaker}
                  onChange={(e) =>
                    setSpeaker(
                      e.target.value === 'aura'
                        ? 'aura'
                        : Number(e.target.value),
                    )
                  }
                >
                  <option value="aura">AURA · city intelligence</option>
                  {state.people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {profile(p.id).name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="f-conversation" ref={messageRef}>
                {messages.map((m, i) => (
                  <article className={m.speaker === 'you' ? 'you' : ''} key={i}>
                    <strong>{fullName(m.speaker)}</strong>
                    <p>{m.text}</p>
                  </article>
                ))}
              </div>
              <form
                className="f-chat-input"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit(input);
                }}
              >
                <input
                  aria-label="Message"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    speaker === 'aura'
                      ? 'Describe a place or ask about your city…'
                      : 'What have you been doing today?'
                  }
                  maxLength={600}
                />
                <button
                  disabled={thinking || !input.trim()}
                  aria-label="Send message"
                >
                  <Send size={19} />
                </button>
              </form>
            </>
          )}
          {panel === 'design' && (
            <>
              {state.designProposal ? (
                <>
                  <DesignPreview design={state.designProposal.blueprint} />
                  <h3>{state.designProposal.blueprint.name}</h3>
                  <p>{state.designProposal.blueprint.description}</p>
                  <button className="f-primary" onClick={applyDesign}>
                    Build this design <Plus size={17} />
                  </button>
                  <button
                    className="f-secondary"
                    onClick={() => {
                      commit({ ...state, designProposal: undefined });
                      setPanel(null);
                    }}
                  >
                    Set it aside
                  </button>
                </>
              ) : (
                <p>
                  Tell AURA what you imagine. Your design will appear here
                  before you build it.
                </p>
              )}
              <form
                className="f-chat-input"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit(input);
                }}
              >
                <input
                  aria-label="Describe a design"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Make it lower, rounder and green…"
                />
                <button
                  disabled={thinking || !input.trim()}
                  aria-label="Send design instruction"
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
          {panel === 'settings' && (
            <>
              <div className="f-role">
                <strong>You are NOVA’s founding mayor.</strong>
                <p>
                  Build a home, welcome people, create places and listen. Life
                  develops as time passes. Time pauses while you read, talk or
                  make a decision.
                </p>
              </div>
              <h3>Your city, on this device</h3>
              <p>
                {saveError ||
                  'Saved automatically in this browser. No account synchronization yet.'}
              </p>
              <button className="f-secondary" onClick={exportSave}>
                Export a copy of my city
              </button>
              <label className="f-secondary">
                Import a saved community
                <input
                  type="file"
                  accept=".json,application/json"
                  aria-label="Import a saved community"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    try {
                      if (file.size > 2000000) throw new Error();
                      const data: unknown = JSON.parse(await file.text());
                      if (!validSave(data) || !data.community)
                        throw new Error();
                      localStorage.setItem(
                        BACKUP,
                        JSON.stringify(stateRef.current),
                      );
                      commit(data);
                      setSaveError('');
                      setUndone([]);
                      setPerson(null);
                      setSelected(null);
                      setPanel(null);
                      setNotice(
                        'Community imported. The previous community is kept as a backup.',
                      );
                    } catch {
                      setNotice(
                        'Could not import this file. Your current community is unchanged.',
                      );
                    }
                  }}
                />
              </label>
              <button
                className="f-secondary"
                onClick={() => {
                  try {
                    const data: unknown = JSON.parse(
                      localStorage.getItem(BACKUP) || 'null',
                    );
                    if (!validSave(data) || !data.community) {
                      setNotice('No valid backup is available on this device.');
                      return;
                    }
                    localStorage.setItem(
                      BACKUP,
                      JSON.stringify(stateRef.current),
                    );
                    commit(data);
                    setSaveError('');
                    setUndone([]);
                    setPerson(null);
                    setSelected(null);
                    setPanel(null);
                    setNotice(
                      'Backup restored. You can swap back using the same control.',
                    );
                  } catch {
                    setNotice(
                      'Could not restore the backup. Your community is unchanged.',
                    );
                  }
                }}
              >
                Restore previous community backup
              </button>
              <button className="f-secondary" onClick={() => setNight(null)}>
                Follow the day and night cycle
              </button>
              <h3>World detail</h3>
              <div className="f-shortcuts">
                <button
                  aria-pressed={quality === 'low'}
                  onClick={() => setQuality('low')}
                >
                  Balanced · phone friendly
                </button>
                <button
                  aria-pressed={quality === 'high'}
                  onClick={() => setQuality('high')}
                >
                  Detailed · soft shadows
                </button>
              </div>
              <h3>Voice & ideas</h3>
              <p>
                {aiReady
                  ? 'Live AI conversations are connected.'
                  : 'The local simulation works without an AI connection.'}{' '}
                Everyday resident decisions and group formation run locally.
                Only your conversations and design requests use the AI server.
              </p>
              <p>
                Try “Build a campsite”, “Create a pool with a disco after 18”,
                “Talk to Mira”, “Show the report” or “Pause”. A named place’s
                programme is a set of real activities, not a promise that any
                imaginable action can already be simulated.
              </p>
              <h3>Keep exploring</h3>
              <button className="f-secondary" onClick={() => open('journal')}>
                Read the city’s story <BookOpen size={17} />
              </button>
              {hasPrevious && (
                <button className="f-secondary" onClick={onLegacy}>
                  Open my previous NOVA city
                </button>
              )}
              <button className="f-danger" onClick={() => setReset(true)}>
                Begin a different community
              </button>
              {reset && (
                <div className="f-reset">
                  <p>
                    This replaces this community on this device. Export it first
                    if you want to keep a portable copy. Your previous NOVA city
                    is separate.
                  </p>
                  <button
                    onClick={() => {
                      try {
                        localStorage.setItem(BACKUP, JSON.stringify(state));
                      } catch {
                        setNotice(
                          'Could not save a backup. Export this city before starting again.',
                        );
                        return;
                      }
                      setSaveError('');
                      commit(foundingState());
                      setReset(false);
                      setPanel(null);
                      setPerson(null);
                      setPaused(false);
                      setUndone([]);
                      setSelected(null);
                      setMessages([{ speaker: 'aura', text: welcome, day: 1 }]);
                    }}
                  >
                    Keep a backup and start again
                  </button>
                  <button onClick={() => setReset(false)}>
                    Keep this community
                  </button>
                </div>
              )}
            </>
          )}
          <button
            className="f-back-city"
            onClick={() => {
              setPanel(null);
              setPerson(null);
            }}
          >
            Back to the city <ArrowUpRight size={16} />
          </button>
          <div className="f-panel-voice">
            <button
              onClick={voice.listen}
              disabled={thinking || voice.transcribing}
            >
              <Mic size={17} />
              {voice.listening ? 'Finish speaking' : 'Say it instead'}
            </button>
            <span aria-live="polite">
              {voice.error ||
                (thinking
                  ? 'Thinking…'
                  : voice.listening
                    ? voice.interim || 'Listening…'
                    : voice.transcribing
                      ? 'Transcribing…'
                      : 'Voice, text and touch share the same city.')}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
