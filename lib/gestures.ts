/** Angle in actual screen pixels so non-square touch surfaces don't distort rotation. */
export function pointerAngle(
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const dx = x - width / 2;
  const dy = y - height / 2;
  return Math.hypot(dx, dy) < 24 ? null : (Math.atan2(dy, dx) * 180) / Math.PI;
}

/** The back semicircle is an exact arc. Only the pointer-facing half deforms. */
export function squishShape(dx: number, dy: number) {
  const radius = 109;
  const distance = Math.hypot(dx, dy);
  const tip = Math.max(radius, Math.min(distance, radius + 220));
  const angle = distance ? (Math.atan2(dy, dx) * 180) / Math.PI : 0;
  const handle = radius * 0.5522847498;
  const path =
    tip === radius
      ? `M 0 ${-radius} A ${radius} ${radius} 0 0 0 0 ${radius} A ${radius} ${radius} 0 0 0 0 ${-radius} Z`
      : `M 0 ${-radius} A ${radius} ${radius} 0 0 0 0 ${radius} C ${handle} ${radius} ${tip} ${handle} ${tip} 0 C ${tip} ${-handle} ${handle} ${-radius} 0 ${-radius} Z`;
  return { path, angle, tip, radius };
}
