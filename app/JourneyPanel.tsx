'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  MapPin,
  Music2,
  Sparkles,
  Square,
} from 'lucide-react';
import { BUILDINGS, type State } from './simulation';
import { profile } from './citizens';
import {
  CHAPTERS,
  chapterOf,
  journeyOf,
  pathOf,
  type JourneyAction,
} from './journey';

function MiraMotif({ quiet }: { quiet: boolean }) {
  const audio = useRef<AudioContext | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    void audio.current?.close();
    audio.current = null;
    setPlaying(false);
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      void audio.current?.close();
    },
    [],
  );
  const play = async () => {
    if (playing) {
      stop();
      return;
    }
    try {
      const ctx = new AudioContext();
      audio.current = ctx;
      await ctx.resume();
      setPlaying(true);
      setError('');
      const notes = quiet
        ? [60, 67, 69, 0, 64, 0, 62, 67, 60]
        : [60, 64, 67, 69, 67, 64, 62, 67, 60];
      notes.forEach((note, i) => {
        if (!note) return;
        const oscillator = ctx.createOscillator(),
          gain = ctx.createGain(),
          start = ctx.currentTime + 0.08 + i * 0.45;
        oscillator.type = 'sine';
        oscillator.frequency.value = 440 * 2 ** ((note - 69) / 12);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.7);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.75);
      });
      timer.current = setTimeout(stop, 4900);
    } catch {
      stop();
      setError(
        'Sound is unavailable here. The gathering and your memory are still saved.',
      );
    }
  };
  return (
    <div className="motif-control">
      <button className="secondary-action" onClick={() => void play()}>
        {playing ? <Square size={16} /> : <Music2 size={16} />}
        {playing ? 'Stop the melody' : 'Listen to Mira’s little melody'}
      </button>
      <small>A short musical sketch for this gathering.</small>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
export default function JourneyPanel({
  state,
  onAction,
  onBuild,
  onManual,
  onVisit,
  onPeople,
}: {
  state: State;
  onAction: (action: JourneyAction) => void;
  onBuild: () => void;
  onManual: () => void;
  onVisit: () => void;
  onPeople: () => void;
}) {
  const j = journeyOf(state),
    c = chapterOf(state),
    path = pathOf(state);
  if (!c)
    return (
      <div className="journey-body">
        <p>
          You helped make a song, a table and a shared question possible. These
          places and memories belong to your city now.
        </p>
        <div className="keepsake-list">
          {CHAPTERS.map((c) => (
            <p key={c.person}>
              <Check size={16} />
              {c.keepsake}
            </p>
          ))}
        </div>
        <p>
          Other residents still need somewhere to begin. Find someone whose
          dream has no place yet, or reshape a familiar place together.
        </p>
        <button className="primary-action" onClick={onPeople}>
          Find the next possibility <ArrowUpRight size={16} />
        </button>
      </div>
    );
  const person = profile(c.person);
  return (
    <div className="journey-body">
      {j.phase !== 'celebration' && (
        <div className="journey-person">
          <span style={{ background: person.color }}>{person.initials}</span>
          <div>
            <b>{person.name}</b>
            <small>{person.trait}</small>
          </div>
        </div>
      )}
      {j.phase === 'invitation' && (
        <>
          {j.chapter === 0 && (
            <p className="mayor-role">
              <b>You are NOVA’s mayor.</b> Machines provide the essentials. You
              shape shared places and agreements; people choose what to do with
              their lives. Start by making one small wish possible.
            </p>
          )}
          <blockquote>{c.invitation}</blockquote>
          <button className="primary-action" onClick={() => onAction('begin')}>
            Let’s make room for this <ArrowUpRight size={16} />
          </button>
          <button className="journey-link" onClick={() => onAction('explore')}>
            I’ll explore the city first
          </button>
        </>
      )}
      {j.phase === 'choose' && (
        <>
          <p>
            What kind of experience would you like to make possible? Both paths
            can work.
          </p>
          <div className="journey-choices">
            {c.paths.map((p, i) => (
              <button
                key={p.kind}
                onClick={() => onAction(i ? 'path-1' : 'path-0')}
              >
                <b>{p.name}</b>
                <span>{p.description}</span>
                <small>
                  {BUILDINGS[p.kind].name} · say “{p.name}”
                </small>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
        </>
      )}
      {j.phase === 'place' && path && (
        <>
          <p>
            <b>{path.name}.</b> {path.description} Choose where it happens.
          </p>
          <button className="primary-action" onClick={onBuild}>
            Build {BUILDINGS[path.kind].name} nearby <Sparkles size={16} />
          </button>
          <button className="secondary-action" onClick={onManual}>
            Choose a plot myself <MapPin size={16} />
          </button>
          {state.tiles.some((t) => t.kind === path.kind) && (
            <button
              className="secondary-action"
              onClick={() => onAction('use')}
            >
              Use an existing {BUILDINGS[path.kind].name}
            </button>
          )}
          <small className="journey-hint">
            No cost. No rush. The invitation stays here while you explore.
            Voice: “Build my chosen place” or “Use an existing place”.
          </small>
        </>
      )}
      {j.phase === 'neighbor' && (
        <>
          <blockquote>{c.neighbor}</blockquote>
          <p>
            Your role is to make room for different people. How should this
            gathering work?
          </p>
          <div className="journey-choices">
            {c.agreements.map((a, i) => (
              <button
                key={a}
                onClick={() => onAction(i ? 'agreement-1' : 'agreement-0')}
              >
                <b>{a}</b>
                <span>{c.consequences[i]}</span>
                <small>Say “{a}”</small>
              </button>
            ))}
          </div>
        </>
      )}
      {j.phase === 'ready' && (
        <>
          <div className="invitation-ticket">
            <small>YOUR INVITATION IS READY</small>
            <h3>{c.title}</h3>
            <p>{path?.name}</p>
            <p>{c.consequences[j.agreement ?? 0]}</p>
            <span>
              {person.name.split(' ')[0]} + a few willing neighbors. Nobody has
              to join.
            </span>
          </div>
          <button className="primary-action" onClick={() => onAction('host')}>
            Host the gathering <Sparkles size={16} />
          </button>
          <small className="journey-hint">
            Or say “Host the gathering”. This starts the scene and saves a
            shared memory.
          </small>
        </>
      )}
      {j.phase === 'celebration' && (
        <>
          <div className="memory-reward">
            <span className="memory-star" aria-hidden>
              ✳
            </span>
            <small>A MEMORY FOR YOUR CITY</small>
            <h3>{c.keepsake}</h3>
            <p>{c.outcomes[j.agreement ?? 0]}</p>
            <blockquote>{c.thanks}</blockquote>
            <span>
              <Check size={16} />
              Saved · {person.name.split(' ')[0]} will remember your help
            </span>
          </div>
          {j.chapter === 0 && <MiraMotif quiet={j.agreement === 1} />}
          <button className="secondary-action" onClick={onVisit}>
            See the gathering on the map <MapPin size={16} />
          </button>
          <p>{c.next}</p>
          <button className="primary-action" onClick={() => onAction('next')}>
            {j.chapter < CHAPTERS.length - 1
              ? 'Open the next invitation'
              : 'Keep the story going'}{' '}
            <ArrowUpRight size={16} />
          </button>
        </>
      )}
    </div>
  );
}
