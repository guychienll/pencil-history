/**
 * Unit Tests: Node-Level Structural Diff Algorithm
 *
 * Feature: User Story 3 - Diff Comparison
 * Task: T084
 *
 * Tests the core diff algorithm that compares two .pen file node trees
 * and identifies added, deleted, modified, and moved nodes.
 */

import { describe, it, expect } from "vitest";
import type { PenNode } from "@/types/pen";
import type { NodeDiff, DiffResult } from "@/lib/diff/types";

// Import the functions we'll implement
import { compareNodes, detectAdded, detectDeleted, detectModified } from "@/lib/diff/node-diff";

describe("Node-Level Structural Diff Algorithm", () => {
  describe("detectAdded", () => {
    it("should detect newly added nodes", () => {
      const oldRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [{ id: "node1", type: "text", properties: { content: "Hello" } }],
      };

      const newRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [
          { id: "node1", type: "text", properties: { content: "Hello" } },
          { id: "node2", type: "text", properties: { content: "World" } }, // Added
        ],
      };

      const addedNodes = detectAdded(oldRoot, newRoot, { includeFullNodes: true });

      expect(addedNodes).toHaveLength(1);
      expect(addedNodes[0].nodeId).toBe("node2");
      expect(addedNodes[0].type).toBe("added");
      expect(addedNodes[0].newNode?.properties?.content).toBe("World");
    });

    it("should detect deeply nested added nodes", () => {
      const oldRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [
          {
            id: "container",
            type: "frame",
            properties: {},
            children: [{ id: "child1", type: "text", properties: {} }],
          },
        ],
      };

      const newRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [
          {
            id: "container",
            type: "frame",
            properties: {},
            children: [
              { id: "child1", type: "text", properties: {} },
              { id: "child2", type: "text", properties: {} }, // Added deep
            ],
          },
        ],
      };

      const addedNodes = detectAdded(oldRoot, newRoot);

      expect(addedNodes).toHaveLength(1);
      expect(addedNodes[0].nodeId).toBe("child2");
      expect(addedNodes[0].path).toEqual(["root", "container", "child2"]);
    });

    it("should return empty array when no nodes added", () => {
      const root: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [{ id: "node1", type: "text", properties: {} }],
      };

      const addedNodes = detectAdded(root, root);
      expect(addedNodes).toHaveLength(0);
    });
  });

  describe("detectDeleted", () => {
    it("should detect deleted nodes", () => {
      const oldRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [
          { id: "node1", type: "text", properties: { content: "Hello" } },
          { id: "node2", type: "text", properties: { content: "World" } },
        ],
      };

      const newRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [
          { id: "node1", type: "text", properties: { content: "Hello" } },
          // node2 deleted
        ],
      };

      const deletedNodes = detectDeleted(oldRoot, newRoot, { includeFullNodes: true });

      expect(deletedNodes).toHaveLength(1);
      expect(deletedNodes[0].nodeId).toBe("node2");
      expect(deletedNodes[0].type).toBe("deleted");
      expect(deletedNodes[0].oldNode?.properties?.content).toBe("World");
    });

    it("should detect deletion of entire subtrees", () => {
      const oldRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [
          {
            id: "container",
            type: "frame",
            properties: {},
            children: [
              { id: "child1", type: "text", properties: {} },
              { id: "child2", type: "text", properties: {} },
            ],
          },
        ],
      };

      const newRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [], // Entire container deleted
      };

      const deletedNodes = detectDeleted(oldRoot, newRoot);

      // Should detect container and all its children
      expect(deletedNodes.length).toBeGreaterThan(0);
      const containerDeleted = deletedNodes.find((n) => n.nodeId === "container");
      expect(containerDeleted).toBeDefined();
    });

    it("should return empty array when no nodes deleted", () => {
      const root: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [{ id: "node1", type: "text", properties: {} }],
      };

      const deletedNodes = detectDeleted(root, root);
      expect(deletedNodes).toHaveLength(0);
    });
  });

  describe("detectModified", () => {
    it("should detect modified node properties", () => {
      const oldRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [
          {
            id: "node1",
            type: "text",
            properties: {
              content: "Hello",
              fontSize: 16,
              color: "#000000",
            },
          },
        ],
      };

      const newRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [
          {
            id: "node1",
            type: "text",
            properties: {
              content: "Hello World", // Modified
              fontSize: 18, // Modified
              color: "#000000", // Unchanged
            },
          },
        ],
      };

      const modifiedNodes = detectModified(oldRoot, newRoot);

      expect(modifiedNodes).toHaveLength(1);
      expect(modifiedNodes[0].nodeId).toBe("node1");
      expect(modifiedNodes[0].type).toBe("modified");
      expect(modifiedNodes[0].propertyChanges).toBeDefined();
      expect(modifiedNodes[0].propertyChanges?.length).toBeGreaterThan(0);

      // Check property changes
      const changes = modifiedNodes[0].propertyChanges!;
      const contentChange = changes.find((c) => c.property === "content");
      expect(contentChange?.oldValue).toBe("Hello");
      expect(contentChange?.newValue).toBe("Hello World");

      const fontSizeChange = changes.find((c) => c.property === "fontSize");
      expect(fontSizeChange?.oldValue).toBe(16);
      expect(fontSizeChange?.newValue).toBe(18);
    });

    it("should detect when properties are added", () => {
      const oldRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [
          {
            id: "node1",
            type: "text",
            properties: {
              content: "Hello",
            },
          },
        ],
      };

      const newRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [
          {
            id: "node1",
            type: "text",
            properties: {
              content: "Hello",
              fontSize: 16, // Property added
            },
          },
        ],
      };

      const modifiedNodes = detectModified(oldRoot, newRoot);

      expect(modifiedNodes).toHaveLength(1);
      const changes = modifiedNodes[0].propertyChanges!;
      const addedProp = changes.find((c) => c.property === "fontSize");
      expect(addedProp?.operation).toBe("add");
      expect(addedProp?.newValue).toBe(16);
      expect(addedProp?.oldValue).toBeUndefined();
    });

    it("should detect when properties are removed", () => {
      const oldRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [
          {
            id: "node1",
            type: "text",
            properties: {
              content: "Hello",
              fontSize: 16,
            },
          },
        ],
      };

      const newRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [
          {
            id: "node1",
            type: "text",
            properties: {
              content: "Hello",
              // fontSize removed
            },
          },
        ],
      };

      const modifiedNodes = detectModified(oldRoot, newRoot);

      expect(modifiedNodes).toHaveLength(1);
      const changes = modifiedNodes[0].propertyChanges!;
      const removedProp = changes.find((c) => c.property === "fontSize");
      expect(removedProp?.operation).toBe("remove");
      expect(removedProp?.oldValue).toBe(16);
      expect(removedProp?.newValue).toBeUndefined();
    });

    it("should not report nodes as modified if properties are identical", () => {
      const oldRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [
          {
            id: "node1",
            type: "text",
            properties: {
              content: "Hello",
              fontSize: 16,
            },
          },
        ],
      };

      const newRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [
          {
            id: "node1",
            type: "text",
            properties: {
              content: "Hello",
              fontSize: 16,
            },
          },
        ],
      };

      const modifiedNodes = detectModified(oldRoot, newRoot);
      expect(modifiedNodes).toHaveLength(0);
    });

    it("should handle nested object properties", () => {
      const oldRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [
          {
            id: "node1",
            type: "frame",
            properties: {
              layout: {
                direction: "horizontal",
                gap: 10,
              },
            },
          },
        ],
      };

      const newRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [
          {
            id: "node1",
            type: "frame",
            properties: {
              layout: {
                direction: "vertical", // Modified
                gap: 10,
              },
            },
          },
        ],
      };

      const modifiedNodes = detectModified(oldRoot, newRoot);

      expect(modifiedNodes).toHaveLength(1);
      expect(modifiedNodes[0].propertyChanges).toBeDefined();
    });
  });

  describe("compareNodes - Integration", () => {
    it("should return complete diff result with all change types", () => {
      const oldRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [
          { id: "node1", type: "text", properties: { content: "Old" } },
          { id: "node2", type: "text", properties: { content: "Delete me" } },
          { id: "node3", type: "text", properties: { content: "Unchanged" } },
        ],
      };

      const newRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [
          { id: "node1", type: "text", properties: { content: "New" } }, // Modified
          // node2 deleted
          { id: "node3", type: "text", properties: { content: "Unchanged" } },
          { id: "node4", type: "text", properties: { content: "Added" } }, // Added
        ],
      };

      const result: DiffResult = compareNodes(oldRoot, newRoot);

      expect(result.added).toHaveLength(1);
      expect(result.added[0].nodeId).toBe("node4");

      expect(result.deleted).toHaveLength(1);
      expect(result.deleted[0].nodeId).toBe("node2");

      expect(result.modified).toHaveLength(1);
      expect(result.modified[0].nodeId).toBe("node1");

      expect(result.computedAt).toBeInstanceOf(Date);
    });

    it("should handle empty trees", () => {
      const emptyRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [],
      };

      const result = compareNodes(emptyRoot, emptyRoot);

      expect(result.added).toHaveLength(0);
      expect(result.deleted).toHaveLength(0);
      expect(result.modified).toHaveLength(0);
    });

    it("should handle complex nested structures", () => {
      const oldRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [
          {
            id: "container1",
            type: "frame",
            properties: {},
            children: [
              { id: "a", type: "text", properties: { content: "A" } },
              { id: "b", type: "text", properties: { content: "B" } },
            ],
          },
          {
            id: "container2",
            type: "frame",
            properties: {},
            children: [{ id: "c", type: "text", properties: { content: "C" } }],
          },
        ],
      };

      const newRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [
          {
            id: "container1",
            type: "frame",
            properties: {},
            children: [
              { id: "a", type: "text", properties: { content: "A Modified" } }, // Modified
              // b deleted
              { id: "d", type: "text", properties: { content: "D" } }, // Added
            ],
          },
          {
            id: "container2",
            type: "frame",
            properties: {},
            children: [{ id: "c", type: "text", properties: { content: "C" } }],
          },
        ],
      };

      const result = compareNodes(oldRoot, newRoot);

      expect(result.added.some((n) => n.nodeId === "d")).toBe(true);
      expect(result.deleted.some((n) => n.nodeId === "b")).toBe(true);
      expect(result.modified.some((n) => n.nodeId === "a")).toBe(true);
    });

    it("should detect node type changes as modifications", () => {
      const oldRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [{ id: "node1", type: "text", properties: { content: "Hello" } }],
      };

      const newRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [
          { id: "node1", type: "rectangle", properties: { width: 100 } }, // Type changed
        ],
      };

      const result = compareNodes(oldRoot, newRoot);

      expect(result.modified).toHaveLength(1);
      expect(result.modified[0].nodeId).toBe("node1");
    });
  });

  describe("Edge Cases", () => {
    it("should handle nodes with no children", () => {
      const oldRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        // No children property
      };

      const newRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: [{ id: "node1", type: "text", properties: {} }],
      };

      const result = compareNodes(oldRoot, newRoot);
      expect(result.added).toHaveLength(1);
    });

    it("should handle identical trees efficiently", () => {
      const largeTree: PenNode = {
        id: "root",
        type: "frame",
        properties: {},
        children: Array.from({ length: 100 }, (_, i) => ({
          id: `node${i}`,
          type: "text",
          properties: { content: `Content ${i}` },
        })),
      };

      const startTime = Date.now();
      const result = compareNodes(largeTree, largeTree);
      const duration = Date.now() - startTime;

      expect(result.added).toHaveLength(0);
      expect(result.deleted).toHaveLength(0);
      expect(result.modified).toHaveLength(0);
      expect(duration).toBeLessThan(100); // Should be fast for identical trees
    });

    it("should handle null/undefined properties gracefully", () => {
      const oldRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {
          value: null,
        },
        children: [],
      };

      const newRoot: PenNode = {
        id: "root",
        type: "frame",
        properties: {
          value: undefined,
        },
        children: [],
      };

      // Should not throw
      expect(() => compareNodes(oldRoot, newRoot)).not.toThrow();
    });
  });
});
