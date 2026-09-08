'use client';
import { memo, useEffect, useRef, useState } from 'react';
import { pressHandlers } from '@/lib/press';
import type { FidgetId } from '@/lib/fidgets';

type Props = {
  id: FidgetId;
  play: (kind: string, pitch?: number) => void;
  motion: boolean;
  miniature?: boolean;
};
function Playground({ id, play, motion, miniature = false }: Props) {
  const [pressed, setPressed] = useState<Set<number>>(new Set());
  const [value, setValue] = useState(0);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [held, setHeld] = useState(false);
  const [ripples, setRipples] = useState<
    { x: number; y: number; id: number }[]
  >([]);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState('Breathe in');
  const surface = useRef<HTMLDivElement>(null);
  const last = useRef(0);
  const angle = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const active = useRef(false);
  const playRef = useRef(play);
  useEffect(() => {
    playRef.current = play;
  }, [play]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (!running || id !== 'breath') return;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setPhase(step % 2 ? 'Breathe out' : 'Breathe in');
      playRef.current('breath', step % 2 ? 0 : 4);
    }, 4000);
    return () => clearInterval(timer);
  }, [running, id]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) {
        setRunning(false);
        active.current = false;
        setHeld(false);
      }
    };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, []);
  useEffect(() => {
    if (!motion || miniature || !['marble', 'rain'].includes(id)) return;
    const move = (event: DeviceMotionEvent) => {
      if (document.hidden) return;
      const g = event.accelerationIncludingGravity;
      if (!g || g.x == null || g.y == null) return;
      if (id === 'marble')
        setPosition({
          x: Math.max(10, Math.min(90, 50 + g.x * 7)),
          y: Math.max(10, Math.min(90, 50 - g.y * 7)),
        });
      const a = event.acceleration;
      if (
        id === 'rain' &&
        a &&
        Math.hypot(a.x || 0, a.y || 0, a.z || 0) > 8 &&
        Date.now() - last.current > 140
      ) {
        last.current = Date.now();
        setValue((v) => v + 1);
        playRef.current('rain', Math.floor(Math.random() * 8));
      }
    };
    window.addEventListener('devicemotion', move);
    return () => window.removeEventListener('devicemotion', move);
  }, [id, motion, miniature]);
  function toggle(index: number) {
    if (miniature) return;
    setPressed((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
    play(id, index);
  }
  function point(event: React.PointerEvent) {
    const rect = surface.current!.getBoundingClientRect();
    return {
      x: Math.max(
        5,
        Math.min(95, ((event.clientX - rect.left) / rect.width) * 100),
      ),
      y: Math.max(
        5,
        Math.min(95, ((event.clientY - rect.top) / rect.height) * 100),
      ),
    };
  }
  function down(event: React.PointerEvent<HTMLDivElement>) {
    if (
      miniature ||
      ![
        'dial',
        'marble',
        'ripple',
        'spinner',
        'zip',
        'spring',
        'rain',
      ].includes(id)
    )
      return;
    event.currentTarget.setPointerCapture(event.pointerId);
    active.current = true;
    setHeld(true);
    const p = point(event);
    setPosition(p);
    play(id);
    if (id === 'dial')
      angle.current = (Math.atan2(p.y - 50, p.x - 50) * 180) / Math.PI;
    if (id === 'ripple') {
      const stamp = Date.now();
      setRipples((r) => [...r.slice(-9), { ...p, id: stamp }]);
      const timer = setTimeout(() => {
        setRipples((r) => r.filter((r) => r.id !== stamp));
        timers.current = timers.current.filter((t) => t !== timer);
      }, 1800);
      timers.current.push(timer);
    }
    if (id === 'spinner') setValue((v) => v + 720);
    if (id === 'rain') setValue((v) => v + 1);
    if (id === 'zip') setValue(p.y);
  }
  function move(event: React.PointerEvent<HTMLDivElement>) {
    if (!active.current) return;
    const p = point(event);
    setPosition(p);
    if (id === 'dial') {
      const next = (Math.atan2(p.y - 50, p.x - 50) * 180) / Math.PI;
      let delta = next - angle.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      setValue((v) => v + delta);
      angle.current = next;
    }
    if (id === 'zip') setValue(p.y);
    if (id === 'spinner') setValue((v) => v + 28);
    if (Date.now() - last.current > 40 && id !== 'ripple') {
      last.current = Date.now();
      play(id, Math.floor(p.y));
    }
  }
  function release() {
    active.current = false;
    setHeld(false);
  }
  const interactive = [
    'dial',
    'marble',
    'ripple',
    'spinner',
    'zip',
    'spring',
    'rain',
  ].includes(id);
  const ToyButton = miniature ? 'span' : 'button';
  // This container becomes a keyboard-operable button only for continuous gesture toys.
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={surface}
      className={`toy toy-${id} ${held ? 'held' : ''} ${running ? 'running' : ''} ${miniature ? 'miniature' : ''}`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      role={interactive && !miniature ? 'button' : undefined}
      tabIndex={interactive && !miniature ? 0 : undefined}
      aria-label={
        interactive
          ? `${id} fidget. Use arrow keys or space to play.`
          : undefined
      }
      onKeyDown={(e) => {
        if (
          !interactive ||
          miniature ||
          ![
            ' ',
            'Enter',
            'ArrowUp',
            'ArrowDown',
            'ArrowLeft',
            'ArrowRight',
          ].includes(e.key)
        )
          return;
        e.preventDefault();
        play(id, value);
        setValue((v) =>
          id === 'zip'
            ? Math.max(5, Math.min(95, v + (e.key === 'ArrowUp' ? -10 : 10)))
            : v + 90,
        );
        setPosition((p) => ({
          x: Math.max(
            10,
            Math.min(
              90,
              p.x +
                (e.key === 'ArrowLeft' ? -10 : e.key === 'ArrowRight' ? 10 : 0),
            ),
          ),
          y: Math.max(10, Math.min(90, p.y + (e.key === 'ArrowUp' ? -10 : 10))),
        }));
        if (id === 'ripple') {
          const stamp = Date.now();
          setRipples((r) => [...r.slice(-5), { x: 50, y: 50, id: stamp }]);
        }
        if (id === 'spring') {
          setHeld(true);
          const timer = setTimeout(() => {
            setHeld(false);
            timers.current = timers.current.filter((t) => t !== timer);
          }, 180);
          timers.current.push(timer);
        }
      }}
    >
      {(id === 'pop' || id === 'bubble') && (
        <div className={`pop-board ${id === 'bubble' ? 'wrap' : ''}`}>
          {Array.from({ length: id === 'pop' ? 16 : 25 }, (_, i) => (
            <ToyButton
              key={i}
              tabIndex={miniature ? -1 : 0}
              className={`pop-bubble ${pressed.has(i) ? 'popped' : ''}`}
              aria-label={`Bubble ${i + 1}`}
              aria-pressed={pressed.has(i)}
              {...pressHandlers(() => toggle(i))}
            />
          ))}
        </div>
      )}
      {id === 'switch' && (
        <div className="switch-board">
          {Array.from({ length: 6 }, (_, i) => (
            <ToyButton
              key={i}
              tabIndex={miniature ? -1 : 0}
              className={`toy-switch ${pressed.has(i) ? 'on' : ''}`}
              role="switch"
              aria-checked={pressed.has(i)}
              aria-label={`Switch ${i + 1}`}
              {...pressHandlers(() => toggle(i))}
            >
              <i />
            </ToyButton>
          ))}
        </div>
      )}
      {id === 'dial' && (
        <div className="wheel">
          <div
            className="wheel-inner"
            style={{ transform: `rotate(${value}deg)` }}
          >
            <i />
          </div>
          <span>
            {String(Math.abs(Math.round(value / 15))).padStart(3, '0')}
          </span>
        </div>
      )}
      {id === 'marble' && (
        <div className="marble-tray">
          <div className="orbit-line" />
          <div className="orbit-line small" />
          <div
            className="marble"
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
          />
          <span>LET GRAVITY PLAY</span>
        </div>
      )}
      {id === 'keys' && (
        <div className="key-board">
          {['C', 'D', 'E', 'G', 'A', 'C′', 'D′', 'E′', 'G′'].map((key, i) => (
            <ToyButton
              key={key}
              tabIndex={miniature ? -1 : 0}
              {...pressHandlers(() => play(id, i))}
              className="key-cap"
            >
              {key}
              <span>{['do', 're', 'mi', 'sol', 'la'][i % 5]}</span>
            </ToyButton>
          ))}
        </div>
      )}
      {id === 'ripple' && (
        <div className="water">
          <div className="water-glow" />
          {miniature && <i className="sample-ripple" />}
          {ripples.map((r) => (
            <i
              key={r.id}
              className="ripple"
              style={{ left: `${r.x}%`, top: `${r.y}%` }}
            />
          ))}
        </div>
      )}
      {id === 'spinner' && (
        <div className="spinner" style={{ transform: `rotate(${value}deg)` }}>
          {[0, 120, 240].map((a) => (
            <i
              key={a}
              style={{ transform: `rotate(${a}deg) translateY(-46px)` }}
            />
          ))}
          <b />
        </div>
      )}
      {id === 'zip' && (
        <div className="zipper">
          <div className="zip-teeth" />
          <div
            className="zip-pull"
            style={{ top: `${Math.max(5, Math.min(82, value || 40))}%` }}
          >
            <i />
          </div>
        </div>
      )}
      {id === 'breath' && (
        <ToyButton
          tabIndex={miniature ? -1 : 0}
          className="breath-orb"
          {...pressHandlers(() => {
            setPhase('Breathe in');
            setRunning((r) => !r);
            play(id, 4);
          })}
          aria-label={running ? 'Pause breathing' : 'Start breathing'}
        >
          <span>{miniature ? '' : running ? phase : 'Take a breath'}</span>
          <small>
            {miniature ? '' : running ? 'Tap to pause' : 'Tap to begin'}
          </small>
        </ToyButton>
      )}
      {id === 'rain' && (
        <div className="rain-stick">
          {Array.from({ length: 28 }, (_, i) => (
            <i
              key={i}
              style={{
                left: `${10 + ((i * 19) % 80)}%`,
                top: `${12 + ((i * 31 + value * 23) % 76)}%`,
                transitionDelay: `${i * 2}ms`,
              }}
            />
          ))}
        </div>
      )}
      {id === 'spring' && (
        <div
          className="squish"
          style={{
            transform: held
              ? `scale(1.2,.76) rotate(${(position.x - 50) / 3}deg)`
              : 'scale(1)',
          }}
        >
          <i />
          <i />
          <span>⌣</span>
        </div>
      )}
    </div>
  );
}

export default memo(Playground);
