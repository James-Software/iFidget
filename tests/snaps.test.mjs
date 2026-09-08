import { test } from 'node:test';
import assert from 'node:assert/strict';
import { angularDelta, constrainMarble, snapToDetents } from '../lib/snaps.ts';

test('stationary hold and movement inside a notch produce no click events', () => {
  for (const raw of [0, 0, 1, -1, 5, 8.9, 0]) {
    assert.deepEqual(snapToDetents(raw, 0, 15), { value: 0, crossed: [] });
  }
});

test('one threshold crossing produces one fixed snap, not repeated ticks', () => {
  assert.deepEqual(snapToDetents(9, 0, 15), { value: 15, crossed: [15] });
  for (const raw of [9, 9.2, 8.8, 10, 15, 20, 23.9]) {
    assert.deepEqual(snapToDetents(raw, 15, 15), { value: 15, crossed: [] });
  }
});

test('reversing deliberately snaps back while jitter does not chatter', () => {
  assert.deepEqual(snapToDetents(6.1, 15, 15).crossed, []);
  assert.deepEqual(snapToDetents(6, 15, 15), { value: 0, crossed: [0] });
});

test('fast movement reports every crossed notch in order in either direction', () => {
  assert.deepEqual(snapToDetents(48, 0, 15), {
    value: 45,
    crossed: [15, 30, 45],
  });
  assert.deepEqual(snapToDetents(-48, 0, 15), {
    value: -45,
    crossed: [-15, -30, -45],
  });
});

test('angular wraparound crosses the seam without jumping a full revolution', () => {
  assert.equal(angularDelta(179, -179), 2);
  assert.equal(angularDelta(-179, 179), -2);
  assert.equal(angularDelta(90, 90), 0);
});

test('zipper endpoints do not emit clicks when pushed farther past the stop', () => {
  assert.deepEqual(snapToDetents(200, 80, 5, 10, 80), {
    value: 80,
    crossed: [],
  });
  assert.deepEqual(snapToDetents(-200, 10, 5, 10, 80), {
    value: 10,
    crossed: [],
  });
  assert.deepEqual(snapToDetents(43, 40, 5, 10, 80), {
    value: 45,
    crossed: [45],
  });
});

test('a full wheel revolution has exactly 24 snaps even with redundant pointer events', () => {
  let value = 0;
  let count = 0;
  for (let raw = 0; raw <= 360; raw += 0.25) {
    const next = snapToDetents(raw, value, 15);
    count += next.crossed.length;
    value = next.value;
    assert.equal(snapToDetents(raw, value, 15).crossed.length, 0);
  }
  assert.equal(count, 24);
  assert.equal(value, 360);
});

test('marble stays in its circular tray, including diagonal drags', () => {
  assert.deepEqual(constrainMarble(50, 50), { x: 50, y: 50, contact: false });
  const edge = constrainMarble(100, 100);
  assert.equal(edge.contact, true);
  assert.ok(Math.abs(Math.hypot(edge.x - 50, edge.y - 50) - 40) < 0.00001);
});
