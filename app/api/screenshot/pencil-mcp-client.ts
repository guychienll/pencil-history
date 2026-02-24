// T046: Pencil MCP client initialization
// Note: This is a server-side module for Vercel Functions

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

let mcpClient: Client | null = null;
let isInitialized = false;

// Use mock mode if PENCIL_MCP_SERVER environment variable is not set
const USE_MOCK_MODE = !process.env.PENCIL_MCP_SERVER;

/**
 * Initialize Pencil MCP client
 * This runs on the server side (Vercel Function)
 */
export async function initializePencilMCPClient(): Promise<Client | null> {
  if (USE_MOCK_MODE) {
    console.log("Running in mock mode - Pencil MCP server not configured");
    return null;
  }

  if (mcpClient && isInitialized) {
    return mcpClient;
  }

  try {
    // Create transport for Pencil MCP server
    const transport = new StdioClientTransport({
      command: process.env.PENCIL_MCP_SERVER || "pencil-mcp-server",
      args: process.env.PENCIL_MCP_ARGS
        ? process.env.PENCIL_MCP_ARGS.split(" ")
        : [],
    });

    mcpClient = new Client(
      {
        name: "pencil-history-screenshot-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    await mcpClient.connect(transport);
    isInitialized = true;

    return mcpClient;
  } catch (error) {
    console.error("Failed to initialize Pencil MCP client:", error);
    throw new Error("無法初始化 Pencil MCP 服務");
  }
}

/**
 * Get MCP client instance (initialize if needed)
 */
export async function getMCPClient(): Promise<Client | null> {
  if (USE_MOCK_MODE) {
    return null;
  }

  if (!mcpClient || !isInitialized) {
    return await initializePencilMCPClient();
  }
  return mcpClient;
}

/**
 * Close MCP client connection
 */
export async function closeMCPClient(): Promise<void> {
  if (mcpClient) {
    await mcpClient.close();
    mcpClient = null;
    isInitialized = false;
  }
}

/**
 * Check if running in mock mode
 */
export function isMockMode(): boolean {
  return USE_MOCK_MODE;
}
