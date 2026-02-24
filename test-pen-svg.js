// Test script to debug SVG rendering with images
import fs from "fs";
import path from "path";

// Simulate the rendering logic
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash;
  }
  return Math.abs(hash).toString(36);
}

function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function resolveImageUrl(imageUrl, repoContext) {
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl;
  }

  if (!repoContext) {
    console.warn("No repo context available for image URL:", imageUrl);
    return imageUrl;
  }

  const { owner, repo, ref } = repoContext;
  const cleanPath = imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl;
  const resolvedUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${cleanPath}`;

  console.log("Resolved image URL:", {
    original: imageUrl,
    resolved: resolvedUrl,
    context: { owner, repo, ref },
  });

  return resolvedUrl;
}

function renderImagePattern(fill, repoContext) {
  if (!fill.imageUrl) return "";

  const patternId = `image-${simpleHash(fill.imageUrl)}`;
  const resolvedUrl = resolveImageUrl(fill.imageUrl, repoContext);

  return `<pattern id="${patternId}" x="0" y="0" width="1" height="1" patternContentUnits="objectBoundingBox">
    <image href="${escapeXml(resolvedUrl)}" x="0" y="0" width="1" height="1" preserveAspectRatio="xMidYMid slice"/>
  </pattern>`;
}

// Test case
const testPenDoc = {
  version: "1.0",
  children: [
    {
      id: "test-rect",
      type: "rectangle",
      x: 0,
      y: 0,
      width: 400,
      height: 300,
      fill: {
        type: "image",
        imageUrl: "232543043.jpeg",
      },
    },
  ],
};

const repoContext = {
  owner: "guychienll",
  repo: "pen-diff",
  ref: "refs/heads/main", // or commit SHA
};

console.log("\n=== Testing Image Pattern Rendering ===\n");

const imageFill = testPenDoc.children[0].fill;
const patternSvg = renderImagePattern(imageFill, repoContext);

console.log("\nGenerated SVG Pattern:");
console.log(patternSvg);

const patternId = `image-${simpleHash(imageFill.imageUrl)}`;
console.log("\nPattern ID:", patternId);
console.log("Fill reference:", `url(#${patternId})`);

// Generate complete SVG
const completeSvg = `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${patternSvg}
  </defs>
  <rect x="0" y="0" width="400" height="300" fill="url(#${patternId})"/>
</svg>`;

console.log("\n=== Complete SVG ===\n");
console.log(completeSvg);

// Write to file for manual inspection
const outputPath = path.join(__dirname, "test-output.svg");
fs.writeFileSync(outputPath, completeSvg);
console.log(`\n✅ SVG written to: ${outputPath}`);
console.log("Open this file in a browser to test rendering");
