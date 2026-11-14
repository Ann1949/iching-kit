# iching-kit

**Cast the I Ching in JavaScript.** Toss the coins, get the hexagram, and know exactly which classical texts to read — deterministically, in a few lines of code.

Zero dependencies. TypeScript types included. MIT.

Maintained by [I Ching Oracle](https://theichingoracle.com) (东方神谕), a reading site that runs on this engine.

```bash
npm install iching-kit
```

## Why this exists

Most I Ching code out there gets one of two things wrong. Either the hexagram is picked by a language model — which hallucinates — or the library stops at "here are six numbers, good luck".

This package does the boring part properly:

- **Casting is arithmetic.** Three coins per line, six lines. 6 / 7 / 8 / 9 with the right probabilities (1/8, 3/8, 3/8, 1/8). No randomness beyond what you pass in.
- **The text to read is decided by rule, not by taste.** Zhu Xi's 变爻 rules map "how many lines moved" to "which passage to read" — all seven cases implemented and tested.
- **The data is checked.** All 64 hexagrams, 384 line texts, and the 用九 / 用六 passages, with line order, trigram pairs, and binary form verified at build time.

What it does *not* do is interpret. Interpretation is the part that should be yours (or your model's).

## Quick start

```ts
import { divine } from "iching-kit";

const { primary, changed, moving, reading } = divine();

console.log(primary.id, primary.pinyin, primary.keyword);
// 47 Kun Adversity

console.log(moving);   // [] — 0-based indices of the moving lines, bottom-up
console.log(reading.guide);
// "Read the primary hexagram's judgment."

for (const text of reading.texts) console.log(text.text);
// 困，亨；贞，大人吉，无咎；有言不信。
```

Need a reproducible cast? Pass your own RNG, or skip the coins entirely:

```ts
import { cast, read } from "iching-kit";

// Line values, bottom-up: 6 old yin, 7 young yang, 8 young yin, 9 old yang.
const result = cast([7, 8, 7, 7, 7, 9]); // one moving line, at the top

console.log(result.primary.id, "→", result.changed.id); // 13 → 49
console.log(read(result).guide);
// "Read the primary hexagram's line 6 text."
```

## What you get from a cast

```ts
interface Cast {
  values: LineValue[];      // the six coin values, bottom-up
  primaryLines: Line[];     // the hexagram as cast
  changedLines: Line[];     // after the moving lines flip
  moving: number[];         // 0-based indices of moving lines, bottom-up
  primary: Hexagram;
  changed: Hexagram;
}
```

And the reading:

```ts
interface Reading {
  movingCount: number;      // 0–6
  source: "primary" | "changed" | "both";
  lineNumbers: number[];    // 1-based, highest first when there are two
  primaryWeight?: number;   // 0.7 when both judgments are read
  special?: "yong9" | "yong6";
  guide: string;            // one sentence, for a human or a model
  texts: ReadingText[];     // the actual classical text
}
```

## The reading rules

Zhu Xi's rules, as implemented in `read()`:

| Moving lines | What to read |
| --- | --- |
| 0 | The primary hexagram's judgment |
| 1 | That one line of the primary hexagram |
| 2 | Both moving lines of the primary, the upper one leading |
| 3 | Both judgments, weighted toward the primary (0.7) |
| 4 | The two *unchanged* lines of the changed hexagram |
| 5 | The single unchanged line of the changed hexagram |
| 6 | 用九 for Qian, 用六 for Kun, otherwise the changed judgment |

## API

| Export | What it does |
| --- | --- |
| `cast(values)` | Build a cast from six line values. Validates input. |
| `castCoins(random?)` | Toss three coins six times. Pass an RNG for reproducibility. |
| `divine(random?)` | `castCoins` + `read`, in one call. |
| `read(cast)` | Apply Zhu Xi's rules and pull out the texts. |
| `relations(hexagram)` | 互卦 (nuclear), 错卦 (opposite), 综卦 (inverse). |
| `getHexagram(id)` | Look up by King Wen number, 1–64. |
| `getHexagramByLines(lines)` | Look up by six lines, bottom-up. |
| `getTrigramByLines(lines)` | Look up a trigram by three lines. |
| `getTrigram(n)` | Look up a trigram by 先天 number, 1–8. |
| `HEXAGRAMS`, `TRIGRAMS` | The full datasets, as plain arrays. |

## Data conventions

- **`lines` and `binary` are bottom-up.** `binary: "111000"` is 泰 (11): lower 乾, upper 坤. Line 1 is the first character, line 6 the last.
- **`values` are the raw coin sums**, so `6` and `9` are the moving lines — not booleans, not "old/new" flags.
- **`yaoCi` is bottom-up too**, so `yaoCi[0]` is 初爻 and `yaoCi[5]` is 上爻.
- **`upper` / `lower` are 先天 (Fu Xi) numbers**, 1 乾 through 8 坤.

## What is in the box, and what is not

Included: the 64 hexagrams, the 8 trigrams, 卦辞 and 爻辞, 用九 / 用六, and the structure that connects them.

Not included: English translations, commentary, readings, and interpretations. The Chinese text below is the classical Zhouyi, which is in the public domain. Any modern translation of it is somebody's copyrighted work, so this package ships none — write your own, or use ours at [theichingoracle.com](https://theichingoracle.com).

## License

MIT for the code. See [LICENSE](./LICENSE).

The classical Chinese text (卦辞 / 爻辞) is public domain.

## Status

`0.1.0`. The API is small and deliberately stable — this is the part that should not churn. Issues are welcome; there is no support SLA.

---

Built and maintained by [I Ching Oracle](https://theichingoracle.com) — free I Ching readings, generated by a deterministic engine and explained by AI.
