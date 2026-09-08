import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pointerAngle, squishShape } from '../lib/gestures.ts';
import { angularDelta, snapToDetents } from '../lib/snaps.ts';

test('Squish rests as two exact semicircular arcs', () => {
  const shape = squishShape(0, 0);
  assert.equal(shape.tip, 109);
  assert.equal((shape.path.match(/ A /g) || []).length, 2);
  assert.ok(!shape.path.includes(' C '));
});

test('the opposite half remains the same circular arc in every drag direction', () => {
  const rear = 'M 0 -109 A 109 109 0 0 0 0 109';
  for (const [x, y] of [
    [180, 180],
    [-180, 180],
    [180, -180],
    [-180, -180],
    [250, 0],
    [0, 250],
  ]) {
    const shape = squishShape(x, y);
    assert.ok(shape.path.startsWith(rear));
    assert.equal(shape.radius, 109);
    assert.ok(
      Math.abs(shape.tip * Math.cos((shape.angle * Math.PI) / 180) - x) <
        0.000001,
    );
    assert.ok(
      Math.abs(shape.tip * Math.sin((shape.angle * Math.PI) / 180) - y) <
        0.000001,
    );
  }
});

test('hovering inside the circle cannot compress its opposite side', () => {
  assert.equal(squishShape(40, 40).tip, 109);
  assert.ok(!squishShape(40, 40).path.includes(' C '));
  assert.equal(squishShape(5000, 5000).tip, 329);
});

test('wheel uses pixel geometry instead of distorting angles on a rectangular surface', () => {
  assert.equal(pointerAngle(205, 215, 310, 330), 45);
  assert.equal(pointerAngle(155, 35, 310, 330), -90);
  assert.equal(pointerAngle(285, 165, 310, 330), 0);
  assert.equal(pointerAngle(155, 165, 310, 330), null);
});

test('wheel motion follows the pointer while only detent crossings emit clicks', () => {
  let raw = 0;
  let snapped = 0;
  let previous = 170;
  let clicks = 0;
  for (const next of [174, 179, -176, -171, -166]) {
    raw += angularDelta(previous, next);
    const result = snapToDetents(raw, snapped, 15);
    snapped = result.value;
    clicks += result.crossed.length;
    previous = next;
  }
  assert.equal(raw, 24);
  assert.equal(snapped, 30);
  assert.equal(clicks, 2);
  assert.equal(snapToDetents(raw, snapped, 15).crossed.length, 0);
});
