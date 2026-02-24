// T047: Screenshot generation using browser-side SVG rendering

import { getMCPClient, isMockMode } from "./pencil-mcp-client";
import { PenScreenshotRequest, PenScreenshotResponse, PenDocument } from "@/types/pen";
import { renderPenToSVG, svgToDataUrl } from "@/lib/pen/renderer";
import { parsePenFile } from "@/lib/pen/parser";
import { validatePenFile } from "@/lib/pen/validator";

/**
 * Generate screenshot of .pen file
 * @param request - Screenshot request parameters
 * @returns Screenshot response with base64 image data
 */
export async function generateScreenshot(
  request: PenScreenshotRequest
): Promise<PenScreenshotResponse> {
  try {
    // Parse and validate .pen content
    const penDoc = parsePenFile(request.penContent);
    const validation = validatePenFile(penDoc);

    if (!validation.valid) {
      throw new Error(`Invalid .pen file: ${validation.error}`);
    }

    // Check if Pencil MCP server is available
    if (!isMockMode()) {
      const client = await getMCPClient();

      if (client) {
        // Try to use Pencil MCP for rendering
        return await generateWithMCP(client, penDoc, request);
      }
    }

    // Use browser-side SVG rendering (production-ready)
    return generateWithSVG(penDoc, request);
  } catch (error) {
    console.error("Screenshot generation failed:", error);
    throw new Error("截圖生成失敗");
  }
}

/**
 * Generate screenshot using Pencil MCP server (when available)
 */
async function generateWithMCP(
  client: unknown,
  penDoc: PenDocument,
  request: PenScreenshotRequest
): Promise<PenScreenshotResponse> {
  try {
    // Call Pencil MCP's get_screenshot tool
    const response = await (client as {
      callTool: (args: unknown) => Promise<unknown>;
    }).callTool({
      name: "get_screenshot",
      arguments: {
        filePath: "temp.pen",
        nodeId: request.nodeId,
      },
    });

    const imageData = extractImageDataFromMCPResponse(response);

    return {
      imageData,
      width: request.width || 800,
      height: request.height || 600,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("MCP rendering failed, falling back to SVG:", error);
    // Fallback to SVG rendering
    return generateWithSVG(penDoc, request);
  }
}

/**
 * Generate screenshot using browser-side SVG rendering
 * This is the production-ready approach
 */
async function generateWithSVG(
  penDoc: PenDocument,
  request: PenScreenshotRequest
): Promise<PenScreenshotResponse> {
  const width = request.width || 800;
  const height = request.height || 600;

  // Render .pen document to SVG with repo context for image resolution
  console.log("Rendering with repoContext:", request.repoContext);

  const svg = await renderPenToSVG(penDoc, {
    width,
    height,
    repoContext: request.repoContext,
  });

  console.log("SVG length:", svg.length);
  console.log("SVG preview (first 1500 chars):", svg.substring(0, 1500));

  // Convert SVG to data URL
  const imageData = svgToDataUrl(svg);

  return {
    imageData,
    width,
    height,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Extract image data from MCP response
 */
function extractImageDataFromMCPResponse(response: unknown): string {
  // Parse actual MCP response format
  if (
    response &&
    typeof response === "object" &&
    "content" in response &&
    Array.isArray(response.content)
  ) {
    const imageContent = response.content.find(
      (item: unknown) =>
        item &&
        typeof item === "object" &&
        "type" in item &&
        item.type === "image"
    );

    if (
      imageContent &&
      typeof imageContent === "object" &&
      "data" in imageContent &&
      typeof imageContent.data === "string"
    ) {
      return imageContent.data;
    }
  }

  throw new Error("Invalid MCP response format");
}

/**
 * Validate screenshot request
 */
export function validateScreenshotRequest(
  request: PenScreenshotRequest
): { valid: boolean; error?: string } {
  if (!request.penContent) {
    return { valid: false, error: "penContent 不能為空" };
  }

  try {
    JSON.parse(request.penContent);
  } catch {
    return { valid: false, error: "penContent 必須是有效的 JSON" };
  }

  if (request.width && (request.width < 1 || request.width > 4000)) {
    return { valid: false, error: "width 必須介於 1-4000 之間" };
  }

  if (request.height && (request.height < 1 || request.height > 4000)) {
    return { valid: false, error: "height 必須介於 1-4000 之間" };
  }

  return { valid: true };
}
