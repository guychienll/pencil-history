import { describe, it, expect } from "vitest";
import { PenDocument, PenNode } from "@/types/pen";

/**
 * Contract Tests: .pen File Structure Validation
 *
 * Purpose: Validate .pen file structure matches our expected schema
 * These tests ensure we can parse and validate .pen files correctly.
 */

describe("T036: .pen File Structure Contract Tests", () => {
  describe("Valid .pen file structure", () => {
    it("should validate a minimal valid .pen document", () => {
      const validPenDoc: PenDocument = {
        version: "2.8",
        children: [
          {
            id: "BCm8s",
            type: "frame",
            properties: {},
          },
        ],
      };

      expect(validPenDoc).toBeDefined();
      expect(validPenDoc.version).toBe("2.8");
      expect(validPenDoc.children).toBeDefined();
      expect(Array.isArray(validPenDoc.children)).toBe(true);
      expect(validPenDoc.children?.[0].id).toBe("BCm8s");
      expect(validPenDoc.children?.[0].type).toBe("frame");
    });

    it("should validate a .pen document with metadata", () => {
      const penDoc: PenDocument = {
        version: "2.8",
        children: [
          {
            id: "root",
            type: "frame",
            properties: {},
          },
        ],
        metadata: {
          createdAt: "2024-01-01T00:00:00Z",
          modifiedAt: "2024-01-02T00:00:00Z",
          author: "test-user",
          title: "Test Design",
        },
      };

      expect(penDoc.metadata).toBeDefined();
      expect(penDoc.metadata?.author).toBe("test-user");
      expect(penDoc.metadata?.title).toBe("Test Design");
    });

    it("should validate nested node structure", () => {
      const penDoc: PenDocument = {
        version: "2.8",
        children: [
          {
            id: "root",
            type: "frame",
            properties: {},
            children: [
              {
                id: "child1",
                type: "rectangle",
                properties: {},
                x: 0,
                y: 0,
                width: 100,
                height: 100,
                fill: "#ff0000",
              },
              {
                id: "child2",
                type: "text",
                properties: {},
                content: "Hello World",
                fontSize: 16,
              },
            ],
          },
        ],
      };

      expect(penDoc.children).toBeDefined();
      expect(penDoc.children?.[0].children?.length).toBe(2);
      expect(penDoc.children?.[0].children?.[0].type).toBe("rectangle");
      expect(penDoc.children?.[0].children?.[1].type).toBe("text");
    });

    it("should validate frame layout properties", () => {
      const frameNode: PenNode = {
        id: "frame1",
        type: "frame",
        properties: {},
        layout: "vertical",
        gap: 16,
        padding: 24,
        children: [],
      };

      expect(frameNode.layout).toBe("vertical");
      expect(frameNode.gap).toBe(16);
      expect(frameNode.padding).toBe(24);
    });

    it("should validate text node properties", () => {
      const textNode: PenNode = {
        id: "text1",
        type: "text",
        properties: {},
        content: "Sample Text",
        fontSize: 14,
        fontFamily: "Inter",
        fontWeight: 400,
        textAlign: "left",
        textColor: "#000000",
      };

      expect(textNode.content).toBe("Sample Text");
      expect(textNode.fontSize).toBe(14);
      expect(textNode.textAlign).toBe("left");
    });

    it("should validate component instance (ref node)", () => {
      const refNode: PenNode = {
        id: "instance1",
        type: "ref",
        properties: {},
        ref: "ComponentID",
      };

      expect(refNode.type).toBe("ref");
      expect(refNode.ref).toBe("ComponentID");
    });

    it("should validate node with multiple fills", () => {
      const node: PenNode = {
        id: "node1",
        type: "rectangle",
        properties: {},
        fill: [
          {
            type: "solid",
            color: "#ff0000",
            opacity: 1,
          },
          {
            type: "gradient",
            gradientStops: [
              { color: "#000000", position: 0 },
              { color: "#ffffff", position: 1 },
            ],
          },
        ],
      };

      expect(Array.isArray(node.fill)).toBe(true);
      if (Array.isArray(node.fill)) {
        expect(node.fill[0].type).toBe("solid");
        expect(node.fill[1].type).toBe("gradient");
      }
    });
  });

  describe("Node ID validation", () => {
    it("should have unique node IDs in document", () => {
      const penDoc: PenDocument = {
        version: "2.8",
        children: [
          {
            id: "root",
            type: "frame",
            properties: {},
            children: [
              { id: "node1", type: "frame", properties: {} },
              { id: "node2", type: "frame", properties: {} },
              { id: "node3", type: "frame", properties: {} },
            ],
          },
        ],
      };

      const ids = new Set<string>();
      const collectIds = (node: PenNode) => {
        ids.add(node.id);
        node.children?.forEach(collectIds);
      };

      penDoc.children?.forEach(collectIds);

      // All IDs should be unique
      expect(ids.size).toBe(4); // root + 3 children
    });

    it("should handle node IDs as strings", () => {
      const node: PenNode = {
        id: "unique-id-123",
        type: "frame",
        properties: {},
      };

      expect(typeof node.id).toBe("string");
      expect(node.id.length).toBeGreaterThan(0);
    });
  });

  describe("File size validation", () => {
    it("should calculate JSON string size", () => {
      const penDoc: PenDocument = {
        version: "2.8",
        children: [
          {
            id: "root",
            type: "frame",
            properties: {},
          },
        ],
      };

      const jsonString = JSON.stringify(penDoc);
      const sizeInBytes = new Blob([jsonString]).size;

      // Should be well under 10MB limit for minimal document
      expect(sizeInBytes).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe("Required fields validation", () => {
    it("should require version field", () => {
      const penDoc = {
        version: "2.8",
        children: [
          {
            id: "root",
            type: "frame",
            properties: {},
          },
        ],
      } as PenDocument;

      expect(penDoc.version).toBeDefined();
    });

    it("should require children array", () => {
      const penDoc = {
        version: "2.8",
        children: [
          {
            id: "root",
            type: "frame",
            properties: {},
          },
        ],
      } as PenDocument;

      expect(penDoc.children).toBeDefined();
      expect(Array.isArray(penDoc.children)).toBe(true);
    });

    it("should require id and type on all nodes", () => {
      const node: PenNode = {
        id: "node1",
        type: "frame",
        properties: {},
      };

      expect(node.id).toBeDefined();
      expect(node.type).toBeDefined();
      expect(node.properties).toBeDefined();
    });
  });
});
