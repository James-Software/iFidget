'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  AudioLines,
  ChevronRight,
  Heart,
  Maximize2,
  Minimize2,
  RotateCcw,
  Settings2,
  Shuffle,
  Smartphone,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import Playground from '@/components/fidget-playground';
import { fidgets, type FidgetId } from '@/lib/fidgets';
import { feedback, suspendAudio } from '@/lib/feedback';

const silentPreview = () => {};

export default function Home() {
  const [selected, setSelected] = useState<FidgetId>('pop');
  const [filter, setFilter] = useState('All fidgets');
  const [sound, setSound] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [motion, setMotion] = useState(false);
  const [motionStatus, setMotionStatus] = useState(
    'Enable tilt & shake for motion toys.',
  );
  const [canVibrate, setCanVibrate] = useState(false);
  const [settings, setSettings] = useState(false);
  const [focus, setFocus] = useState(false);
  const [reset, setReset] = useState(0);
  const [count, setCount] = useState(0);
  const interactionCount = useRef(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const toyRef = useRef<HTMLElement>(null);
  const current = fidgets.find((f) => f.id === selected)!;
  useEffect(() => {
    // Browser capabilities and persisted preferences must hydrate after the server render.
    // eslint-disable-next-line react/react-compiler
    setCanVibrate(typeof navigator.vibrate === 'function');
    try {
      const prefs = JSON.parse(localStorage.getItem('ifidget-prefs') || '{}');
      setSound(prefs.sound !== false);
      setHaptics(prefs.haptics !== false);
      setFavorites(
        Array.isArray(prefs.favorites)
          ? prefs.favorites.filter((v: unknown) => typeof v === 'string')
          : [],
      );
    } catch {
      /* Defaults remain usable in private browsing. */
    }
    const pause = () => {
      if (document.hidden) suspendAudio();
    };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, []);
  useEffect(() => {
    if (settings) dialog.current?.showModal();
    else dialog.current?.close();
  }, [settings]);
  function openSettings() {
    setCount(interactionCount.current);
    setSettings(true);
  }
  function save(next: {
    sound?: boolean;
    haptics?: boolean;
    favorites?: string[];
  }) {
    try {
      localStorage.setItem(
        'ifidget-prefs',
        JSON.stringify({ sound, haptics, favorites, ...next }),
      );
    } catch {
      /* Storage is optional. */
    }
  }
  const play = useCallback(
    (kind: string, pitch = 0) => {
      feedback(kind, pitch, sound, haptics);
      interactionCount.current += 1;
    },
    [sound, haptics],
  );
  function choose(id: FidgetId, scroll = false) {
    setSelected(id);
    setReset((r) => r + 1);
    if (scroll && window.innerWidth < 800)
      toyRef.current?.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
        block: 'start',
      });
  }
  async function enableMotion() {
    if (motion) {
      setMotion(false);
      setMotionStatus('Motion is off. Touch controls still work.');
      return;
    }
    if (!window.isSecureContext) {
      setMotionStatus('Motion needs HTTPS. Touch controls work here.');
      return;
    }
    if (!('DeviceMotionEvent' in window)) {
      setMotionStatus('Motion is unavailable here. Try the touch controls.');
      return;
    }
    try {
      const sensor = DeviceMotionEvent as typeof DeviceMotionEvent & {
        requestPermission?: () => Promise<string>;
      };
      const result = sensor.requestPermission
        ? await sensor.requestPermission()
        : 'granted';
      if (result !== 'granted') {
        setMotionStatus('Access was declined. Touch controls still work.');
        return;
      }
      setMotion(true);
      setMotionStatus(
        'Motion enabled. Tilt in Gravity or shake the Rain stick.',
      );
    } catch {
      setMotionStatus('Motion could not start. Touch controls still work.');
    }
  }
  const shown = fidgets.filter(
    (f) =>
      filter === 'All fidgets' ||
      (filter === 'Favorites'
        ? favorites.includes(f.id)
        : f.category === filter),
  );
  return (
    <div className={`app-shell ${focus ? 'focus-mode' : ''}`}>
      <header className="topbar">
        <Link className="brand" href="/" aria-label="iFidget home">
          <span className="brand-mark">
            <i />
            <i />
            <i />
            <i />
          </span>
          iFidget<span className="brand-period">.</span>
        </Link>
        <span className="header-note">A little less restless.</span>
        <div className="header-actions">
          <button
            className={`icon-button ${sound ? '' : 'muted'}`}
            aria-label={sound ? 'Mute sound' : 'Enable sound'}
            onClick={() => {
              setSound(!sound);
              save({ sound: !sound });
              if (!sound) feedback('keys', 4, true, false);
            }}
          >
            {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
          <button
            className="icon-button"
            aria-label="Open settings"
            onClick={openSettings}
          >
            <Settings2 size={19} />
          </button>
        </div>
      </header>
      <main>
        <div className="intro">
          <div>
            <div className="eyebrow">
              <span className="live-dot" /> YOUR POCKET PLAYGROUND
            </div>
            <h1>
              Busy hands.
              <br className="mobile-break" /> <span>Quiet mind.</span>
            </h1>
            <p>No scores. No rush. Just a little feel-good.</p>
          </div>
          <div className="intro-detail">
            <span className="tiny-doodle">✳</span>
            <span>
              Made for your
              <br />
              in-between moments.
            </span>
          </div>
        </div>
        <section
          ref={toyRef}
          className="play-section"
          style={{ '--toy-color': current.color } as React.CSSProperties}
          aria-label={`${current.name} playground`}
        >
          <div className="play-heading">
            <span>
              <span className="live-dot" /> NOW PLAYING
            </span>
            <div>
              <button
                className={`icon-button favorite ${favorites.includes(selected) ? 'is-favorite' : ''}`}
                aria-label={
                  favorites.includes(selected)
                    ? 'Remove favorite'
                    : 'Favorite this fidget'
                }
                aria-pressed={favorites.includes(selected)}
                onClick={() => {
                  const next = favorites.includes(selected)
                    ? favorites.filter((f) => f !== selected)
                    : [...favorites, selected];
                  setFavorites(next);
                  save({ favorites: next });
                }}
              >
                <Heart size={18} />
              </button>
              <button
                className="icon-button"
                aria-label={focus ? 'Exit focus mode' : 'Enter focus mode'}
                onClick={() => setFocus(!focus)}
              >
                {focus ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>
          </div>
          <div className="play-content">
            <div className="toy-description">
              <span className="eyebrow toy-tag">{current.tag}</span>
              <h2>
                {current.name}
                <span>.</span>
              </h2>
              <p>{current.description}</p>
              <div className="capabilities">
                <span>
                  <AudioLines size={14} /> Sound
                </span>
                <span>
                  <Zap size={14} /> {canVibrate ? 'Haptics' : 'Touch'}
                </span>
                {current.category === 'Motion' && (
                  <button onClick={enableMotion}>
                    <Smartphone size={14} />
                    {motion ? 'Motion on' : 'Enable motion'}
                  </button>
                )}
              </div>
              <div className="desktop-hint">
                <span className="hint-line" />
                {current.instruction}
              </div>
            </div>
            <div className="main-toy">
              <Playground
                key={`${selected}-${reset}`}
                id={selected}
                play={play}
                motion={motion}
              />
            </div>
          </div>
          <div className="play-footer">
            <span className="play-instruction">
              <Sparkles size={15} />
              {current.instruction}
            </span>
            <button
              className="reset-button"
              onClick={() => {
                setReset((r) => r + 1);
                feedback('switch', 0, sound, false);
              }}
            >
              <RotateCcw size={15} />
              Reset
            </button>
          </div>
        </section>
        <section className="collection" aria-label="Fidget collection">
          <div className="section-title">
            <div>
              <h2>
                Find your happy place<span>12 little escapes</span>
              </h2>
            </div>
            <button
              className="shuffle-button"
              onClick={() => {
                const others = fidgets.filter((f) => f.id !== selected);
                choose(
                  others[Math.floor(Math.random() * others.length)].id,
                  true,
                );
              }}
            >
              <Shuffle size={16} />
              <span>Surprise me</span>
            </button>
          </div>
          <fieldset className="filter-bar" aria-label="Filter fidgets">
            {[
              'All fidgets',
              'Tap',
              'Slide',
              'Motion',
              'Chill',
              'Favorites',
            ].map((f) => (
              <button
                key={f}
                className={filter === f ? 'active' : ''}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {f === 'Favorites' && <Heart size={13} />} {f}
              </button>
            ))}
          </fieldset>
          <div className="fidget-grid">
            {shown.map((f, index) => (
              <button
                key={f.id}
                className={`fidget-card ${selected === f.id ? 'selected' : ''}`}
                style={
                  {
                    '--toy-color': f.color,
                    '--card-index': index,
                  } as React.CSSProperties
                }
                onClick={() => choose(f.id, true)}
                aria-label={`Play ${f.name}`}
                aria-pressed={selected === f.id}
              >
                <div className="card-art" aria-hidden="true">
                  <Playground
                    id={f.id}
                    play={silentPreview}
                    motion={false}
                    miniature
                  />
                  {selected === f.id && (
                    <span className="playing-badge">
                      <i />
                      <i />
                      <i /> Playing
                    </span>
                  )}
                  <span className="card-arrow">
                    <ArrowUpRight size={17} />
                  </span>
                </div>
                <div className="card-info">
                  <h3>{f.name}</h3>
                  <span>
                    {f.category === 'Motion'
                      ? 'Tilt & shake'
                      : f.category === 'Slide'
                        ? 'Swipe & feel'
                        : f.category === 'Chill'
                          ? 'Slow it down'
                          : 'Tap & repeat'}
                  </span>
                </div>
              </button>
            ))}
          </div>
          {shown.length === 0 && (
            <div className="empty-state">
              <Heart size={25} />
              <h3>A place for your favorites.</h3>
              <p>Tap the heart on a fidget to save it here.</p>
            </div>
          )}
        </section>
        <div className="closing-note">
          <span>✳</span>
          <p>
            Sometimes, doing nothing
            <br />
            is a pretty good use of your time.
          </p>
        </div>
      </main>
      <footer className="site-footer">
        <span className="footer-brand">iFidget.</span>
        <span>Made for the joy of it.</span>
        <button onClick={openSettings}>
          <Smartphone size={14} /> Better in your hands{' '}
          <ChevronRight size={14} />
        </button>
      </footer>
      <dialog
        ref={dialog}
        className="settings-dialog"
        onCancel={() => setSettings(false)}
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">MAKE YOURSELF COMFORTABLE</span>
            <h2>Your kind of calm.</h2>
          </div>
          <button
            className="icon-button"
            autoFocus
            aria-label="Close settings"
            onClick={() => setSettings(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="setting-row">
          <div>
            <strong>Sound</strong>
            <p>Small clicks, soft pops, and little notes.</p>
          </div>
          <button
            role="switch"
            aria-checked={sound}
            aria-label="Sound"
            className={`setting-toggle ${sound ? 'on' : ''}`}
            onClick={() => {
              setSound(!sound);
              save({ sound: !sound });
            }}
          >
            <i />
          </button>
        </div>
        <div className="setting-row">
          <div>
            <strong>Vibration {canVibrate ? '' : 'unavailable'}</strong>
            <p>
              {canVibrate
                ? 'A little feedback with every touch.'
                : 'This browser doesn’t offer vibration. Enjoy sound and visual feedback instead.'}
            </p>
          </div>
          <button
            role="switch"
            disabled={!canVibrate}
            aria-checked={canVibrate && haptics}
            aria-label="Vibration"
            className={`setting-toggle ${canVibrate && haptics ? 'on' : ''}`}
            onClick={() => {
              setHaptics(!haptics);
              save({ haptics: !haptics });
            }}
          >
            <i />
          </button>
        </div>
        <div className="setting-row">
          <div>
            <strong>Tilt & shake</strong>
            <p aria-live="polite">{motionStatus}</p>
          </div>
          <button className="motion-button" onClick={enableMotion}>
            {motion ? 'Disable' : 'Enable'}
          </button>
        </div>
        <div className="home-tip">
          <Smartphone size={23} />
          <div>
            <strong>A little closer to hand.</strong>
            <p>
              On iPhone, open Safari’s Share menu and choose “Add to Home
              Screen”.
            </p>
          </div>
        </div>
        <div className="session-note">
          {count} little moments of joy this visit.
        </div>
      </dialog>
    </div>
  );
}
