import type { MouseEvent, PointerEvent } from 'react';

/** Respond on contact; the following click must not play a second time. */
export function pressHandlers(activate: () => void) {
  return {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      if (event.button === 0) activate();
    },
    onClick(event: MouseEvent<HTMLElement>) {
      // Keyboard and assistive-technology activation has no pointer click count.
      if (event.detail === 0) activate();
    },
  };
}
