// Two Days of Quiet Dread — make.fun entry
// Writes one single-line code review comment that approves a PR with
// quiet existential dread to <OUTPUT_DIR>/entry.txt (default /output).
// No dependencies, no network, Node 22.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ENTRY =
  "Approved. Everything works and nothing about it makes sense, which is how I know it will be in production for the next nine years.";

const MIN_CHARS = 1;
const MAX_CHARS = 140;

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function main() {
  // Count Unicode code points, not UTF-16 code units, so the gate's
  // character count matches even if the text ever gains non-BMP chars.
  const chars = [...ENTRY];
  if (chars.length < MIN_CHARS || chars.length > MAX_CHARS) {
    fail(`entry is ${chars.length} characters, outside the ${MIN_CHARS}-${MAX_CHARS} gate`);
  }
  if (ENTRY !== ENTRY.trim()) {
    fail("entry has leading or trailing whitespace");
  }
  if (ENTRY.includes("\n") || ENTRY.includes("\r")) {
    fail("entry must be a single line");
  }
  if (ENTRY.trim().length === 0) {
    fail("entry must not be only whitespace");
  }
  // Reject every control character, including line/paragraph separators
  // (U+2028/U+2029) and DEL, so nothing invisible can sneak into the file.
  for (const ch of chars) {
    const code = ch.codePointAt(0);
    if (
      code <= 0x1f ||
      code === 0x7f ||
      (code >= 0x80 && code <= 0x9f) ||
      code === 0x2028 ||
      code === 0x2029
    ) {
      fail(`entry contains a forbidden control character U+${code.toString(16).toUpperCase().padStart(4, "0")}`);
    }
  }

  const outputDir = process.env.OUTPUT_DIR || "/output";
  // Never remove the output dir itself (it may be a mount point):
  // create it if missing, and only clear a stale entry.txt inside it.
  mkdirSync(outputDir, { recursive: true });
  const target = join(outputDir, "entry.txt");
  try {
    rmSync(target, { force: true });
  } catch {
    // A missing file is fine; anything else is reported below.
  }

  writeFileSync(target, ENTRY, "utf8");

  // Read the file back and verify it is byte-for-byte the entry, at the
  // byte level as well as the string level, so an encoding difference
  // cannot slip past a string comparison.
  const written = readFileSync(target, "utf8");
  const writtenBytes = readFileSync(target);
  const expectedBytes = Buffer.from(ENTRY, "utf8");
  if (!writtenBytes.equals(expectedBytes)) {
    fail("verification failed: entry.txt bytes do not match the entry exactly");
  }
  if (written !== ENTRY) {
    fail("verification failed: entry.txt does not match the entry exactly");
  }
  const writtenChars = [...written].length;
  if (writtenChars !== chars.length) {
    fail(`verification failed: entry.txt has ${writtenChars} characters, expected ${chars.length}`);
  }

  console.log(`Wrote ${target}: ${chars.length} characters, single line, byte-exact.`);
}

main();
