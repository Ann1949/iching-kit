import assert from "node:assert/strict";
import test from "node:test";

import {
  HEXAGRAMS,
  TRIGRAMS,
  cast,
  castCoins,
  divine,
  getHexagram,
  getHexagramByLines,
  getTrigram,
  getTrigramByLines,
  read,
  relations,
} from "../dist/index.js";

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test("dataset has the 64 hexagrams and 8 trigrams", () => {
  assert.equal(HEXAGRAMS.length, 64);
  assert.equal(TRIGRAMS.length, 8);

  const ids = HEXAGRAMS.map((h) => h.id);
  assert.deepEqual(ids, Array.from({ length: 64 }, (_, i) => i + 1));

  const binaries = new Set(HEXAGRAMS.map((h) => h.binary));
  assert.equal(binaries.size, 64, "every hexagram has a unique binary form");

  for (const h of HEXAGRAMS) {
    assert.equal(h.lines.length, 6, `hexagram ${h.id} has six lines`);
    assert.equal(h.yaoCi.length, 6, `hexagram ${h.id} has six line texts`);
    assert.equal(h.binary, h.lines.join(""));
    assert.ok(h.guaCi.length > 0);
  }

  assert.equal(getHexagram(1).pinyin, "Qian");
  assert.equal(getHexagram(2).name, "坤为地");
  assert.throws(() => getHexagram(65), RangeError);
});

test("trigrams resolve by lines and by number", () => {
  assert.equal(getTrigramByLines([1, 1, 1]).name, "乾");
  assert.equal(getTrigramByLines([0, 0, 0]).name, "坤");
  assert.equal(getTrigram(6).english, "Water");
  assert.throws(() => getTrigram(9), RangeError);
  assert.throws(() => getTrigramByLines([1, 1]), RangeError);
});

test("line order is bottom-up", () => {
  // 泰 (11) is Earth over Heaven: lower 乾 (111), upper 坤 (000).
  assert.equal(getHexagram(11).binary, "111000");
  // 既济 (63) is Water over Fire: lower 离 (101), upper 坎 (010).
  assert.equal(getHexagram(63).binary, "101010");
});

test("cast validates its input", () => {
  assert.throws(() => cast([7, 7, 7]), RangeError);
  assert.throws(() => cast([7, 7, 7, 7, 7, 5]), RangeError);
  assert.throws(() => cast([7, 7, 7, 7, 7, 7.5]), RangeError);
});

test("six stable yang lines are Qian with nothing moving", () => {
  const result = cast([7, 7, 7, 7, 7, 7]);
  assert.equal(result.primary.id, 1);
  assert.equal(result.changed.id, 1);
  assert.deepEqual(result.moving, []);

  const reading = read(result);
  assert.equal(reading.movingCount, 0);
  assert.equal(reading.source, "primary");
  assert.equal(reading.texts.length, 1);
  assert.equal(reading.texts[0].type, "guaCi");
  assert.equal(reading.texts[0].text, result.primary.guaCi);
});

test("six stable yin lines are Kun", () => {
  const result = cast([8, 8, 8, 8, 8, 8]);
  assert.equal(result.primary.id, 2);
  assert.equal(result.changed.id, 2);
  assert.deepEqual(result.moving, []);
});

test("all moving yang is Qian using the Using Nine text", () => {
  const result = cast([9, 9, 9, 9, 9, 9]);
  assert.equal(result.primary.id, 1);
  assert.equal(result.changed.id, 2);

  const reading = read(result);
  assert.equal(reading.special, "yong9");
  assert.equal(reading.texts[0].type, "yong");
  assert.equal(reading.texts[0].text, result.primary.yong);
});

test("all moving yin is Kun using the Using Six text", () => {
  const result = cast([6, 6, 6, 6, 6, 6]);
  assert.equal(result.primary.id, 2);
  assert.equal(result.changed.id, 1);
  assert.equal(read(result).special, "yong6");
});

test("one moving line reads that line of the primary hexagram", () => {
  const result = cast([7, 8, 7, 7, 7, 9]); // line 6 moving
  assert.deepEqual(result.moving, [5]);
  const reading = read(result);
  assert.equal(reading.source, "primary");
  assert.deepEqual(reading.lineNumbers, [6]);
  assert.equal(reading.texts[0].line, 6);
  assert.equal(reading.texts[0].text, result.primary.yaoCi[5]);
});

test("two moving lines read both, the upper one leading", () => {
  const result = cast([7, 9, 8, 7, 6, 7]); // lines 2 and 5 moving
  assert.deepEqual(result.moving, [1, 4]);
  const reading = read(result);
  assert.equal(reading.source, "primary");
  assert.deepEqual(reading.lineNumbers, [5, 2]);
  assert.deepEqual(
    reading.texts.map((t) => t.line),
    [5, 2],
  );
});

test("three moving lines read both judgments, weighted to the primary", () => {
  const result = cast([6, 6, 7, 9, 7, 8]); // lines 1, 2, 4 moving
  assert.equal(result.moving.length, 3);
  const reading = read(result);
  assert.equal(reading.source, "both");
  assert.equal(reading.primaryWeight, 0.7);
  assert.equal(reading.texts.length, 2);
  assert.equal(reading.texts[1].text, result.changed.guaCi);
});

test("four moving lines read the two unchanged lines of the changed hexagram", () => {
  const result = cast([6, 6, 9, 9, 7, 8]); // lines 1–4 moving, 5–6 still
  assert.equal(result.moving.length, 4);
  const reading = read(result);
  assert.equal(reading.source, "changed");
  assert.deepEqual(reading.lineNumbers, [5, 6]);
  assert.equal(reading.texts[0].text, result.changed.yaoCi[4]);
});

test("five moving lines read the one unchanged line of the changed hexagram", () => {
  const result = cast([6, 6, 9, 9, 6, 7]); // line 6 still
  assert.equal(result.moving.length, 5);
  const reading = read(result);
  assert.equal(reading.source, "changed");
  assert.deepEqual(reading.lineNumbers, [6]);
});

test("six moving lines on anything but Qian/Kun read the changed judgment", () => {
  const result = cast([9, 6, 9, 6, 9, 6]); // 既济 → 未济
  assert.equal(result.primary.id, 63);
  assert.equal(result.changed.id, 64);
  const reading = read(result);
  assert.equal(reading.special, undefined);
  assert.equal(reading.source, "changed");
  assert.equal(reading.texts[0].text, result.changed.guaCi);
});

test("structural relations", () => {
  const qian = getHexagram(1);
  assert.equal(relations(qian).nuclear.id, 1);
  assert.equal(relations(qian).opposite.id, 2);
  assert.equal(relations(qian).inverse.id, 1);

  const kun = getHexagram(2);
  assert.equal(relations(kun).nuclear.id, 2);
  assert.equal(relations(kun).opposite.id, 1);

  // 既济 and 未济 are each other's inverse.
  assert.equal(relations(getHexagram(63)).inverse.id, 64);
  assert.equal(relations(getHexagram(64)).inverse.id, 63);

  // The inverse of a hexagram is always a valid hexagram.
  for (const h of HEXAGRAMS) {
    const r = relations(h);
    assert.ok(r.nuclear.id >= 1 && r.nuclear.id <= 64);
    assert.ok(r.opposite.id >= 1 && r.opposite.id <= 64);
    assert.ok(r.inverse.id >= 1 && r.inverse.id <= 64);
  }
});

test("coin casting follows the 1/8, 3/8, 3/8, 1/8 distribution", () => {
  const random = mulberry32(20261114);
  const counts = { 6: 0, 7: 0, 8: 0, 9: 0 };
  const rounds = 40000;

  for (let i = 0; i < rounds; i++) {
    for (const value of castCoins(random).values) counts[value] += 1;
  }

  const total = rounds * 6;
  const expected = { 6: 1 / 8, 7: 3 / 8, 8: 3 / 8, 9: 1 / 8 };
  for (const value of [6, 7, 8, 9]) {
    const actual = counts[value] / total;
    assert.ok(
      Math.abs(actual - expected[value]) < 0.01,
      `value ${value}: expected ~${expected[value]}, got ${actual.toFixed(4)}`,
    );
  }
});

test("casting is reproducible with a seeded random", () => {
  const a = castCoins(mulberry32(42));
  const b = castCoins(mulberry32(42));
  assert.deepEqual(a.values, b.values);
  assert.equal(a.primary.id, b.primary.id);
});

test("divine returns a cast plus its reading", () => {
  const result = divine(mulberry32(7));
  assert.equal(result.reading.movingCount, result.moving.length);
  assert.ok(result.reading.texts.length > 0);
  assert.ok(result.reading.guide.length > 0);
});
