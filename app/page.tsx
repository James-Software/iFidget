'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Grid2X2,
  Heart,
  Moon,
  RotateCcw,
  Smartphone,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import Playground from '@/components/fidget-playground';
import { fidgets, type FidgetId } from '@/lib/fidgets';
import { feedback, prepareAudio, suspendAudio } from '@/lib/feedback';

const silentPreview = () => {};

export default function Home() {
  const [selected, setSelected] = useState<FidgetId>('dial');
  const [reset, setReset] = useState(0);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dark, setDark] = useState(false);
  const [sound, setSound] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [motion, setMotion] = useState(false);
  const [status, setStatus] = useState('');
  const [vibration, setVibration] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moreButton = useRef<HTMLButtonElement>(null);
  const current = fidgets.find((f) => f.id === selected)!;

  useEffect(() => {
    // Browser preferences hydrate after the server's white default render.
    // eslint-disable-next-line react/react-compiler
    setVibration(typeof navigator.vibrate === 'function');
    try {
      const saved = JSON.parse(localStorage.getItem('ifidget-prefs') || '{}');
      setSound(saved.sound !== false);
      setHaptics(saved.haptics !== false);
      setDark(saved.dark === true);
      setFavorites(
        Array.isArray(saved.favorites)
          ? saved.favorites.filter((id: unknown) => typeof id === 'string')
          : [],
      );
    } catch {
      /* Preferences are optional. */
    }
    const hidden = () => {
      if (document.hidden) suspendAudio();
    };
    document.addEventListener('visibilitychange', hidden);
    return () => {
      document.removeEventListener('visibilitychange', hidden);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', dark ? '#111111' : '#ffffff');
  }, [dark]);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  const play = useCallback(
    (kind: string, pitch = 0, delay = 0) =>
      feedback(kind, pitch, sound, haptics, delay),
    [sound, haptics],
  );
  function save(next: {
    sound?: boolean;
    dark?: boolean;
    haptics?: boolean;
    favorites?: string[];
  }) {
    try {
      localStorage.setItem(
        'ifidget-prefs',
        JSON.stringify({ sound, dark, haptics, favorites, ...next }),
      );
    } catch {
      /* Private browsing remains usable. */
    }
  }
  function close() {
    if (closing) return;
    setClosing(true);
    closeTimer.current = setTimeout(
      () => {
        setOpen(false);
        setClosing(false);
        moreButton.current?.focus();
      },
      matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180,
    );
  }
  function choose(id: FidgetId) {
    setSelected(id);
    setReset((r) => r + 1);
    close();
  }
  async function enableMotion() {
    if (motion) {
      setMotion(false);
      setStatus('Motion off. You can still drag and tap.');
      return;
    }
    if (!window.isSecureContext || !('DeviceMotionEvent' in window)) {
      setStatus('Motion is unavailable here. Drag or tap instead.');
      return;
    }
    prepareAudio();
    try {
      const sensor = DeviceMotionEvent as typeof DeviceMotionEvent & {
        requestPermission?: () => Promise<string>;
      };
      const permission = sensor.requestPermission
        ? await sensor.requestPermission()
        : 'granted';
      if (permission !== 'granted') {
        setStatus('Motion access declined. Drag or tap instead.');
        return;
      }
      setMotion(true);
      setStatus('Motion on. Tilt Gravity or shake Rain stick.');
    } catch {
      setStatus('Motion could not start. Drag or tap instead.');
    }
  }
  const shown = onlyFavorites
    ? fidgets.filter((f) => favorites.includes(f.id))
    : fidgets;
  return (
    <main className="minimal-app">
      <div className={`quiet-scene ${open ? 'is-blurred' : ''}`} inert={open}>
        <header className="desktop-brand">
          iFidget<span>Nothing to do. Something to feel.</span>
        </header>
        <section className="fidget-stage" aria-label={current.name}>
          <h1 className="sr-only">{current.name}</h1>
          <div key={`${selected}-${reset}`} className="fidget-reveal">
            <Playground
              id={selected}
              play={play}
              motion={motion}
              paused={open}
            />
          </div>
          <p className="desktop-instruction">{current.instruction}</p>
        </section>
        <div className="bottom-dock">
          <button
            ref={moreButton}
            className="more-button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
          >
            <Grid2X2 size={17} strokeWidth={1.7} />
            More Fidgets
          </button>
        </div>
      </div>
      <dialog
        ref={dialog}
        className={`fidget-sheet ${closing ? 'is-closing' : ''}`}
        aria-labelledby="picker-title"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
      >
        <div className="sheet-heading">
          <div>
            <h2 id="picker-title">
              More fidgets<span>12 ways to do nothing.</span>
            </h2>
          </div>
          <button
            className="round-button"
            aria-label="Close fidgets"
            onClick={close}
            autoFocus
          >
            <X size={20} />
          </button>
        </div>
        <div className="sheet-tools">
          <button
            className="round-button"
            aria-label={sound ? 'Mute sound' : 'Enable sound'}
            aria-pressed={sound}
            onClick={() => {
              setSound(!sound);
              save({ sound: !sound });
              if (!sound) prepareAudio();
            }}
          >
            {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
          <button
            className="round-button"
            aria-label={dark ? 'Use light appearance' : 'Use dark appearance'}
            aria-pressed={dark}
            onClick={() => {
              setDark(!dark);
              save({ dark: !dark });
            }}
          >
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <button
            className="round-button"
            aria-label="Reset current fidget"
            onClick={() => {
              setReset((r) => r + 1);
              close();
            }}
          >
            <RotateCcw size={18} />
          </button>
          <button
            className="round-button"
            aria-label={motion ? 'Disable motion' : 'Enable tilt and shake'}
            aria-pressed={motion}
            onClick={enableMotion}
          >
            <Smartphone size={19} />
          </button>
          <div className="tool-divider" />
          <button
            className="text-button"
            aria-pressed={onlyFavorites}
            onClick={() => setOnlyFavorites(!onlyFavorites)}
          >
            {onlyFavorites ? 'Show all' : 'Favorites'}
            <Heart size={14} fill={onlyFavorites ? 'currentColor' : 'none'} />
          </button>
        </div>
        {status && <output className="motion-status">{status}</output>}
        <div className="picker-grid">
          {shown.map((f) => (
            <div
              key={f.id}
              className={`picker-card ${selected === f.id ? 'selected' : ''}`}
            >
              <button
                className="pick-toy"
                onClick={() => choose(f.id)}
                aria-label={`Play ${f.name}`}
                aria-pressed={selected === f.id}
              >
                <div className="picker-art" aria-hidden="true">
                  <Playground
                    id={f.id}
                    play={silentPreview}
                    motion={false}
                    miniature
                  />
                </div>
                <span className="picker-name">
                  {f.name}
                  {selected === f.id ? (
                    <Check size={14} />
                  ) : (
                    <ArrowUpRight size={14} />
                  )}
                </span>
              </button>
              <button
                className="favorite-button"
                aria-label={`${favorites.includes(f.id) ? 'Unfavorite' : 'Favorite'} ${f.name}`}
                aria-pressed={favorites.includes(f.id)}
                onClick={() => {
                  const next = favorites.includes(f.id)
                    ? favorites.filter((id) => id !== f.id)
                    : [...favorites, f.id];
                  setFavorites(next);
                  save({ favorites: next });
                }}
              >
                <Heart
                  size={14}
                  fill={favorites.includes(f.id) ? 'currentColor' : 'none'}
                />
              </button>
            </div>
          ))}
        </div>
        {!shown.length && (
          <p className="empty-favorites">Tap a heart to keep a fidget here.</p>
        )}
        <div className="sheet-foot">
          <span>{current.name}</span>
          <span>{current.instruction}</span>
        </div>
        <details className="device-details">
          <summary>Device options</summary>
          <p>
            {vibration
              ? 'Vibration is available on this device.'
              : 'Vibration isn’t available in this browser. Sound and visual snaps still work.'}
          </p>
          {vibration && (
            <button
              className="text-button"
              aria-pressed={haptics}
              onClick={() => {
                setHaptics(!haptics);
                save({ haptics: !haptics });
              }}
            >
              {haptics ? 'Turn vibration off' : 'Turn vibration on'}
            </button>
          )}
          <p>On iPhone: Safari → Share → Add to Home Screen.</p>
        </details>
      </dialog>
    </main>
  );
}
