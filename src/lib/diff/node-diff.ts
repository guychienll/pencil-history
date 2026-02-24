/**
 * Node-Level Structural Diff Algorithm
 *
 * Feature: User Story 3 - Diff Comparison
 * Task: T086
 *
 * Implements tree diff algorithm to compare two .pen file node trees
 * and identify added, deleted, modified, and moved nodes.
 */

import type { PenNode } from "@/types/pen";
import type { NodeDiff, DiffResult, DiffOptions, PropertyChange } from "./types";

/**
 * Build a map of node ID to node for quick lookup
 */
function buildNodeMap(root: PenNode | undefined): Map<string, { node: PenNode; path: string[] }> {
  const map = new Map<string, { node: PenNode; path: string[] }>();

  // Guard against undefined root
  if (!root) {
    return map;
  }

  function traverse(node: PenNode, currentPath: string[]): void {
    // Guard against missing node.id
    if (!node.id) {
      console.warn("Node missing id property:", node);
      return;
    }

    map.set(node.id, { node, path: currentPath });

    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => {
        traverse(child, [...currentPath, child.id]);
      });
    }
  }

  traverse(root, [root.id]);
  return map;
}

/**
 * Deep equality check for values
 */
function deepEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === "object") {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, idx) => deepEquals(val, b[idx]));
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    const objA = a as Record<string, unknown>;
    const objB = b as Record<string, unknown>;
    return keysA.every((key) => deepEquals(objA[key], objB[key]));
  }

  return false;
}

/**
 * Compare two node property objects and identify changes
 */
function compareProperties(
  oldProps: Record<string, unknown>,
  newProps: Record<string, unknown>,
  options?: DiffOptions
): PropertyChange[] {
  const changes: PropertyChange[] = [];
  const ignoreProps = new Set(options?.ignoreProperties || []);
  const equals = options?.propertyEquals || deepEquals;

  // Get all unique property keys
  const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);

  for (const key of allKeys) {
    if (ignoreProps.has(key)) continue;

    const oldValue = oldProps[key];
    const newValue = newProps[key];

    const hasOld = key in oldProps;
    const hasNew = key in newProps;

    if (!hasOld && hasNew) {
      // Property added
      changes.push({
        property: key,
        operation: "add",
        newValue,
      });
    } else if (hasOld && !hasNew) {
      // Property removed
      changes.push({
        property: key,
        operation: "remove",
        oldValue,
      });
    } else if (hasOld && hasNew && !equals(oldValue, newValue)) {
      // Property modified
      changes.push({
        property: key,
        operation: "replace",
        oldValue,
        newValue,
      });
    }
  }

  return changes;
}

/**
 * Detect nodes that were added in the new tree
 */
export function detectAdded(
  oldRoot: PenNode | undefined,
  newRoot: PenNode | undefined,
  options?: DiffOptions
): NodeDiff[] {
  if (!oldRoot || !newRoot) return [];

  const oldMap = buildNodeMap(oldRoot);
  const newMap = buildNodeMap(newRoot);
  const added: NodeDiff[] = [];

  for (const [nodeId, { node, path }] of newMap) {
    if (!oldMap.has(nodeId)) {
      added.push({
        nodeId,
        type: "added",
        path,
        newNode: options?.includeFullNodes ? node : undefined,
      });
    }
  }

  return added;
}

/**
 * Detect nodes that were deleted from the old tree
 */
export function detectDeleted(
  oldRoot: PenNode | undefined,
  newRoot: PenNode | undefined,
  options?: DiffOptions
): NodeDiff[] {
  if (!oldRoot || !newRoot) return [];

  const oldMap = buildNodeMap(oldRoot);
  const newMap = buildNodeMap(newRoot);
  const deleted: NodeDiff[] = [];

  for (const [nodeId, { node, path }] of oldMap) {
    if (!newMap.has(nodeId)) {
      deleted.push({
        nodeId,
        type: "deleted",
        path,
        oldNode: options?.includeFullNodes ? node : undefined,
      });
    }
  }

  return deleted;
}

/**
 * Detect nodes that were modified between old and new tree
 */
export function detectModified(
  oldRoot: PenNode | undefined,
  newRoot: PenNode | undefined,
  options?: DiffOptions
): NodeDiff[] {
  if (!oldRoot || !newRoot) return [];

  const oldMap = buildNodeMap(oldRoot);
  const newMap = buildNodeMap(newRoot);
  const modified: NodeDiff[] = [];

  for (const [nodeId, { node: newNode, path: newPath }] of newMap) {
    const oldEntry = oldMap.get(nodeId);

    if (!oldEntry) continue; // This is an added node, not modified

    const oldNode = oldEntry.node;

    // Check if node type changed
    if (oldNode.type !== newNode.type) {
      modified.push({
        nodeId,
        type: "modified",
        path: newPath,
        oldNode: options?.includeFullNodes ? oldNode : undefined,
        newNode: options?.includeFullNodes ? newNode : undefined,
        propertyChanges: [
          {
            property: "type",
            operation: "replace",
            oldValue: oldNode.type,
            newValue: newNode.type,
          },
        ],
      });
      continue;
    }

    // Compare properties
    const propertyChanges = compareProperties(
      oldNode.properties || {},
      newNode.properties || {},
      options
    );

    if (propertyChanges.length > 0) {
      modified.push({
        nodeId,
        type: "modified",
        path: newPath,
        oldNode: options?.includeFullNodes ? oldNode : undefined,
        newNode: options?.includeFullNodes ? newNode : undefined,
        propertyChanges,
      });
    }
  }

  return modified;
}

/**
 * Detect nodes that were moved (changed parent or position)
 * This is more expensive as it requires tracking parent relationships
 */
export function detectMoved(
  oldRoot: PenNode | undefined,
  newRoot: PenNode | undefined,
  options?: DiffOptions
): NodeDiff[] {
  if (options?.detectMoves === false) return [];
  if (!oldRoot || !newRoot) return [];

  const moved: NodeDiff[] = [];

  // Build parent maps
  const oldParentMap = new Map<string, { parentId: string; index: number }>();
  const newParentMap = new Map<string, { parentId: string; index: number }>();

  function buildParentMap(
    node: PenNode,
    map: Map<string, { parentId: string; index: number }>
  ): void {
    if (node.children) {
      node.children.forEach((child, index) => {
        map.set(child.id, { parentId: node.id, index });
        buildParentMap(child, map);
      });
    }
  }

  buildParentMap(oldRoot, oldParentMap);
  buildParentMap(newRoot, newParentMap);

  const oldMap = buildNodeMap(oldRoot);
  const newMap = buildNodeMap(newRoot);

  // Check each node that exists in both trees
  for (const [nodeId, { path: newPath }] of newMap) {
    if (!oldMap.has(nodeId)) continue; // Added node, not moved

    const oldParent = oldParentMap.get(nodeId);
    const newParent = newParentMap.get(nodeId);

    if (!oldParent || !newParent) continue; // Root node

    // Check if parent or position changed
    if (oldParent.parentId !== newParent.parentId || oldParent.index !== newParent.index) {
      moved.push({
        nodeId,
        type: "moved",
        path: newPath,
        oldParentId: oldParent.parentId,
        newParentId: newParent.parentId,
        oldIndex: oldParent.index,
        newIndex: newParent.index,
      });
    }
  }

  return moved;
}

/**
 * Main function: Compare two .pen file node trees and return complete diff
 */
export function compareNodes(
  oldRoot: PenNode | undefined,
  newRoot: PenNode | undefined,
  fromSha: string = "",
  toSha: string = "",
  options: DiffOptions = {}
): DiffResult {
  // Validate inputs
  if (!oldRoot || !newRoot) {
    console.error("compareNodes: Invalid input - root nodes are undefined", {
      oldRoot: !!oldRoot,
      newRoot: !!newRoot,
    });

    return {
      fromSha,
      toSha,
      added: [],
      deleted: [],
      modified: [],
      moved: [],
      computedAt: new Date(),
    };
  }

  if (!oldRoot.id || !newRoot.id) {
    console.error("compareNodes: Invalid input - root nodes missing id", {
      oldRootId: oldRoot.id,
      newRootId: newRoot.id,
    });

    return {
      fromSha,
      toSha,
      added: [],
      deleted: [],
      modified: [],
      moved: [],
      computedAt: new Date(),
    };
  }

  const defaultOptions: DiffOptions = {
    detectMoves: true,
    includeFullNodes: true,
    maxDepth: -1,
    ignoreProperties: [],
    ...options,
  };

  const added = detectAdded(oldRoot, newRoot, defaultOptions);
  const deleted = detectDeleted(oldRoot, newRoot, defaultOptions);
  const modified = detectModified(oldRoot, newRoot, defaultOptions);
  const moved = detectMoved(oldRoot, newRoot, defaultOptions);

  return {
    fromSha,
    toSha,
    added,
    deleted,
    modified,
    moved,
    computedAt: new Date(),
  };
}

/**
 * Helper: Get all changed node IDs
 */
export function getAllChangedNodeIds(diff: DiffResult): Set<string> {
  const ids = new Set<string>();

  diff.added.forEach((d) => ids.add(d.nodeId));
  diff.deleted.forEach((d) => ids.add(d.nodeId));
  diff.modified.forEach((d) => ids.add(d.nodeId));
  diff.moved.forEach((d) => ids.add(d.nodeId));

  return ids;
}

/**
 * Helper: Check if a specific node changed
 */
export function hasNodeChanged(diff: DiffResult, nodeId: string): boolean {
  return getAllChangedNodeIds(diff).has(nodeId);
}

/**
 * Helper: Get change type for a specific node
 */
export function getNodeChangeType(
  diff: DiffResult,
  nodeId: string
): "added" | "deleted" | "modified" | "moved" | null {
  if (diff.added.some((d) => d.nodeId === nodeId)) return "added";
  if (diff.deleted.some((d) => d.nodeId === nodeId)) return "deleted";
  if (diff.modified.some((d) => d.nodeId === nodeId)) return "modified";
  if (diff.moved.some((d) => d.nodeId === nodeId)) return "moved";
  return null;
}
