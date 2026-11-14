// Run with: node examples/quickstart.mjs
import { cast, divine, read } from "../dist/index.js";

function show(label, result) {
  const reading = read(result);
  console.log(`=== ${label} ===`);
  console.log(`values        ${result.values.join(" ")}`);
  console.log(
    `primary       ${result.primary.id}. ${result.primary.pinyin} — ${result.primary.keyword} (${result.primary.name})`,
  );
  console.log(
    `changed       ${result.changed.id}. ${result.changed.pinyin} — ${result.changed.keyword} (${result.changed.name})`,
  );
  console.log(
    `moving lines  ${result.moving.length ? result.moving.map((i) => i + 1).join(", ") : "none"}`,
  );
  console.log(`read          ${reading.guide}`);
  for (const text of reading.texts) {
    console.log(`  [${text.source}${text.line ? `, line ${text.line}` : ""}] ${text.text}`);
  }
  console.log("");
}

show("a coin cast", divine());
show("a fixed cast: 7 8 7 7 7 9", cast([7, 8, 7, 7, 7, 9]));
