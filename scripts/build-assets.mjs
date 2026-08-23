import { constants } from "node:fs";
import { access, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const checkOnly = process.argv.includes("--check");
const expectedRoot = join(projectRoot, "public", "icons");
const temporaryRoot = checkOnly
  ? await mkdtemp(join(tmpdir(), "retitle-plus-assets-"))
  : expectedRoot;

const variants = [
  { size: 16, source: "design/icons/retitle-plus/toolbar.svg" },
  // Chrome uses the 32px raster for a 16 CSS-pixel toolbar icon on Retina.
  { size: 32, source: "design/icons/retitle-plus/toolbar.svg" },
  { size: 48, source: "design/icons/retitle-plus/master.svg" },
  { size: 128, source: "design/icons/retitle-plus/master.svg" },
];

async function renderVariant({ size, source }) {
  const input = join(projectRoot, source);
  const output = join(temporaryRoot, `icon${size}.png`);

  await sharp(input, { density: 384 })
    .resize(size, size, { fit: "contain" })
    .png({ compressionLevel: 9, palette: true })
    .toFile(output);

  const metadata = await sharp(output).metadata();
  if (metadata.width !== size || metadata.height !== size) {
    throw new Error(`${source} rendered at ${metadata.width}x${metadata.height}; expected ${size}x${size}`);
  }

  return output;
}

async function assertCurrent(rendered) {
  const expected = join(expectedRoot, basename(rendered));
  await access(expected, constants.R_OK).catch(() => {
    throw new Error(`Missing ${expected}. Run npm run assets.`);
  });

  const [actualBytes, expectedBytes] = await Promise.all([
    readFile(rendered),
    readFile(expected),
  ]);

  if (!actualBytes.equals(expectedBytes)) {
    throw new Error(`Generated asset is stale: ${expected}. Run npm run assets.`);
  }
}

try {
  await mkdir(temporaryRoot, { recursive: true });
  const rendered = await Promise.all(variants.map(renderVariant));

  if (checkOnly) {
    await Promise.all(rendered.map(assertCurrent));
    console.log("Browser icon assets are current.");
  } else {
    console.log(`Generated ${rendered.length} browser icon assets in ${expectedRoot}.`);
  }
} finally {
  if (checkOnly) {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}
