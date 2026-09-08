/** A small dead band stops a resting finger chattering between adjacent notches. */
export function snapToDetents(
  raw: number,
  current: number,
  step: number,
  min = -Infinity,
  max = Infinity,
) {
  const crossed: number[] = [];
  let value = current;
  const target = Math.max(min, Math.min(max, raw));
  while (target - value >= step * 0.6 && value + step <= max) {
    value += step;
    crossed.push(value);
  }
  while (target - value <= -step * 0.6 && value - step >= min) {
    value -= step;
    crossed.push(value);
  }
  return { value, crossed };
}

export function angularDelta(from: number, to: number) {
  return ((to - from + 540) % 360) - 180;
}

/** Keep the marble inside its circular tray, reporting contact only at the rim. */
export function constrainMarble(x: number, y: number) {
  const distance = Math.hypot(x - 50, y - 50);
  const scale = distance > 40 ? 40 / distance : 1;
  return {
    x: 50 + (x - 50) * scale,
    y: 50 + (y - 50) * scale,
    contact: distance >= 40,
  };
}
