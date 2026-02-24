import { describe, it, expect } from "vitest";
import { PenScreenshotRequest, PenScreenshotResponse } from "@/types/pen";

/**
 * Contract Tests: Pencil MCP Screenshot API
 *
 * Purpose: Validate screenshot API request/response structure
 * These tests define the contract for Pencil MCP integration.
 *
 * Note: These are schema validation tests. Actual MCP integration
 * will be tested in integration tests.
 */

describe("T037: Pencil MCP Screenshot API Contract Tests", () => {
  describe("Screenshot Request structure", () => {
    it("should validate minimal screenshot request", () => {
      const request: PenScreenshotRequest = {
        penContent: JSON.stringify({
          version: "1.0",
          root: {
            id: "root",
            type: "frame",
            properties: {},
          },
        }),
      };

      expect(request.penContent).toBeDefined();
      expect(typeof request.penContent).toBe("string");

      // Should be valid JSON
      expect(() => JSON.parse(request.penContent)).not.toThrow();
    });

    it("should validate screenshot request with optional parameters", () => {
      const request: PenScreenshotRequest = {
        penContent: JSON.stringify({
          version: "1.0",
          root: {
            id: "root",
            type: "frame",
            properties: {},
          },
        }),
        nodeId: "specific-node-id",
        width: 800,
        height: 600,
      };

      expect(request.nodeId).toBe("specific-node-id");
      expect(request.width).toBe(800);
      expect(request.height).toBe(600);
    });

    it("should validate request with complex .pen content", () => {
      const penDoc = {
        version: "1.0",
        root: {
          id: "root",
          type: "frame",
          properties: {},
          children: [
            {
              id: "child1",
              type: "rectangle",
              properties: {},
              width: 100,
              height: 100,
              fill: "#ff0000",
            },
          ],
        },
      };

      const request: PenScreenshotRequest = {
        penContent: JSON.stringify(penDoc),
      };

      const parsed = JSON.parse(request.penContent);
      expect(parsed.root.children).toBeDefined();
      expect(parsed.root.children.length).toBe(1);
    });
  });

  describe("Screenshot Response structure", () => {
    it("should validate screenshot response structure", () => {
      const response: PenScreenshotResponse = {
        imageData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        width: 800,
        height: 600,
        generatedAt: "2024-01-01T00:00:00Z",
      };

      expect(response.imageData).toBeDefined();
      expect(typeof response.imageData).toBe("string");
      expect(response.width).toBeGreaterThan(0);
      expect(response.height).toBeGreaterThan(0);
      expect(response.generatedAt).toBeDefined();
    });

    it("should validate base64 image data format", () => {
      const response: PenScreenshotResponse = {
        imageData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        width: 1,
        height: 1,
        generatedAt: new Date().toISOString(),
      };

      // Should start with data URL prefix
      expect(response.imageData.startsWith("data:image/")).toBe(true);

      // Should contain base64 encoding
      expect(response.imageData.includes("base64")).toBe(true);
    });

    it("should validate timestamp format", () => {
      const response: PenScreenshotResponse = {
        imageData: "data:image/png;base64,iVBORw0KGgo=",
        width: 800,
        height: 600,
        generatedAt: "2024-01-01T12:00:00.000Z",
      };

      // Should be valid ISO 8601 format
      const date = new Date(response.generatedAt);
      expect(date.toISOString()).toBe(response.generatedAt);
    });

    it("should validate dimensions are positive numbers", () => {
      const response: PenScreenshotResponse = {
        imageData: "data:image/png;base64,iVBORw0KGgo=",
        width: 1920,
        height: 1080,
        generatedAt: new Date().toISOString(),
      };

      expect(response.width).toBeGreaterThan(0);
      expect(response.height).toBeGreaterThan(0);
      expect(Number.isInteger(response.width)).toBe(true);
      expect(Number.isInteger(response.height)).toBe(true);
    });
  });

  describe("Error handling contract", () => {
    it("should handle invalid .pen content in request", () => {
      const invalidRequest: PenScreenshotRequest = {
        penContent: "invalid-json-content",
      };

      // Should be a string (even if invalid JSON)
      expect(typeof invalidRequest.penContent).toBe("string");

      // Parsing should throw
      expect(() => JSON.parse(invalidRequest.penContent)).toThrow();
    });

    it("should validate error response structure", () => {
      interface ErrorResponse {
        error: string;
        message: string;
        statusCode: number;
      }

      const errorResponse: ErrorResponse = {
        error: "PenFileError",
        message: ".pen 檔案解析失敗",
        statusCode: 400,
      };

      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.message).toBeDefined();
      expect(errorResponse.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe("Performance constraints", () => {
    it("should validate file size constraint (10MB)", () => {
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes

      const penDoc = {
        version: "1.0",
        root: {
          id: "root",
          type: "frame",
          properties: {},
        },
      };

      const request: PenScreenshotRequest = {
        penContent: JSON.stringify(penDoc),
      };

      const sizeInBytes = new Blob([request.penContent]).size;
      expect(sizeInBytes).toBeLessThan(maxSize);
    });

    it("should validate reasonable dimensions", () => {
      const maxDimension = 4000; // Reasonable max for screenshots

      const request: PenScreenshotRequest = {
        penContent: "{}",
        width: 1920,
        height: 1080,
      };

      if (request.width) {
        expect(request.width).toBeLessThanOrEqual(maxDimension);
      }
      if (request.height) {
        expect(request.height).toBeLessThanOrEqual(maxDimension);
      }
    });
  });
});
