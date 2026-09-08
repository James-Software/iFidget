'use client';
import { memo, useEffect, useId, useRef, useState } from 'react';
import { angularDelta, constrainMarble, snapToDetents } from '@/lib/snaps';
import { pointerAngle, squishShape } from '@/lib/gestures';
import { prepareAudio } from '@/lib/feedback';
import { pressHandlers } from '@/lib/press';
import type { FidgetId } from '@/lib/fidgets';

type Props = {
  id: FidgetId;
  play: (kind: string, pitch?: number, delay?: number) => void;
  motion: boolean;
  miniature?: boolean;
  paused?: boolean;
};
function Playground({
  id,
  play,
  motion,
  miniature = false,
  paused = false,
}: Props) {
  const squishGradient = useId();
  const [pressed, setPressed] = useState<Set<number>>(new Set());
  const [value, setValue] = useState(id === 'zip' ? 40 : 0);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [held, setHeld] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [reach, setReach] = useState({ x: 0, y: 0 });
  const shape = squishShape(paused ? 0 : reach.x, paused ? 0 : reach.y);
  const [ripples, setRipples] = useState<
    { x: number; y: number; id: number }[]
  >([]);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState('Breathe in');
  const surface = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const active = useRef<number | null>(null);
  const previousAngle = useRef<number | null>(null);
  const raw = useRef(id === 'zip' ? 40 : 0);
  const snapped = useRef(id === 'zip' ? 40 : 0);
  const grab = useRef({ x: 50, y: 50 });
  const contact = useRef(false);
  const shakeArmed = useRef(true);
  const rippleId = useRef(0);
  const playRef = useRef(play);
  useEffect(() => {
    playRef.current = play;
  }, [play]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (!running || paused || id !== 'breath') return;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setPhase(step % 2 ? 'Breathe out' : 'Breathe in');
    }, 4000);
    return () => clearInterval(timer);
  }, [running, paused, id]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) {
        setRunning(false);
        active.current = null;
        setHeld(false);
        setReach({ x: 0, y: 0 });
      }
    };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, []);
  useEffect(() => {
    if (!motion || paused || miniature || !['marble', 'rain'].includes(id))
      return;
    const move = (event: DeviceMotionEvent) => {
      if (document.hidden || active.current !== null) return;
      if (id === 'marble') {
        const g = event.accelerationIncludingGravity;
        if (g?.x == null || g?.y == null) return;
        const next = constrainMarble(50 + g.x * 7, 50 - g.y * 7);
        if (next.contact && !contact.current) playRef.current('marble');
        contact.current = next.contact;
        setPosition(next);
      } else {
        const a = event.acceleration;
        const force = Math.hypot(a?.x || 0, a?.y || 0, a?.z || 0);
        if (force < 3) shakeArmed.current = true;
        if (force > 8 && shakeArmed.current) {
          shakeArmed.current = false;
          setValue((v) => v + 1);
          playRef.current('rain');
        }
      }
    };
    window.addEventListener('devicemotion', move);
    return () => window.removeEventListener('devicemotion', move);
  }, [id, motion, miniature, paused]);
  useEffect(() => {
    if (id !== 'spring' || miniature || paused) return;
    const hover = (event: PointerEvent) => {
      if (
        event.pointerType !== 'mouse' ||
        active.current !== null ||
        document.hidden
      )
        return;
      const rect = surface.current?.getBoundingClientRect();
      if (rect)
        setReach({
          x: event.clientX - rect.left - rect.width / 2,
          y: event.clientY - rect.top - rect.height / 2,
        });
    };
    const leave = (event: PointerEvent) => {
      if (event.relatedTarget === null && active.current === null)
        setReach({ x: 0, y: 0 });
    };
    window.addEventListener('pointermove', hover);
    window.addEventListener('pointerout', leave);
    return () => {
      window.removeEventListener('pointermove', hover);
      window.removeEventListener('pointerout', leave);
    };
  }, [id, miniature, paused]);
  function reachTo(event: React.PointerEvent) {
    const rect = surface.current!.getBoundingClientRect();
    setReach({
      x: event.clientX - rect.left - rect.width / 2,
      y: event.clientY - rect.top - rect.height / 2,
    });
  }
  function later(action: () => void, duration: number) {
    const timer = setTimeout(() => {
      action();
      timers.current = timers.current.filter((t) => t !== timer);
    }, duration);
    timers.current.push(timer);
  }
  function toggle(index: number) {
    if (miniature || paused) return;
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
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    };
  }
  function angleAt(event: React.PointerEvent) {
    const rect = surface.current!.getBoundingClientRect();
    return pointerAngle(
      event.clientX - rect.left,
      event.clientY - rect.top,
      rect.width,
      rect.height,
    );
  }
  function snap(target: number) {
    const step = id === 'zip' ? 5 : id === 'spinner' ? 30 : 15;
    const next = snapToDetents(
      target,
      snapped.current,
      step,
      id === 'zip' ? 10 : -Infinity,
      id === 'zip' ? 80 : Infinity,
    );
    if (!next.crossed.length) return;
    snapped.current = next.value;
    setValue(next.value);
    next.crossed.forEach((notch, i) => play(id, notch / step, i * 0.008));
  }
  function roll(p: { x: number; y: number }) {
    const next = constrainMarble(p.x, p.y);
    if (next.contact && !contact.current) play('marble');
    contact.current = next.contact;
    setPosition(next);
  }
  function ripple(p: { x: number; y: number }) {
    const stamp = ++rippleId.current;
    setRipples((r) => [...r.slice(-9), { ...p, id: stamp }]);
    later(() => setRipples((r) => r.filter((r) => r.id !== stamp)), 1500);
    play('ripple');
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
  function down(event: React.PointerEvent<HTMLDivElement>) {
    if (
      !interactive ||
      miniature ||
      paused ||
      event.button !== 0 ||
      active.current !== null
    )
      return;
    event.currentTarget.setPointerCapture(event.pointerId);
    active.current = event.pointerId;
    setHeld(true);
    prepareAudio(); // Unlock without making a sound; contact alone is not a snap.
    const p = point(event);
    grab.current = p;
    raw.current = snapped.current;
    previousAngle.current = angleAt(event);
    if (id === 'dial') setRotation(snapped.current);
    if (id === 'spring') reachTo(event);
    if (id === 'marble') roll(p);
    if (id === 'ripple') ripple(p);
    if (id === 'rain') {
      setValue((v) => v + 1);
      play('rain');
    }
  }
  function move(event: React.PointerEvent<HTMLDivElement>) {
    if (active.current !== event.pointerId || paused) return;
    const p = point(event);
    if (id === 'dial' || id === 'spinner') {
      const next = angleAt(event);
      if (next !== null && previousAngle.current !== null) {
        raw.current += angularDelta(previousAngle.current, next);
        if (id === 'dial') setRotation(raw.current);
        snap(raw.current);
      }
      previousAngle.current = next;
    }
    if (id === 'zip') {
      raw.current = Math.max(
        10,
        Math.min(80, raw.current + p.y - grab.current.y),
      );
      grab.current = p;
      snap(raw.current);
    }
    if (id === 'marble') roll(p);
    if (id === 'spring') reachTo(event);
    if (
      id === 'rain' &&
      Math.hypot(p.x - grab.current.x, p.y - grab.current.y) > 18
    ) {
      grab.current = p;
      setValue((v) => v + 1);
      play('rain');
    }
  }
  function release(event: React.PointerEvent<HTMLDivElement>) {
    if (active.current !== event.pointerId) return;
    active.current = null;
    setHeld(false);
    if (id === 'spring') setReach({ x: 0, y: 0 });
    if (id === 'spring' && event.type === 'pointerup' && !paused)
      play('spring');
  }
  function keyboard(event: React.KeyboardEvent) {
    if (
      !interactive ||
      miniature ||
      paused ||
      ![
        ' ',
        'Enter',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
      ].includes(event.key)
    )
      return;
    event.preventDefault();
    if (event.repeat) return;
    const direction = ['ArrowLeft', 'ArrowDown'].includes(event.key) ? -1 : 1;
    if (['dial', 'spinner', 'zip'].includes(id)) {
      const step = id === 'zip' ? 5 : id === 'dial' ? 15 : 30;
      snap(snapped.current + direction * step);
    } else if (id === 'marble') {
      roll({
        x:
          position.x +
          (event.key === 'ArrowLeft'
            ? -10
            : event.key === 'ArrowRight'
              ? 10
              : 0),
        y: position.y + (event.key === 'ArrowUp' ? -10 : 10),
      });
    } else if (id === 'ripple') ripple({ x: 50, y: 50 });
    else if (id === 'rain') {
      setValue((v) => v + 1);
      play('rain');
    } else if (id === 'spring') {
      setReach({ x: 0, y: -120 });
      setHeld(true);
      later(() => {
        setHeld(false);
        setReach({ x: 0, y: 0 });
        play('spring');
      }, 150);
    }
  }
  const ToyButton = miniature ? 'span' : 'button';
  // This container becomes a keyboard-operable button only for continuous gesture toys.
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={surface}
      className={`toy toy-${id} ${held ? 'held' : ''} ${running && !paused ? 'running' : ''} ${miniature ? 'miniature' : ''}`}
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
      onKeyDown={keyboard}
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
          <div className="wheel-ticks">
            {Array.from({ length: 24 }, (_, i) => (
              <i
                key={i}
                style={{ transform: `rotate(${i * 15}deg) translateY(-141px)` }}
              />
            ))}
          </div>
          <div
            className="wheel-inner"
            style={{ transform: `rotate(${held ? rotation : value}deg)` }}
          >
            <i />
          </div>
          <span>
            {String((((Math.round(value / 15) % 24) + 24) % 24) + 1).padStart(
              2,
              '0',
            )}
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
          <div className="zip-pull" style={{ top: `${value}%` }}>
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
        <svg className="squish" viewBox="-109 -109 218 218" aria-hidden="true">
          <defs>
            <radialGradient
              id={squishGradient}
              gradientUnits="userSpaceOnUse"
              cx="-40"
              cy="-55"
              r="260"
            >
              <stop offset="0" stopColor="#dedede" />
              <stop offset=".6" stopColor="#b2b2b2" />
              <stop offset="1" stopColor="#888888" />
            </radialGradient>
          </defs>
          <path
            d={shape.path}
            transform={`rotate(${shape.angle})`}
            fill={`url(#${squishGradient})`}
          />
          <ellipse cx="-17" cy="-4" rx="4" ry="6.5" fill="#505050" />
          <ellipse cx="17" cy="-4" rx="4" ry="6.5" fill="#505050" />
          <path
            d="M -12 8 Q 0 19 12 8"
            fill="none"
            stroke="#505050"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  );
}

export default memo(Playground);
