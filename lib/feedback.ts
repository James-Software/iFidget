let context: AudioContext | undefined;
export function prepareAudio() {
  try {
    context ??= new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    )({ latencyHint: 'interactive' });
    if (context.state === 'suspended') void context.resume().catch(() => {});
  } catch {
    /* Audio support is optional. */
  }
}
export function feedback(
  kind: string,
  pitch = 0,
  sound = true,
  haptics = true,
  delay = 0,
) {
  if (typeof document === 'undefined' || document.hidden) return;
  if (haptics && typeof navigator.vibrate === 'function')
    navigator.vibrate(kind === 'pop' ? [8, 12, 5] : 7);
  if (!sound) return;
  try {
    prepareAudio();
    if (!context) return;
    const now = context.currentTime + delay;
    const osc = context.createOscillator();
    const gain = context.createGain();
    const click = ['dial', 'zip', 'spinner', 'switch'].includes(kind);
    const musical = ['keys', 'ripple', 'breath'].includes(kind);
    const frequency = musical
      ? 220 *
        Math.pow(2, [0, 2, 4, 7, 9, 12, 14, 16, 19][Math.abs(pitch) % 9] / 12)
      : click
        ? 1050
        : kind === 'pop'
          ? 340
          : 130 + Math.abs(pitch % 8) * 40;
    osc.type = musical ? 'sine' : click ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(frequency, now);
    if (!musical)
      osc.frequency.exponentialRampToValueAtTime(
        55,
        now + (click ? 0.018 : 0.065),
      );
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(
      musical ? 0.12 : 0.22,
      now + (click ? 0.001 : 0.004),
    );
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      now + (musical ? 0.65 : click ? 0.025 : 0.09),
    );
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(now);
    osc.stop(now + (musical ? 0.7 : click ? 0.03 : 0.12));
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  } catch {
    /* Sound is optional if the browser blocks audio. */
  }
}
export function suspendAudio() {
  if (context?.state === 'running') void context.suspend();
}
