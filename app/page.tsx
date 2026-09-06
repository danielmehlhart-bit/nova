'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  Infinity as InfinityIcon,
  Sparkles,
  Square,
  Users,
  Leaf,
  Plus,
  Minus,
  MousePointer2,
  Trees,
  Building2,
  Palette,
  Orbit,
  Waves,
  Archive,
  Moon,
  Sun,
  Grid2X2,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Undo2,
  Eraser,
  X,
  ArrowUpRight,
  MessageCircle,
  CircleHelp,
  Check,
  ChevronDown,
  Keyboard,
  Menu,
  RotateCcw,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import CityCanvas from './CityCanvas';
import DesignPreview from './DesignPreview';
import JourneyPanel from './JourneyPanel';
import {
  chapterOf,
  journeyOf,
  pathOf,
  journeyAction,
  journeyPrompt,
  journeyCommand,
  reconcileJourney,
  type JourneyAction,
} from './journey';
import { buildDesign, designIntent } from './design-actions';
import {
  initialState,
  BUILDINGS,
  KEYS,
  METRICS,
  place,
  harmony,
  tick,
  pendingEvent,
  EVENTS,
  decide,
  milestones,
  validSave,
  counts,
  isLand,
  type Kind,
  type State,
  type Tile,
} from './simulation';
import { activity, feeling, profile } from './citizens';
import { converse, autoBuild, type Speaker } from './conversation';
import { useVoice } from './useVoice';
import { contextFor, residentProfile, validAIReply } from './ai-contract';
import { applyAIReply } from './ai-actions';
const icons = {
  home: Building2,
  garden: Leaf,
  agora: Users,
  atelier: Palette,
  observatory: Orbit,
  wild: Trees,
  dream: Waves,
  archive: Archive,
  core: Sparkles,
};
type Modal =
  | 'journey'
  | 'moments'
  | 'design'
  | 'people'
  | 'council'
  | 'story'
  | 'history'
  | 'stats'
  | 'victory'
  | null;
type Message = { speaker: Speaker | 'you'; text: string; day: number };
const SAVE = 'nova-after-work-v1';
function appendConversation(message: Message) {
  return (messages: Message[]) => [...messages.slice(-29), message];
}
export default function Home() {
  const [aiReady, setAiReady] = useState(false),
    [thinking, setThinking] = useState(false),
    [aiError, setAiError] = useState(''),
    [designReply, setDesignReply] = useState('');
  const aiBusy = useRef(false),
    aiAbort = useRef<AbortController | null>(null);
  const [state, setState] = useState(initialState),
    [ready, setReady] = useState(false),
    [tool, setTool] = useState<Kind | 'inspect' | 'remove'>('inspect'),
    [zoom, setZoom] = useState(1),
    [night, setNight] = useState(false),
    [grid, setGrid] = useState(false),
    [paused, setPaused] = useState(false),
    [speed, setSpeed] = useState(1),
    [modal, setModal] = useState<Modal>(null),
    [resetOpen, setResetOpen] = useState(false),
    [showBuild, setShowBuild] = useState(false),
    [mobileWriting, setMobileWriting] = useState(false),
    [mobileMenu, setMobileMenu] = useState(false),
    [speaker, setSpeaker] = useState<Speaker>('aura'),
    [input, setInput] = useState(''),
    [search, setSearch] = useState(''),
    [seenMoment, setSeenMoment] = useState(''),
    [storyCamera, setStoryCamera] = useState(false),
    [focusTile, setFocusTile] = useState<{ x: number; y: number } | null>(null),
    [message, setMessage] = useState(''),
    [saveStatus, setSaveStatus] = useState('Saved on this device'),
    [messages, setMessages] = useState<Message[]>([
      {
        speaker: 'aura',
        text: 'Welcome, Mayor. I provide the essentials; you make room for shared life. Mira has a little unfinished song and an invitation for you. Tap Meet Mira, or say “What should I do first?”',
        day: 1,
      },
    ]);
  const stateRef = useRef(state),
    speakerRef = useRef(speaker),
    topicRef = useRef(''),
    undoRef = useRef<Tile[][]>([]),
    inputRef = useRef<HTMLInputElement>(null),
    historyRef = useRef<HTMLDivElement>(null),
    journeyTitleRef = useRef<HTMLHeadingElement>(null),
    dialogRef = useRef<HTMLDivElement>(null),
    submitRef = useRef<(t: string) => Promise<void>>(() => Promise.resolve());
  useEffect(() => {
    stateRef.current = state;
    speakerRef.current = speaker;
  }, [state, speaker]);
  const voice = useVoice((t) => {
    void submitRef.current(t);
  }, aiReady);
  useEffect(() => {
    const abort = new AbortController();
    fetch('/api/ai', { signal: abort.signal })
      .then((r) => r.json())
      .then((d) =>
        setAiReady(
          !!d && typeof d === 'object' && 'enabled' in d && d.enabled === true,
        ),
      )
      .catch(() => {});
    return () => {
      abort.abort();
      aiAbort.current?.abort();
    };
  }, []);
  const journey = journeyOf(state),
    chapter = chapterOf(state),
    invitation = journeyPrompt(state);
  useEffect(() => {
    if (modal !== 'journey') return;
    journeyTitleRef.current?.focus({ preventScroll: true });
    if (dialogRef.current) dialogRef.current.scrollTop = 0;
  }, [modal, journey.chapter, journey.phase]);
  const guidingFirst = journey.chapter === 0 && !journey.freePlay;
  const event = guidingFirst ? -1 : pendingEvent(state),
    selected = state.tiles.find(
      (t) => t.x === focusTile?.x && t.y === focusTile?.y,
    ),
    goals = milestones(state),
    latest = messages[messages.length - 1];
  const commit = useCallback((s: State) => {
    s = reconcileJourney(stateRef.current, s);
    const completed = !s.won && milestones(s).every((g) => g.progress >= 1);
    const next = completed ? { ...s, won: true } : s;
    stateRef.current = next;
    setState(next);
    if (completed) setModal('victory');
  }, []);
  const pushUndo = (s: State) => {
    undoRef.current = [
      ...undoRef.current.slice(-19),
      s.tiles.map((t) => ({ ...t })),
    ];
  };
  const announce = (text: string, who: Speaker = 'aura', speak = false) => {
    setMessages((m) => [
      ...m.slice(-29),
      { speaker: who, text, day: stateRef.current.day },
    ]);
    if (speak) voice.say(text, who);
  };
  const undo = () => {
    setAiError('');
    const tiles = undoRef.current.at(-1);
    if (!tiles) {
      setMessage('There is no building change to undo yet.');
      return 'There is no building change to undo yet.';
    }
    if (
      tiles.filter((t) => t.kind === 'home').length * 48 <
      stateRef.current.population
    ) {
      setMessage(
        'People have already moved in. Create spare homes before undoing this change.',
      );
      return 'People have already moved in. Create spare homes before undoing this change.';
    }
    undoRef.current.pop();
    commit({ ...stateRef.current, tiles });
    setFocusTile(null);
    setMessage('The last building change has been undone.');
    return 'The last building change has been undone.';
  };
  const acceptDesign = () => {
    if (aiBusy.current) return;
    const before = stateRef.current;
    const result = buildDesign(before);
    if (result.tile) {
      pushUndo(before);
      commit(result.state);
      setFocusTile(result.tile);
      setTool('inspect');
      setModal(null);
    }
    setMessage(result.text);
    announce(result.text, 'aura', true);
  };
  const openJourney = () => {
    setShowBuild(false);
    setMobileMenu(false);
    setModal('journey');
  };
  const actJourney = (action: JourneyAction) => {
    if (aiBusy.current) return;
    const before = stateRef.current;
    const next = journeyAction(before, action, selected);
    if (next === before) {
      setMessage('Choose a matching place before starting the gathering.');
      return;
    }
    commit(next);
    const j = journeyOf(next),
      c = chapterOf(next);
    if (action === 'explore') {
      setModal(null);
      return;
    }
    setShowBuild(false);
    setMobileMenu(false);
    setTool('inspect');
    if (j.venue) {
      setFocusTile(j.venue);
      setStoryCamera(true);
    }
    setModal(action === 'use' || action === 'host' ? null : 'journey');
    if (action === 'host')
      setMessage('A gathering begins. Your city has a new memory.');
    const reply =
      action === 'host' && c
        ? c.outcomes[j.agreement ?? 0] + ' ' + c.thanks
        : journeyPrompt(next).text;
    setSpeaker('aura');
    speakerRef.current = 'aura';
    announce(reply, 'aura', true);
  };
  const buildForJourney = () => {
    if (aiBusy.current) return;
    const before = stateRef.current,
      path = pathOf(before);
    if (!path || journeyOf(before).phase !== 'place') return;
    const result = autoBuild(before, path.kind, 1);
    if (!result.built) {
      setMessage(
        'There is no open plot. Use an existing place or rewild an unused plot.',
      );
      return;
    }
    pushUndo(before);
    commit(result.state);
    setFocusTile(result.state.tiles.at(-1) || null);
    setStoryCamera(true);
    setTool('inspect');
    setShowBuild(false);
    setModal(null);
    setMessage('Your place is ready. Hear the neighbor to continue.');
    announce(
      'Your place is ready. Before the invitation goes out, another neighbor has a thought.',
      'aura',
      true,
    );
  };
  const submit = async (raw: string) => {
    if (aiBusy.current) return;
    const text = raw.trim().slice(0, 600);
    if (!text) return;
    voice.quiet();
    voice.clearError();
    setAiError('');
    const previous = stateRef.current;
    const storyCommand = journeyCommand(previous, text);
    if (storyCommand) {
      setInput('');
      if (storyCommand === 'open') {
        openJourney();
        announce(
          'You are NOVA’s mayor. ' + journeyPrompt(previous).text,
          'aura',
          true,
        );
      } else if (storyCommand === 'memories') {
        setSeenMoment(previous.moments?.[0]?.id || '');
        setModal('moments');
      } else if (storyCommand === 'build') buildForJourney();
      else actJourney(storyCommand);
      return;
    }
    if (
      (previous.designProposal &&
        /^(please )?(build|create|make) it[.!]?$/i.test(text)) ||
      /^(please )?(build|place|approve|accept|apply|create|make) (this |the |my )?(design|proposal|blueprint)( please)?[.!]?$/i.test(
        text,
      )
    ) {
      setInput('');
      acceptDesign();
      return;
    }
    if (
      /^(discard|cancel|reject) (this |the )?(design|proposal|blueprint)[.!]?$/i.test(
        text,
      )
    ) {
      commit({ ...previous, designProposal: undefined });
      setModal(null);
      setInput('');
      announce('The design has been set aside.', 'aura', true);
      return;
    }
    const custom = designIntent(text);
    const r = converse(previous, text, speakerRef.current, topicRef.current);
    if (custom && !r.action && !aiReady) {
      setInput('');
      announce(
        'Connect the AI server to design freely. The building palette is still available.',
        'aura',
        true,
      );
      return;
    }
    if (
      aiReady &&
      ((custom && !r.action) ||
        (!r.built &&
          !r.action &&
          r.state.decisions.length === previous.decisions.length))
    ) {
      aiBusy.current = true;
      setThinking(true);
      setAiError('');
      setInput('');
      setSpeaker(r.speaker);
      setMessages((m) => [
        ...m.slice(-29),
        { speaker: 'you', text, day: previous.day },
      ]);
      const abort = new AbortController();
      aiAbort.current = abort;
      const timer = setTimeout(() => abort.abort(), 30000);
      try {
        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            contextFor(previous, text, r.speaker, messages, focusTile),
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
              : 'The reply could not be understood. Please try again.',
          );
        const applied = applyAIReply(stateRef.current, r.speaker, data);
        if (applied.built) pushUndo(stateRef.current);
        commit(applied.state);
        if (custom || modal === 'design' || data.design)
          setDesignReply(applied.text);
        if (
          data.design &&
          applied.state.designProposal !== previous.designProposal
        )
          setModal('design');
        setMessages((m) => [
          ...m.slice(-29),
          { speaker: r.speaker, text: applied.text, day: stateRef.current.day },
        ]);
        if (applied.built) {
          setTool('inspect');
          setFocusTile(applied.state.tiles.at(-1) || null);
          setMessage('New possibilities materialized.');
        }
        voice.say(applied.text, r.speaker);
      } catch (e) {
        const reason =
          e instanceof Error && e.name === 'AbortError'
            ? 'The connection took too long. Please try again.'
            : e instanceof Error
              ? e.message
              : 'AI is temporarily unavailable.';
        setAiError(reason);
        setInput(text);
        if (custom || modal === 'design') setDesignReply(reason);
        const failureMessage: Message = {
          speaker: 'aura',
          text:
            reason +
            ' Your request is still in the input so you can edit it and try again.',
          day: stateRef.current.day,
        };
        setMessages(appendConversation(failureMessage));
      } finally {
        clearTimeout(timer);
        aiAbort.current = null;
        aiBusy.current = false;
        setThinking(false);
      }
      return;
    }
    if (r.built) pushUndo(previous);
    let response = r.text;
    if (r.action === 'undo') response = undo();
    else if (r.state !== previous) commit(r.state);
    if (r.action === 'pause') setPaused(true);
    if (r.action === 'resume') setPaused(false);
    if (r.action === 'fast') {
      setSpeed(3);
      setPaused(false);
    }
    if (r.action === 'night') setNight(true);
    if (r.action === 'day') setNight(false);
    if (r.action === 'help') setModal('story');
    if (r.action === 'people') setModal('people');
    if (r.action === 'council') setModal('council');
    if (r.state.decisions.length > previous.decisions.length) setModal(null);
    setSpeaker(r.speaker);
    topicRef.current = r.topic || '';
    setMessages((m) => [
      ...m.slice(-28),
      { speaker: 'you', text, day: previous.day },
      { speaker: r.speaker, text: response, day: previous.day },
    ]);
    setInput('');
    if (r.built) {
      setTool('inspect');
      setFocusTile(r.state.tiles.at(-1) || null);
      setMessage('New possibilities materialized.');
    }
    voice.say(response, r.speaker);
  };
  useEffect(() => {
    submitRef.current = submit;
  });
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setPaused(localStorage.getItem('nova-paused') === 'true');
        const raw = localStorage.getItem(SAVE);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (validSave(parsed)) {
            commit(parsed);
            setMessages([
              {
                speaker: 'aura',
                text: 'Welcome back. Your city has been waiting for you. The people you met still remember you.',
                day: parsed.day,
              },
            ]);
          } else setSaveStatus('Older save could not be loaded');
        }
      } catch {
        setSaveStatus('Storage unavailable · keep this tab open');
      }
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [commit]);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(SAVE, JSON.stringify(state));
        setSaveStatus('Saved on this device');
      } catch {
        setSaveStatus('Could not save · keep this tab open');
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [state, ready]);
  useEffect(() => {
    if (
      !ready ||
      paused ||
      modal ||
      resetOpen ||
      voice.listening ||
      thinking ||
      voice.transcribing ||
      event >= 0 ||
      (guidingFirst && journey.phase === 'invitation')
    )
      return;
    const timer = setInterval(() => {
      if (!document.hidden) commit(tick(stateRef.current));
    }, 3000 / speed);
    return () => clearInterval(timer);
  }, [
    ready,
    paused,
    speed,
    modal,
    resetOpen,
    event,
    guidingFirst,
    journey.phase,
    voice.listening,
    thinking,
    voice.transcribing,
    commit,
  ]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 5000);
    return () => clearTimeout(timer);
  }, [message]);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem('nova-paused', String(paused));
      } catch {
        /* Device storage may be unavailable. */
      }
    }
  }, [paused, ready]);
  useEffect(() => {
    if (modal !== 'history') return;
    const frame = requestAnimationFrame(() =>
      historyRef.current?.lastElementChild?.scrollIntoView({ block: 'end' }),
    );
    return () => cancelAnimationFrame(frame);
  }, [modal, messages.length]);
  const listen = voice.listen;
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        modal ||
        resetOpen ||
        (e.target instanceof HTMLElement &&
          (['INPUT', 'TEXTAREA', 'BUTTON'].includes(e.target.tagName) ||
            e.target.isContentEditable))
      )
        return;
      if (e.key === ' ') {
        e.preventDefault();
        setPaused((v) => !v);
      }
      if (e.key.toLowerCase() === 'v') {
        e.preventDefault();
        void listen();
      }
      if (e.key === 'Escape') {
        setTool('inspect');
        setFocusTile(null);
        setMobileWriting(false);
        setMobileMenu(false);
      }
      const n = Number(e.key);
      if (n >= 1 && n <= 8) {
        setTool(KEYS[n - 1]);
        setShowBuild(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modal, resetOpen, listen]);
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (t: unknown, o: { signal: AbortSignal }) => unknown;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: unknown) => {
      try {
        Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    };
    register({
      name: 'read_nova_city',
      title: 'Read NOVA city',
      description:
        'Read the current city, life measures, residents and pending council question.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: () => {
        const s = stateRef.current;
        return {
          day: s.day,
          population: s.population,
          stats: s.stats,
          buildings: counts(s),
          designProposal: s.designProposal || null,
          designedPlaces: s.tiles.filter((t) => t.design),
          pendingCouncil: pendingEvent(s) >= 0 ? EVENTS[pendingEvent(s)] : null,
          residents: s.people.slice(0, 6).map((p) => ({
            name: profile(p.id).name,
            dream: profile(p.id).wish,
            progress: p.progress,
          })),
        };
      },
    });
    register({
      name: 'give_nova_instruction',
      title: 'Give NOVA an instruction',
      description:
        'Execute an English game instruction, such as build two gardens, talk to Mira, or choose option one. Uses the same command system as voice and text.',
      inputSchema: {
        type: 'object',
        properties: {
          instruction: { type: 'string', minLength: 1, maxLength: 600 },
        },
        required: ['instruction'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: async (input: unknown) => {
        if (
          !input ||
          typeof input !== 'object' ||
          !('instruction' in input) ||
          typeof input.instruction !== 'string' ||
          !input.instruction.trim() ||
          input.instruction.length > 600
        )
          throw new Error(
            'A nonempty English instruction of at most 600 characters is required.',
          );
        await submitRef.current(input.instruction);
        return {
          day: stateRef.current.day,
          population: stateRef.current.population,
          buildings: counts(stateRef.current),
        };
      },
    });
    return () => lifecycle.abort();
  }, []);
  const onTile = (x: number, y: number) => {
    setStoryCamera(false);
    setAiError('');
    if (!isLand(x, y)) {
      setMessage('The sea belongs to itself. Choose a tile on the island.');
      return;
    }
    setFocusTile({ x, y });
    const s = stateRef.current,
      b = s.tiles.find((t) => t.x === x && t.y === y);
    if (tool === 'inspect') return;
    if (tool === 'remove') {
      if (!b) {
        setMessage('There is no building to rewild here.');
        return;
      }
      if (b.kind === 'core') {
        setMessage('AURA’s abundance core is part of the island.');
        return;
      }
      if (b.kind === 'home' && (counts(s).home - 1) * 48 < s.population) {
        setMessage(
          'People live here. Build enough spare Cloudhomes before rewilding.',
        );
        return;
      }
      pushUndo(s);
      commit({ ...s, tiles: s.tiles.filter((t) => t !== b) });
      setMessage('Materials returned to the commons. Nature can begin again.');
      setFocusTile(null);
      return;
    }
    const r = place(s, x, y, tool);
    if (r.ok) {
      pushUndo(s);
      commit(r.state);
      if (
        journeyOf(s).phase === 'place' &&
        journeyOf(stateRef.current).phase === 'neighbor'
      ) {
        setTool('inspect');
        setShowBuild(false);
        setGrid(false);
        setStoryCamera(true);
        setMessage('Your place is ready. Hear the neighbor to continue.');
        return;
      }
    }
    setMessage(r.message);
  };
  const choose = (choice: number) => {
    setAiError('');
    const s = stateRef.current,
      i = pendingEvent(s);
    if (i < 0) return;
    const next = decide(s, i, choice);
    commit(next);
    setModal(null);
    setSpeaker('aura');
    announce(EVENTS[i].options[choice].result, 'aura', true);
  };
  const talk = (id: number) => {
    if (aiBusy.current) return;
    setModal(null);
    void submitRef.current('Talk to ' + profile(id).name);
  };
  const statsPanel = (
    <>
      <div className="population">
        <strong>{state.population}</strong>
        <span>
          people
          <br />
          with time to be themselves
        </span>
      </div>
      <div className="wellbeing">
        <span>Quality of life</span>
        <strong>
          {harmony(state)}
          <small>/100</small>
        </strong>
      </div>
      {METRICS.map((m) => (
        <div className="metric" key={m.key} title={m.description}>
          <div>
            <span>{m.label}</span>
            <b>{Math.round(state.stats[m.key])}</b>
          </div>
          <Progress
            locale="en-US"
            value={state.stats[m.key]}
            aria-label={m.label}
            style={{ '--primary': m.color } as React.CSSProperties}
          />
        </div>
      ))}
      <div className="next-city-goal">
        <b>
          {state.won ? 'First charter reached' : 'Your next city milestone'}
        </b>
        <p>
          {state.won
            ? 'Your city keeps its memories. New invitations are waiting.'
            : goals.find((g) => g.progress < 1)?.text ||
              'Let the city settle into its new possibilities.'}
        </p>
        {!state.won && goals.slice(0, 3).every((g) => g.progress >= 1) && (
          <span>
            {METRICS.filter((m) => state.stats[m.key] < 75)
              .map((m) => `${m.label}: ${Math.round(state.stats[m.key])} / 75`)
              .join(' · ')}
          </span>
        )}
      </div>
      <p className="capacity">
        {counts(state).home * 48 - state.population} open homes ·{' '}
        {state.people.filter((p) => p.progress >= 100).length} dreams realized
      </p>
    </>
  );
  return (
    <main className="game">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            ✳
          </span>
          <div>
            <h1>
              NOVA<span> / </span>
            </h1>
            <small>AFTER WORK</small>
          </div>
        </div>
        <div className="abundance">
          <InfinityIcon />
          <div>
            Everything. For everyone.<small>Energy · Food · Possibility</small>
          </div>
        </div>
        <div className="time-controls">
          <div className="date">
            <span className="live-dot" />
            2186 <small>DAY {state.day}</small>
          </div>
          <button
            className="icon-button"
            onClick={() => setPaused(!paused)}
            aria-label={paused ? 'Resume time' : 'Pause time'}
            title={paused ? 'Resume time' : 'Pause time'}
          >
            {paused ? <Play /> : <Pause />}
          </button>
          <button
            className="speed-button"
            onClick={() => setSpeed(speed === 1 ? 3 : 1)}
            aria-label={'Speed ' + speed + ' times. Click to change.'}
          >
            {speed}×
          </button>
          <button
            className="icon-button help-top"
            onClick={() => setModal('story')}
            aria-label="Story and how to play"
          >
            <CircleHelp />
          </button>
        </div>
      </header>
      <section className="world">
        <CityCanvas
          state={state}
          tool={tool}
          zoom={zoom}
          night={night}
          grid={grid}
          onTile={onTile}
          onZoom={setZoom}
          focusTile={focusTile}
        />
        <div className="mayor-brief">
          <span className="eyebrow">YOU ARE THE MAYOR · {invitation.step}</span>
          <h2>{invitation.title}</h2>
          <p>{invitation.text}</p>
          <button className="brief-action" onClick={openJourney}>
            {invitation.action}
            <ArrowUpRight size={16} />
          </button>
          <button
            className={
              'brief-memories' +
              (state.moments?.[0]?.id && state.moments[0].id !== seenMoment
                ? ' unread'
                : '')
            }
            onClick={() => {
              setSeenMoment(state.moments?.[0]?.id || '');
              setModal('moments');
            }}
          >
            <Sparkles size={14} />
            {state.moments?.[0]?.title || 'Your city’s memories'}
            {state.moments?.length ? ` · ${state.moments.length}` : ''}
          </button>
        </div>
        <div className="coordinate">
          NOVA ISLAND <span>38° N / 24° E</span>
        </div>
        <aside className="city-panel">
          <div className="panel-heading">
            <span>Life in NOVA</span>
            <span className="live-dot" />
          </div>
          {statsPanel}
          <button className="residents-link" onClick={() => setModal('people')}>
            <span className="avatar-stack">
              {[0, 1, 2].map((i) => (
                <i key={i} style={{ background: profile(i).color }}>
                  {profile(i).initials}
                </i>
              ))}
            </span>
            <span>
              Meet your people
              <ArrowUpRight size={15} />
            </span>
          </button>
          <div className="aura-note">
            <Sparkles size={18} />
            <p>
              “A dream is a direction.
              <br />
              Not a contract.”<small>THE NOVA CHARTER</small>
            </p>
          </div>
        </aside>
        <button
          className="mobile-stats"
          aria-label="City life and current goals"
          onClick={() => setModal('stats')}
        >
          <Users size={15} />
          {state.population}
          <span />
          {harmony(state)} <Leaf size={14} />
        </button>
        <div className="world-controls">
          <button
            onClick={() => setNight(!night)}
            aria-label={night ? 'Show daylight' : 'Show nighttime'}
            title="Day / night"
          >
            {night ? <Sun /> : <Moon />}
          </button>
          <button
            onClick={() => setGrid(!grid)}
            aria-label="Toggle building grid"
            aria-pressed={grid}
            title="Building grid"
          >
            <Grid2X2 />
          </button>
          <span />
          <button
            onClick={() => setZoom(Math.min(2.4, zoom + 0.2))}
            aria-label="Zoom in"
          >
            <Plus />
          </button>
          <button
            onClick={() => setZoom(Math.max(0.6, zoom - 0.2))}
            aria-label="Zoom out"
          >
            <Minus />
          </button>
        </div>
        {event >= 0 && (
          <button className="council-alert" onClick={() => setModal('council')}>
            <span className="council-icon">
              <MessageCircle size={18} />
            </span>
            <span>
              <small>THE CITY HAS A QUESTION</small>
              <strong>{EVENTS[event].title}</strong>
            </span>
            <ArrowUpRight size={18} />
          </button>
        )}
        {selected && tool === 'inspect' && !storyCamera && (
          <div className="inspect-card">
            <button
              className="close-inspect"
              onClick={() => setFocusTile(null)}
              aria-label="Close building details"
            >
              <X size={14} />
            </button>
            <small>
              {BUILDINGS[selected.kind].category} · {selected.x}, {selected.y}
            </small>
            <h3>{selected.design?.name || BUILDINGS[selected.kind].name}</h3>
            <p>
              {selected.design?.description || BUILDINGS[selected.kind].text}
            </p>
            <span>{BUILDINGS[selected.kind].impact}</span>
            {journey.phase === 'neighbor' &&
              journey.venue?.x === selected.x &&
              journey.venue?.y === selected.y && (
                <button className="primary-action" onClick={openJourney}>
                  Continue the invitation <ArrowUpRight size={16} />
                </button>
              )}
            {selected.kind !== 'core' && (
              <button
                className="design-inline"
                disabled={thinking}
                onClick={() => {
                  setSpeaker('aura');
                  speakerRef.current = 'aura';
                  setInput('Redesign this place as ');
                  flushSync(() => {
                    setMobileWriting(true);
                    setMobileMenu(false);
                    setShowBuild(false);
                  });
                  inputRef.current?.focus();
                }}
              >
                <Palette size={15} /> Reshape this place{' '}
                {selected.revision ? `· revision ${selected.revision}` : ''}
              </button>
            )}
          </div>
        )}
        {tool !== 'inspect' && (
          <div className="placement-hint">
            {tool === 'remove'
              ? 'Choose a building to return to nature'
              : `Place ${BUILDINGS[tool].name} on an open tile`}
            <button
              onClick={() => setTool('inspect')}
              aria-label="Cancel building"
            >
              <X size={15} />
            </button>
          </div>
        )}
        {message && <output className="status-message">{message}</output>}
        <div className="world-hint">
          {guidingFirst && journey.phase === 'invitation'
            ? 'Meet Mira, or choose to explore freely'
            : paused
              ? 'Time is paused'
              : event >= 0
                ? 'Time is waiting for the council'
                : 'Drag to explore · Pinch or scroll to zoom'}
        </div>
      </section>
      <section
        className={`conversation-dock${mobileWriting ? ' writing-open' : ''}${mobileMenu ? ' menu-open' : ''}`}
        aria-label="Talk to the city"
      >
        <div className="conversation-row">
          <button
            className="speaker-badge"
            disabled={thinking}
            onClick={() => setModal('people')}
            aria-label={`Choose who to talk to · currently ${speaker === 'aura' ? 'AURA' : profile(speaker).name}`}
          >
            <span
              className="speaker-orb"
              style={
                speaker === 'aura'
                  ? {}
                  : { background: profile(speaker).color, color: '#294539' }
              }
            >
              {speaker === 'aura' ? <Sparkles /> : profile(speaker).initials}
            </span>
            <span>
              {speaker === 'aura'
                ? 'AURA'
                : profile(speaker).name.split(' ')[0]}
              <small>
                {speaker === 'aura'
                  ? 'CITY INTELLIGENCE'
                  : 'A LIFE OF THEIR OWN'}
              </small>
            </span>
            <ChevronDown size={14} />
          </button>
          <button
            className="reply-preview"
            onClick={() => setModal('history')}
            aria-label="Read conversation"
          >
            <p aria-live="polite">
              {thinking
                ? speaker === 'aura'
                  ? 'AURA is considering the possibilities…'
                  : profile(speaker).name.split(' ')[0] + ' is thinking…'
                : latest.text}
            </p>
            <MessageCircle size={16} />
          </button>
          <button
            className="icon-button audio-toggle"
            onClick={voice.toggleSpoken}
            aria-label={
              voice.spoken ? 'Mute spoken replies' : 'Enable spoken replies'
            }
            title={voice.spoken ? 'Spoken replies on' : 'Spoken replies off'}
          >
            {voice.spoken ? <Volume2 /> : <VolumeX />}
          </button>
        </div>
        <div className="composer">
          <button
            className={'mic-button ' + (voice.listening ? 'listening' : '')}
            disabled={thinking || voice.transcribing}
            onClick={voice.listen}
            aria-label={
              voice.listening
                ? 'Stop listening'
                : 'Speak to ' +
                  (speaker === 'aura' ? 'AURA' : profile(speaker).name)
            }
            aria-pressed={voice.listening}
          >
            {voice.listening ? (
              <span className="waveform">
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
            ) : voice.supported === false ? (
              <MicOff />
            ) : (
              <Mic />
            )}
            <span className="mobile-control-label">
              {voice.listening
                ? 'Finish'
                : voice.transcribing
                  ? 'Transcribing…'
                  : 'Talk'}
            </span>
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              voice.stop();
              if (input.trim()) {
                setMobileWriting(false);
                inputRef.current?.blur();
              }
              void submit(input);
            }}
          >
            <label className="sr-only" htmlFor="instruction">
              Speak or type an instruction
            </label>
            <input
              id="instruction"
              ref={inputRef}
              value={voice.listening ? voice.interim : input}
              readOnly={voice.listening || thinking || voice.transcribing}
              onChange={(e) => setInput(e.target.value)}
              maxLength={600}
              autoComplete="off"
              placeholder={
                voice.listening
                  ? 'Listening… tell me what you imagine.'
                  : speaker === 'aura'
                    ? '“Build a garden near the homes…”'
                    : '“What do you dream about?”'
              }
            />
            <button
              className="send-button"
              type="submit"
              disabled={
                !input.trim() ||
                voice.listening ||
                thinking ||
                voice.transcribing
              }
              aria-label="Send instruction"
            >
              <Send size={19} />
            </button>
          </form>
          <button
            className="mobile-dock-button"
            aria-label={
              mobileWriting ? 'Close keyboard' : 'Type an instruction'
            }
            aria-expanded={mobileWriting}
            aria-controls="instruction"
            onClick={() => {
              setMobileMenu(false);
              setShowBuild(false);
              flushSync(() => setMobileWriting(!mobileWriting));
              if (!mobileWriting) inputRef.current?.focus();
              else inputRef.current?.blur();
            }}
          >
            {mobileWriting ? <X /> : <Keyboard />}
            <span>{mobileWriting ? 'Done' : 'Write'}</span>
          </button>
          <button
            className="mobile-dock-button"
            aria-label={mobileMenu ? 'Close city menu' : 'Open city menu'}
            aria-expanded={mobileMenu}
            aria-controls="city-actions"
            onClick={() => {
              setMobileWriting(false);
              setShowBuild(false);
              setMobileMenu(!mobileMenu);
            }}
          >
            {mobileMenu ? <X /> : <Menu />}
            <span>Menu</span>
            {event >= 0 && <i className="menu-notification" />}
          </button>
          <div className="dock-actions" id="city-actions">
            <button
              aria-label="Build"
              className={showBuild ? 'active' : ''}
              onClick={() => {
                setShowBuild(!showBuild);
                setMobileMenu(false);
              }}
              aria-expanded={showBuild}
            >
              <Building2 />
              <span>Build</span>
            </button>
            <button
              aria-label="People"
              onClick={() => {
                setModal('people');
                setMobileMenu(false);
              }}
            >
              <Users />
              <span>People</span>
            </button>
            <button
              aria-label="Council"
              className={event >= 0 ? 'has-event' : ''}
              onClick={() => {
                setModal('council');
                setMobileMenu(false);
              }}
            >
              <Orbit />
              <span>Council</span>
            </button>
            <button
              disabled={thinking}
              aria-label="Design"
              onClick={() => {
                setModal('design');
                setMobileMenu(false);
              }}
              className={state.designProposal ? 'has-event' : ''}
            >
              <Palette />
              <span>Design</span>
            </button>
            <button aria-label="Your next invitation" onClick={openJourney}>
              <Sparkles />
              <span>Invitation</span>
            </button>
            <button
              aria-label="City memories"
              onClick={() => {
                setMobileMenu(false);
                setSeenMoment(state.moments?.[0]?.id || '');
                setModal('moments');
              }}
            >
              <Archive />
              <span>Memories</span>
            </button>
          </div>
        </div>
        <output
          className={`composer-meta${voice.error || aiError || thinking || voice.transcribing || voice.listening ? ' active-status' : ''}`}
        >
          <span>
            {voice.error ||
              aiError ||
              (thinking
                ? 'Thinking · a living mind is forming a reply'
                : voice.transcribing
                  ? 'Transcribing your voice…'
                  : voice.listening
                    ? 'Listening · tap again to finish (up to 25 seconds)'
                    : voice.speaking
                      ? 'Speaking · tap the microphone to interrupt'
                      : voice.supported === false
                        ? 'Type here or use your keyboard’s dictation.'
                        : aiReady
                          ? 'Live AI · tap to talk, or write freely'
                          : 'Local mode · AI server is not connected yet')}
          </span>
          <span className="save-status">{saveStatus}</span>
        </output>
        {!showBuild && (
          <div className="suggestions">
            {(speaker === 'aura'
              ? [
                  'Build two gardens near homes',
                  'Talk to Mira',
                  'How is the city?',
                ]
              : [
                  'What is your dream?',
                  'How are you feeling?',
                  'Design a place for your dream',
                ]
            ).map((t) => (
              <button key={t} onClick={() => submit(t)}>
                {t}
                <ArrowUpRight size={12} />
              </button>
            ))}
          </div>
        )}
      </section>
      {showBuild && (
        <footer className="build-dock">
          <div className="dock-label">
            <span className="eyebrow">WHAT SHALL WE MAKE POSSIBLE?</span>
            <div className="build-tools">
              <button
                onClick={() => announce(undo())}
                aria-label="Undo last building change"
              >
                <Undo2 size={15} />
                Undo
              </button>
              <button
                className={tool === 'remove' ? 'active' : ''}
                onClick={() =>
                  setTool(tool === 'remove' ? 'inspect' : 'remove')
                }
                aria-pressed={tool === 'remove'}
              >
                <Eraser size={15} />
                Rewild
              </button>
              <button
                onClick={() => setShowBuild(false)}
                aria-label="Close building palette"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="building-list">
            <button
              className={'build-card ' + (tool === 'inspect' ? 'selected' : '')}
              onClick={() => setTool('inspect')}
            >
              <MousePointer2 />
              <b>Explore</b>
              <small>Look around</small>
            </button>
            {KEYS.map((k, i) => {
              const Icon = icons[k];
              return (
                <button
                  key={k}
                  className={'build-card ' + (tool === k ? 'selected' : '')}
                  onClick={() => {
                    setTool(k);
                    setFocusTile(null);
                  }}
                  aria-pressed={tool === k}
                  title={BUILDINGS[k].text + ' ' + BUILDINGS[k].impact}
                  style={
                    {
                      '--building-color': BUILDINGS[k].color,
                    } as React.CSSProperties
                  }
                >
                  <span className="key-number">0{i + 1}</span>
                  <Icon />
                  <b>{BUILDINGS[k].name}</b>
                  <small>
                    {BUILDINGS[k].category} <span>∞</span>
                  </small>
                </button>
              );
            })}
          </div>
        </footer>
      )}
      <Dialog
        open={modal !== null}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
      >
        <DialogContent
          ref={dialogRef}
          initialFocus={modal === 'journey' ? journeyTitleRef : undefined}
          finalFocus={mobileWriting ? inputRef : undefined}
          className={
            'nova-dialog ' +
            (modal === 'people'
              ? 'people-dialog'
              : modal === 'history'
                ? 'history-dialog'
                : '')
          }
        >
          <DialogHeader>
            <span className="eyebrow">NOVA · LIFE AFTER WORK</span>
            <DialogTitle ref={journeyTitleRef} tabIndex={-1}>
              {modal === 'journey'
                ? chapter?.title || 'What happens next?'
                : modal === 'moments'
                  ? 'The life you made room for.'
                  : modal === 'design'
                    ? 'Imagine a place.'
                    : modal === 'people'
                      ? 'Everyone is a whole world.'
                      : modal === 'council'
                        ? event >= 0
                          ? EVENTS[event].title
                          : 'Our unfolding story'
                        : modal === 'story'
                          ? 'Everything is solved. Life is not.'
                          : modal === 'stats'
                            ? 'A city is how people feel.'
                            : modal === 'victory'
                              ? 'This is what abundance can become.'
                              : 'Your conversation'}
            </DialogTitle>
            <DialogDescription>
              {modal === 'journey'
                ? 'Shape the places. Listen to the people. Let a shared life unfold.'
                : modal === 'moments'
                  ? 'Personal milestones and shared occasions, remembered in this city.'
                  : modal === 'design'
                    ? 'Describe it, shape it together, then bring it to life.'
                    : modal === 'people'
                      ? `${state.population} people. ${state.population} different ways to be alive. Choose someone to talk to.`
                      : modal === 'council'
                        ? event >= 0
                          ? EVENTS[event].lead
                          : 'The choices we have made, and the possibilities ahead.'
                        : modal === 'story'
                          ? 'The year is 2186. Forty-one years ago, the last compulsory work shift ended.'
                          : modal === 'stats'
                            ? 'Provision is infinite. Attention, space and care still matter.'
                            : modal === 'victory'
                              ? 'You have created a city where people can flourish. There is no final perfect city. Keep listening.'
                              : 'Your recent conversations in NOVA. Spoken and typed requests share the same world.'}
            </DialogDescription>
          </DialogHeader>
          {modal === 'journey' && (
            <JourneyPanel
              state={state}
              onAction={actJourney}
              onBuild={buildForJourney}
              onManual={() => {
                const p = pathOf(state);
                if (!p) return;
                setTool(p.kind);
                setGrid(true);
                setModal(null);
                setShowBuild(false);
                setMessage(
                  'Tap an open plot. Your invitation will continue when the place is built.',
                );
              }}
              onVisit={() => {
                if (journey.venue) setFocusTile(journey.venue);
                setStoryCamera(true);
                setModal(null);
              }}
              onPeople={() => setModal('people')}
            />
          )}
          {modal === 'journey' && (
            <div className="journey-voice">
              <button
                type="button"
                className="secondary-action"
                disabled={thinking || voice.transcribing}
                onClick={voice.listen}
                aria-pressed={voice.listening}
              >
                {voice.listening ? <Square size={16} /> : <Mic size={16} />}
                {voice.listening ? 'Finish speaking' : 'Speak your choice'}
              </button>
              <p aria-live="polite">
                {voice.error ||
                  aiError ||
                  (thinking
                    ? 'Listening to your idea…'
                    : voice.transcribing
                      ? 'Turning your voice into words…'
                      : voice.listening
                        ? voice.interim || 'Listening…'
                        : 'Or use the choices above. Your invitation stays saved.')}
              </p>
            </div>
          )}
          {modal === 'moments' && (
            <div className="moments-book">
              {!state.moments?.length && (
                <>
                  <p>
                    Your first page is still unwritten. Help a neighbor turn an
                    idea into a shared moment.
                  </p>
                  <button className="primary-action" onClick={openJourney}>
                    Open your invitation <ArrowUpRight size={16} />
                  </button>
                </>
              )}
              {state.moments?.map((m) => (
                <article key={m.id}>
                  <small>
                    DAY {m.day} · {profile(m.person).name}
                  </small>
                  <h3>{m.title}</h3>
                  <p>{m.text}</p>
                  {m.venue &&
                    state.tiles.some(
                      (t) =>
                        t.x === m.venue?.x &&
                        t.y === m.venue?.y &&
                        t.kind === m.venue.kind,
                    ) && (
                      <button
                        className="secondary-action"
                        onClick={() => {
                          setFocusTile(m.venue!);
                          setModal(null);
                        }}
                      >
                        Visit this place <ArrowUpRight size={16} />
                      </button>
                    )}
                  <button
                    className="journey-link"
                    onClick={() => talk(m.person)}
                  >
                    Talk to {profile(m.person).name.split(' ')[0]}
                  </button>
                </article>
              ))}
            </div>
          )}
          {modal === 'people' && (
            <>
              <button
                className="aura-choice"
                onClick={() => {
                  setSpeaker('aura');
                  setModal(null);
                  announce('I am here. What would you like to make possible?');
                }}
              >
                <Sparkles />
                <div>
                  <b>AURA</b>
                  <span>Talk to the city intelligence</span>
                </div>
                <ArrowUpRight />
              </button>
              <input
                className="resident-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a person or a dream…"
                aria-label="Find a resident"
              />
              <div className="resident-list">
                {state.people
                  .filter((p) => {
                    const pr = residentProfile(p);
                    return (pr.name + ' ' + pr.wish)
                      .toLowerCase()
                      .includes(search.toLowerCase());
                  })
                  .slice(0, 50)
                  .map((p) => {
                    const pr = residentProfile(p);
                    return (
                      <button
                        key={p.id}
                        className="resident-card"
                        disabled={thinking}
                        onClick={() => talk(p.id)}
                      >
                        <span
                          className="resident-avatar"
                          style={{ background: pr.color }}
                        >
                          {pr.initials}
                        </span>
                        <div className="resident-content">
                          <div className="resident-name">
                            <b>{pr.name}</b>
                            <span>
                              {pr.age} ·{' '}
                              {p.trust > 45
                                ? 'Getting to know you'
                                : pr.trait.split(' · ')[0]}
                            </span>
                          </div>
                          <p>“{pr.wish}.”</p>
                          <small>{feeling(state, p)}</small>
                          <Progress
                            locale="en-US"
                            value={p.progress}
                            aria-label={pr.name + ' dream progress'}
                          />
                          <span className="resident-progress">
                            {p.progress >= 100
                              ? 'Dream realized'
                              : Math.round(p.progress) +
                                '% · ' +
                                (state.tiles.some((t) => t.kind === pr.kind)
                                  ? activity(state, p)
                                  : 'Needs ' + BUILDINGS[pr.kind].name)}
                          </span>
                        </div>
                        <ArrowUpRight size={16} />
                      </button>
                    );
                  })}
                {!state.people.some((p) =>
                  (residentProfile(p).name + ' ' + residentProfile(p).wish)
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                ) && (
                  <p className="empty-message">
                    No one matches that yet. Try a name, “garden” or “dream”.
                  </p>
                )}
              </div>
              <p className="fine-print">
                Showing up to 50 people. Search to find anyone in the city.
              </p>
            </>
          )}
          {modal === 'design' && (
            <div className="design-studio">
              {state.designProposal ? (
                <>
                  <DesignPreview design={state.designProposal.blueprint} />
                  <div className="design-caption">
                    <span className="eyebrow">
                      {state.designProposal.author === 'aura'
                        ? 'YOUR DESIGN WITH AURA'
                        : `AN IDEA FROM ${profile(state.designProposal.author).name.toUpperCase()}`}
                    </span>
                    <h3>{state.designProposal.blueprint.name}</h3>
                    <p>{state.designProposal.blueprint.description}</p>
                    <p className="fine-print">
                      {BUILDINGS[state.designProposal.kind].category} ·{' '}
                      {state.designProposal.target
                        ? `Plot ${state.designProposal.target.x}, ${state.designProposal.target.y}`
                        : state.designProposal.near
                          ? `Near ${BUILDINGS[state.designProposal.near].name}`
                          : 'An open plot'}{' '}
                      · {BUILDINGS[state.designProposal.kind].impact}
                    </p>
                  </div>
                  <div className="design-buttons">
                    <button
                      disabled={
                        thinking || voice.listening || voice.transcribing
                      }
                      onClick={acceptDesign}
                    >
                      <Check size={17} /> Build this design
                    </button>
                    <button
                      disabled={thinking}
                      onClick={() => {
                        commit({
                          ...stateRef.current,
                          designProposal: undefined,
                        });
                        setModal(null);
                      }}
                    >
                      Discard design
                    </button>
                  </div>
                </>
              ) : (
                <p>
                  Describe a place to AURA, or ask a resident for an idea. To
                  reshape an existing place, select it on the map first. Each
                  design fits one plot and keeps its chosen purpose.
                </p>
              )}
              <p className="design-reply" aria-live="polite">
                {thinking ? 'Considering your idea…' : designReply}
              </p>
              <div className="design-voice-area">
                <form
                  className="design-composer"
                  onSubmit={(e) => {
                    e.preventDefault();
                    voice.stop();
                    void submit(input);
                  }}
                >
                  <button
                    type="button"
                    className={
                      'mic-button ' + (voice.listening ? 'listening' : '')
                    }
                    disabled={thinking || voice.transcribing}
                    onClick={voice.listen}
                    aria-label={
                      voice.listening
                        ? 'Finish design instruction'
                        : 'Speak a design instruction'
                    }
                  >
                    <Mic />
                  </button>
                  <input
                    aria-label="Describe your design"
                    value={voice.listening ? voice.interim : input}
                    readOnly={voice.listening || thinking || voice.transcribing}
                    onChange={(e) => setInput(e.target.value)}
                    maxLength={600}
                    placeholder={
                      state.designProposal
                        ? 'Make it lower, with a green roof…'
                        : 'Design a round music pavilion…'
                    }
                  />
                  <button
                    type="submit"
                    disabled={
                      !input.trim() ||
                      thinking ||
                      voice.listening ||
                      voice.transcribing
                    }
                    aria-label="Send design instruction"
                  >
                    <Send size={18} />
                  </button>
                </form>
                <p className="fine-print" aria-live="polite">
                  {aiError ||
                    voice.error ||
                    (thinking
                      ? 'Shaping the idea…'
                      : voice.transcribing
                        ? 'Transcribing…'
                        : voice.listening
                          ? 'Listening · tap again to finish'
                          : `Talking to ${speaker === 'aura' ? 'AURA' : profile(speaker).name}. You can also say “Build this design”.`)}
                </p>
              </div>
              {!state.designProposal && (
                <div className="command-examples">
                  {[
                    'Design a circular music pavilion with a green roof',
                    'Design a terraced garden with a golden canopy',
                  ].map((t) => (
                    <button
                      disabled={thinking}
                      key={t}
                      onClick={() => submit(t)}
                    >
                      {t}
                      <ArrowUpRight size={14} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {modal === 'council' && (
            <>
              {event >= 0 ? (
                <>
                  <p className="story-text">{EVENTS[event].text}</p>
                  <p className="choice-intro">
                    There is more than one caring answer.
                  </p>
                  <div className="choices">
                    {EVENTS[event].options.map((o, i) => (
                      <button key={o.label} onClick={() => choose(i)}>
                        <span>0{i + 1}</span>
                        <div>
                          <b>{o.label}</b>
                          <small>{o.note}</small>
                        </div>
                        <ArrowUpRight size={17} />
                      </button>
                    ))}
                  </div>
                  <div className="council-voice">
                    <button
                      className={
                        'icon-button ' + (voice.listening ? 'active' : '')
                      }
                      onClick={voice.listen}
                      disabled={thinking || voice.transcribing}
                      aria-label="Speak your council choice"
                    >
                      <Mic />
                    </button>
                    <span aria-live="polite">
                      {voice.error ||
                        aiError ||
                        voice.interim ||
                        'Or say “choose option one” or “choose option two”.'}
                    </span>
                  </div>
                </>
              ) : (
                <p className="story-text">
                  {state.decisions.length === EVENTS.length
                    ? 'The first charter is complete. The city is yours to keep discovering.'
                    : 'The next conversation begins on day ' +
                      EVENTS.find((e) => e.day > state.day)?.day +
                      '. Let a little time pass, and listen to your people.'}
                </p>
              )}
              <div className="milestones">
                {goals.map((g, i) => (
                  <div key={g.title}>
                    <span
                      className={
                        'goal-index ' + (g.progress >= 1 ? 'complete' : '')
                      }
                    >
                      {g.progress >= 1 ? <Check size={15} /> : i + 1}
                    </span>
                    <div>
                      <b>{g.title}</b>
                      <p>{g.text}</p>
                      <Progress
                        locale="en-US"
                        value={g.progress * 100}
                        aria-label={g.title}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {state.log.length > 0 && (
                <div className="city-journal">
                  <h3>Our shared memory</h3>
                  {state.log.map((l, i) => (
                    <p key={i}>{l}</p>
                  ))}
                </div>
              )}
            </>
          )}
          {modal === 'stats' && (
            <div className="expanded-stats">
              {statsPanel}
              {METRICS.map((m) => (
                <p key={m.key}>
                  <b style={{ color: m.color }}>{m.label}.</b> {m.description}
                </p>
              ))}
            </div>
          )}
          {modal === 'history' && (
            <div className="conversation-history" ref={historyRef}>
              {messages.map((m, i) => (
                <div
                  className={
                    m.speaker === 'you' ? 'user-message' : 'character-message'
                  }
                  key={i}
                >
                  <small>
                    {m.speaker === 'you'
                      ? 'YOU'
                      : m.speaker === 'aura'
                        ? 'AURA'
                        : profile(m.speaker).name.toUpperCase()}{' '}
                    · DAY {m.day}
                  </small>
                  <p>{m.text}</p>
                  {m.speaker !== 'you' && (
                    <button
                      onClick={() => voice.say(m.text, m.speaker as Speaker)}
                      aria-label="Read this reply aloud"
                    >
                      <Volume2 size={15} />
                    </button>
                  )}
                </div>
              ))}
              <button
                className="primary-action"
                onClick={() => {
                  flushSync(() => {
                    setModal(null);
                    setMobileWriting(true);
                    setShowBuild(false);
                    setMobileMenu(false);
                  });
                  inputRef.current?.focus();
                }}
              >
                Continue conversation <MessageCircle size={16} />
              </button>
            </div>
          )}
          {modal === 'story' && (
            <div className="story-body">
              <p className="story-text">
                Machines grow the food, make the energy and build the homes.
                Nobody has to earn their right to exist. You are the mayor of
                NOVA. You shape shared places and agreements; residents choose
                their own lives. Start with one person’s invitation, make a
                place for it, and see what happens when people meet.
              </p>
              <h3>Your voice shapes the island</h3>
              <div className="command-examples">
                {[
                  'Build three Cloudhomes',
                  'Plant two gardens near homes',
                  'Talk to Juno',
                  'What is your dream?',
                  'Open the council',
                  'Pause',
                  'Make it night',
                  'Undo',
                ].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setModal(null);
                      void submit(t);
                    }}
                  >
                    {t}
                    <ArrowUpRight size={14} />
                  </button>
                ))}
              </div>
              <p>
                Tap the microphone to speak in English. Tap again to finish.
                AURA and residents can reply aloud. You can also type, tap a
                suggestion, or build directly on the map.
              </p>
              <h3>People choose their own lives</h3>
              <p>
                Every resident has a personality, a project, a view of the world
                and memories of your conversations. Give their dreams somewhere
                to grow, then give them time. There are no jobs to assign.
              </p>
              <h3>The gentle challenge</h3>
              <p>
                Grow to 240 people, offer six building types, make three council
                decisions, and bring all four life measures to 75. Materials are
                unlimited; island space and human attention are not. Dream Pods
                support freedom but can weaken belonging.
              </p>
              <p>
                Garden–home neighbors increase belonging. Observatories near
                Wonder Labs increase purpose. More residents need more places to
                gather and explore. You cannot remove an occupied home without
                spare housing.
              </p>
              <h3>A few practical things</h3>
              <p>
                Drag the map to move, pinch or scroll to zoom. On the map, arrow
                keys move your selection, Enter places a building and Home
                centers the view. Number keys 1–8 select buildings, Space
                pauses, V starts voice, Escape cancels building.
              </p>
              <p className="fine-print">
                Live mode connects AURA and residents to OpenAI through the
                game’s protected server. Characters can reflect, remember your
                conversations and choose new projects. Building and council
                controls still work when AI is unavailable. Voice clips are sent
                to the server for transcription, then discarded by the game;
                replies use your device’s speech voices. Conversations and a
                compact city context are sent to OpenAI only when you speak or
                send a message. Your city saves on this device. No background AI
                requests run.
              </p>
              <button
                className="reset-link"
                onClick={() => {
                  setModal(null);
                  setResetOpen(true);
                }}
              >
                <RotateCcw size={15} />
                Begin a new city
              </button>
            </div>
          )}
          {modal === 'victory' && (
            <div className="victory-body">
              <span className="victory-mark">✳</span>
              <p className="story-text">
                {state.population} people. A constellation of unfinished dreams.
                A place where everyone has enough, and nobody has to become the
                same.
              </p>
              <p>
                “Perhaps abundance is not having every answer. Perhaps it is
                finally having time for better questions.”
              </p>
              <small>AURA · FIRST CHARTER OF NOVA</small>
              <button className="primary-action" onClick={() => setModal(null)}>
                Let life keep unfolding <ArrowUpRight size={17} />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent className="nova-dialog">
          <AlertDialogTitle>Begin another NOVA?</AlertDialogTitle>
          <AlertDialogDescription>
            This replaces the city saved on this device, including its people’s
            memories and your council choices.
          </AlertDialogDescription>
          <div className="reset-actions">
            <AlertDialogCancel>Keep this city</AlertDialogCancel>
            <button
              className="primary-action"
              disabled={thinking || voice.listening || voice.transcribing}
              onClick={() => {
                const fresh = initialState();
                commit(fresh);
                undoRef.current = [];
                setPaused(false);
                setSpeaker('aura');
                setFocusTile(null);
                setTool('inspect');
                setSpeed(1);
                setResetOpen(false);
                setMessages([
                  {
                    speaker: 'aura',
                    text: 'A new beginning. Everything is here. What shall we make possible?',
                    day: 1,
                  },
                ]);
                voice.quiet();
              }}
            >
              Begin again
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
