// Browser-side .pen file renderer using SVG
// This renders .pen files directly in the browser without needing server-side processing

import { PenDocument, PenNode, PenFill } from "@/types/pen";

export interface RenderOptions {
  width?: number;
  height?: number;
  scale?: number;
  backgroundColor?: string;
  // GitHub repo context for resolving relative image paths
  repoContext?: {
    owner: string;
    repo: string;
    ref: string;
  };
}

// Store render options globally for use in helper functions
let currentRenderOptions: RenderOptions = {};

// Cache for downloaded images (URL -> data URL)
const imageCache = new Map<string, string>();

/**
 * Render a .pen document to SVG string
 * @param penDoc - PenDocument to render
 * @param options - Rendering options
 * @returns SVG string
 */
export async function renderPenToSVG(
  penDoc: PenDocument,
  options: RenderOptions = {}
): Promise<string> {
  currentRenderOptions = options;
  const { width = 800, height = 600, backgroundColor = "#ffffff" } = options;

  // Calculate bounding box of all nodes
  const bounds = calculateBounds(penDoc);

  // Create SVG with viewBox to fit all content
  const viewBoxWidth = bounds.maxX - bounds.minX || width;
  const viewBoxHeight = bounds.maxY - bounds.minY || height;

  let svg = `<svg width="${width}" height="${height}" viewBox="${bounds.minX} ${bounds.minY} ${viewBoxWidth} ${viewBoxHeight}" xmlns="http://www.w3.org/2000/svg">`;

  // Add image pattern definitions if needed
  const imageFills = collectImageFills(penDoc);
  console.log("Collected image fills:", {
    count: imageFills.length,
    fills: imageFills.map((f) => ({ imageUrl: f.imageUrl || f.url })),
  });

  if (imageFills.length > 0) {
    // Pre-download all images and convert to data URLs
    await downloadAndCacheImages(imageFills);

    svg += "<defs>";
    for (const fill of imageFills) {
      const pattern = renderImagePattern(fill);
      console.log("Generated pattern:", pattern.substring(0, 200));
      svg += pattern;
    }
    svg += "</defs>";
  } else {
    console.log("No image fills found in document");
  }

  // Background
  svg += `<rect x="${bounds.minX}" y="${bounds.minY}" width="${viewBoxWidth}" height="${viewBoxHeight}" fill="${backgroundColor}"/>`;

  // Render all top-level nodes
  if (penDoc.children) {
    for (const child of penDoc.children) {
      svg += renderNode(child, 0, 0); // Start with (0, 0) offset
    }
  }

  svg += "</svg>";
  return svg;
}

/**
 * Calculate bounding box of all nodes in the document
 * Must use absolute coordinates (with parent offsets)
 */
function calculateBounds(penDoc: PenDocument): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const processNode = (node: PenNode, parentX: number = 0, parentY: number = 0) => {
    // Calculate absolute position
    const relativeX = node.x || 0;
    const relativeY = node.y || 0;
    const absoluteX = parentX + relativeX;
    const absoluteY = parentY + relativeY;

    const width =
      typeof node.width === "number" ? node.width : parseFloat(String(node.width)) || 100;
    const height =
      typeof node.height === "number" ? node.height : parseFloat(String(node.height)) || 100;

    // Update bounds using absolute coordinates
    minX = Math.min(minX, absoluteX);
    minY = Math.min(minY, absoluteY);
    maxX = Math.max(maxX, absoluteX + width);
    maxY = Math.max(maxY, absoluteY + height);

    // Process children with current node's absolute position
    if (node.children) {
      for (const child of node.children) {
        processNode(child, absoluteX, absoluteY);
      }
    }
  };

  if (penDoc.children) {
    for (const child of penDoc.children) {
      processNode(child, 0, 0);
    }
  }

  // Default bounds if no nodes found
  if (minX === Infinity) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
  }

  // No padding - fill completely
  return {
    minX: minX,
    minY: minY,
    maxX: maxX,
    maxY: maxY,
  };
}

/**
 * Render a single node to SVG string
 * @param node - The node to render
 * @param parentX - Parent's absolute X position
 * @param parentY - Parent's absolute Y position
 */
function renderNode(node: PenNode, parentX: number = 0, parentY: number = 0): string {
  if (node.visible === false) {
    return "";
  }

  // Calculate absolute position by adding parent offset
  const relativeX = node.x || 0;
  const relativeY = node.y || 0;
  const absoluteX = parentX + relativeX;
  const absoluteY = parentY + relativeY;

  const width = typeof node.width === "number" ? node.width : parseFloat(String(node.width)) || 100;
  const height =
    typeof node.height === "number" ? node.height : parseFloat(String(node.height)) || 100;
  const rotation = node.rotation || 0;
  const opacity = node.opacity !== undefined ? node.opacity : 1;

  // Debug logging for position
  if (
    node.type === "frame" ||
    (node.fill &&
      typeof node.fill === "object" &&
      !Array.isArray(node.fill) &&
      node.fill.type === "image")
  ) {
    console.log(`Rendering ${node.type} (${node.id}):`, {
      relative: { x: relativeX, y: relativeY },
      parent: { x: parentX, y: parentY },
      absolute: { x: absoluteX, y: absoluteY },
      size: { width, height },
    });
  }

  // Get fill color
  const fill = getFillStyle(node.fill);
  const stroke = getStrokeStyle(node);

  // Apply transform if rotation exists
  // Rotation center should be in absolute coordinates
  const centerX = absoluteX + width / 2;
  const centerY = absoluteY + height / 2;
  const transform = rotation !== 0 ? `transform="rotate(${rotation} ${centerX} ${centerY})"` : "";

  let svg = "";

  // Group for this node
  svg += `<g ${transform} opacity="${opacity}">`;

  switch (node.type) {
    case "frame":
    case "rectangle":
      svg += renderRectangle(node, absoluteX, absoluteY, width, height, fill, stroke);
      break;

    case "ellipse":
      svg += renderEllipse(node, absoluteX, absoluteY, width, height, fill, stroke);
      break;

    case "text":
      svg += renderText(node, absoluteX, absoluteY);
      break;

    case "line":
      svg += renderLine(node, absoluteX, absoluteY, width, height, stroke);
      break;

    case "path":
      // Path rendering would need the geometry data
      svg += `<!-- path node ${node.id} -->`;
      break;

    default:
      // Render as rectangle for unknown types
      svg += renderRectangle(node, absoluteX, absoluteY, width, height, fill, stroke);
  }

  // Render children with current node's absolute position as their parent offset
  if (node.children) {
    for (const child of node.children) {
      svg += renderNode(child, absoluteX, absoluteY);
    }
  }

  svg += "</g>";
  return svg;
}

/**
 * Render rectangle node
 */
function renderRectangle(
  node: PenNode,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke: string
): string {
  const cornerRadius = node.cornerRadius || 0;
  const rx = Array.isArray(cornerRadius) ? cornerRadius[0] : cornerRadius;
  const ry = Array.isArray(cornerRadius) ? cornerRadius[1] || cornerRadius[0] : cornerRadius;

  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" ry="${ry}" fill="${fill}" ${stroke}/>`;
}

/**
 * Render ellipse node
 */
function renderEllipse(
  node: PenNode,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke: string
): string {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const rx = width / 2;
  const ry = height / 2;

  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${stroke}/>`;
}

/**
 * Render text node
 */
function renderText(node: PenNode, x: number, y: number): string {
  const content = node.content || "";
  const fontSize = node.fontSize || 16;
  const fontFamily = node.fontFamily || "system-ui, sans-serif";
  const fontWeight = node.fontWeight || 400;
  const textColor = node.textColor || "#000000";
  const textAlign = node.textAlign || "left";

  // Calculate text anchor based on alignment
  const anchor = textAlign === "center" ? "middle" : textAlign === "right" ? "end" : "start";

  // Approximate baseline adjustment
  const baselineY = y + fontSize;

  return `<text x="${x}" y="${baselineY}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${textColor}" text-anchor="${anchor}">${escapeXml(content)}</text>`;
}

/**
 * Render line node
 */
function renderLine(
  node: PenNode,
  x: number,
  y: number,
  width: number,
  height: number,
  stroke: string
): string {
  const x1 = x;
  const y1 = y;
  const x2 = x + width;
  const y2 = y + height;

  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${stroke}/>`;
}

/**
 * Get fill style from node
 */
function getFillStyle(fill: string | PenFill[] | PenFill | undefined): string {
  if (!fill) {
    return "none";
  }

  if (typeof fill === "string") {
    return fill;
  }

  if (Array.isArray(fill)) {
    // Use first fill if multiple
    return getFillFromObject(fill[0]);
  }

  return getFillFromObject(fill);
}

/**
 * Get fill from PenFill object
 */
function getFillFromObject(fill: PenFill): string {
  if (fill.type === "solid") {
    return fill.color || "#000000";
  }

  if (fill.type === "gradient") {
    // Simplified gradient handling
    // In production, would need to create SVG gradient definitions
    return fill.gradientStops?.[0]?.color || "#000000";
  }

  if (fill.type === "image") {
    // Support both 'imageUrl' and 'url' properties
    const imageUrl = fill.imageUrl || fill.url;
    if (imageUrl) {
      // Return imageUrl as-is for SVG pattern/image element handling
      // This will be handled by renderImageFill function
      return `url(#image-${simpleHash(imageUrl)})`;
    }
  }

  if (fill.type === "image") {
    // Image without URL - use placeholder
    return "#e5e7eb";
  }

  return "none";
}

/**
 * Get stroke style from node
 */
function getStrokeStyle(node: PenNode): string {
  if (!node.stroke || !Array.isArray(node.stroke) || node.stroke.length === 0) {
    return 'stroke="none"';
  }

  const stroke = node.stroke[0];
  const color = stroke.color || "#000000";
  const thickness = stroke.thickness || 1;
  const style = stroke.style || "solid";

  let dashArray = "";
  if (style === "dashed") {
    dashArray = `stroke-dasharray="${thickness * 4},${thickness * 2}"`;
  } else if (style === "dotted") {
    dashArray = `stroke-dasharray="${thickness},${thickness}"`;
  }

  return `stroke="${color}" stroke-width="${thickness}" ${dashArray}`;
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Convert SVG string to data URL
 */
export function svgToDataUrl(svg: string): string {
  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Collect all image fills from the document
 */
function collectImageFills(penDoc: PenDocument): PenFill[] {
  const imageFills: PenFill[] = [];

  function traverse(node: PenNode, depth = 0) {
    const indent = "  ".repeat(depth);
    console.log(`${indent}Node: ${node.type} (${node.id || "no-id"})`);

    // Check node's fill
    if (node.fill) {
      console.log(`${indent}  Has fill:`, node.fill);
      const fills = Array.isArray(node.fill) ? node.fill : [node.fill];
      for (const fill of fills) {
        if (typeof fill === "object") {
          // Support both 'imageUrl' and 'url' properties
          const imageUrl = fill.imageUrl || fill.url;
          console.log(
            `${indent}    Fill type: ${fill.type}, imageUrl: ${fill.imageUrl || "none"}, url: ${fill.url || "none"}`
          );
          if (fill.type === "image" && imageUrl) {
            console.log(`${indent}    ✅ Found image fill: ${imageUrl}`);
            imageFills.push(fill);
          }
        }
      }
    }

    // Traverse children
    if (node.children) {
      for (const child of node.children) {
        traverse(child, depth + 1);
      }
    }
  }

  console.log("=== Starting to collect image fills ===");
  if (penDoc.children) {
    for (const child of penDoc.children) {
      traverse(child, 0);
    }
  }
  console.log("=== Finished collecting image fills ===");

  return imageFills;
}

/**
 * Render an image pattern for SVG defs
 * Using objectBoundingBox with proper x/y positioning
 */
function renderImagePattern(fill: PenFill): string {
  // Support both 'imageUrl' and 'url' properties
  const imageUrl = fill.imageUrl || fill.url;
  if (!imageUrl) return "";

  const patternId = `image-${simpleHash(imageUrl)}`;
  const resolvedUrl = resolveImageUrl(imageUrl);

  console.log(`Creating pattern ${patternId} for URL: ${resolvedUrl}`);

  // Use objectBoundingBox with explicit x, y, width, height
  // This ensures the pattern covers the entire bounding box
  return `<pattern id="${patternId}" x="0" y="0" width="1" height="1" patternContentUnits="objectBoundingBox">
    <image x="0" y="0" href="${escapeXml(resolvedUrl)}" width="1" height="1" preserveAspectRatio="xMidYMid slice"/>
  </pattern>`;
}

/**
 * Resolve image URL to absolute URL
 * Converts relative paths to GitHub raw URLs if repoContext is available
 * Returns data URL if image has been downloaded and cached
 */
function resolveImageUrl(imageUrl: string): string {
  // Check if we have a cached data URL for this image
  const cachedDataUrl = imageCache.get(imageUrl);
  if (cachedDataUrl) {
    console.log("Using cached data URL for:", imageUrl);
    return cachedDataUrl;
  }

  // If already a data URL, return as-is
  if (imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  // If already absolute URL, return as-is
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // If no repo context, return as-is (relative path)
  if (!currentRenderOptions.repoContext) {
    console.warn("No repo context available for image URL:", imageUrl);
    return imageUrl;
  }

  const { owner, repo, ref } = currentRenderOptions.repoContext;

  // Remove leading slash if present
  const cleanPath = imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl;

  // Construct GitHub raw URL
  // Format: https://raw.githubusercontent.com/{owner}/{repo}/{commit-sha}/{path}
  const resolvedUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${cleanPath}`;

  console.log("Resolved image URL:", {
    original: imageUrl,
    resolved: resolvedUrl,
    context: { owner, repo, ref },
  });

  return resolvedUrl;
}

/**
 * Download images and convert to data URLs
 * This ensures images are embedded in the SVG and don't require external requests
 */
async function downloadAndCacheImages(imageFills: PenFill[]): Promise<void> {
  const downloadPromises = imageFills.map(async (fill) => {
    const imageUrl = fill.imageUrl || fill.url;
    if (!imageUrl) return;

    // Skip if already a data URL
    if (imageUrl.startsWith("data:")) {
      imageCache.set(imageUrl, imageUrl);
      return;
    }

    // Check if already cached
    if (imageCache.has(imageUrl)) {
      return;
    }

    try {
      // Resolve to full URL
      const fullUrl = resolveImageUrl(imageUrl);

      // Skip if not an HTTP URL (e.g., relative path without repo context)
      if (!fullUrl.startsWith("http://") && !fullUrl.startsWith("https://")) {
        console.warn("Cannot download non-HTTP URL:", fullUrl);
        return;
      }

      console.log("Downloading image:", fullUrl);

      const response = await fetch(fullUrl);
      if (!response.ok) {
        console.error(`Failed to download image: ${response.status} ${response.statusText}`);
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");

      // Determine MIME type from response or extension
      const contentType = response.headers.get("content-type") || "image/jpeg";
      const dataUrl = `data:${contentType};base64,${base64}`;

      // Cache using original imageUrl as key
      imageCache.set(imageUrl, dataUrl);
      console.log(`Cached image ${imageUrl} (${(buffer.length / 1024).toFixed(2)} KB)`);
    } catch (error) {
      console.error(`Error downloading image ${imageUrl}:`, error);
    }
  });

  await Promise.all(downloadPromises);
}

/**
 * Simple string hash function for generating IDs
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
