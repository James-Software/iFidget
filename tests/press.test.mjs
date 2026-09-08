import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pressHandlers } from '../lib/press.ts';

test('touch responds immediately and the following click does not double-toggle', () => {
  let pressed = false;
  const handlers = pressHandlers(() => {
    pressed = !pressed;
  });
  handlers.onPointerDown({ button: 0 });
  assert.equal(pressed, true);
  handlers.onClick({ detail: 1 });
  assert.equal(pressed, true);
  handlers.onPointerDown({ button: 0 });
  handlers.onClick({ detail: 1 });
  assert.equal(pressed, false);
});

test('keyboard and assistive clicks still activate once', () => {
  let activations = 0;
  const handlers = pressHandlers(() => {
    activations++;
  });
  handlers.onClick({ detail: 0 });
  assert.equal(activations, 1);
});

test('secondary mouse buttons do not activate the toy', () => {
  let activations = 0;
  const handlers = pressHandlers(() => {
    activations++;
  });
  handlers.onPointerDown({ button: 2 });
  handlers.onPointerDown({ button: 1 });
  assert.equal(activations, 0);
});
