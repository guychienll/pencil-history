/**
 * Diff Result Types
 *
 * Feature: User Story 3 - Diff Comparison
 * Task: T087
 *
 * Defines types for representing differences between two .pen file node trees.
 */

import type { PenNode } from "@/types/pen";

/**
 * Type of change detected in the diff
 */
export type DiffType = "added" | "deleted" | "modified" | "moved";

/**
 * Operation type for property changes
 */
export type PropertyOperation = "add" | "remove" | "replace";

/**
 * Represents a change to a single property
 */
export interface PropertyChange {
  /** Property name (JSON pointer format for nested properties) */
  property: string;

  /** Type of operation performed */
  operation: PropertyOperation;

  /** Previous value (undefined for 'add' operation) */
  oldValue?: unknown;

  /** New value (undefined for 'remove' operation) */
  newValue?: unknown;
}

/**
 * Represents a difference in a single node
 */
export interface NodeDiff {
  /** ID of the changed node */
  nodeId: string;

  /** Type of change */
  type: DiffType;

  /** Path from root to this node (array of node IDs) */
  path: string[];

  /** Old node state (for 'deleted' and 'modified') */
  oldNode?: PenNode;

  /** New node state (for 'added' and 'modified') */
  newNode?: PenNode;

  /** Detailed property changes (for 'modified' only) */
  propertyChanges?: PropertyChange[];

  /** Previous parent ID (for 'moved') */
  oldParentId?: string;

  /** New parent ID (for 'moved') */
  newParentId?: string;

  /** Previous index in parent's children (for 'moved') */
  oldIndex?: number;

  /** New index in parent's children (for 'moved') */
  newIndex?: number;
}

/**
 * Complete diff result between two .pen file versions
 */
export interface DiffResult {
  /** SHA of the "from" commit */
  fromSha: string;

  /** SHA of the "to" commit */
  toSha: string;

  /** Nodes that were added */
  added: NodeDiff[];

  /** Nodes that were deleted */
  deleted: NodeDiff[];

  /** Nodes that were modified */
  modified: NodeDiff[];

  /** Nodes that were moved */
  moved: NodeDiff[];

  /** Timestamp when diff was computed */
  computedAt: Date;
}

/**
 * Statistics about the diff
 */
export interface DiffStats {
  /** Total number of changes */
  totalChanges: number;

  /** Number of added nodes */
  addedCount: number;

  /** Number of deleted nodes */
  deletedCount: number;

  /** Number of modified nodes */
  modifiedCount: number;

  /** Number of moved nodes */
  movedCount: number;

  /** Number of property changes across all modified nodes */
  propertyChangesCount: number;
}

/**
 * Options for diff computation
 */
export interface DiffOptions {
  /** Whether to detect moved nodes (more expensive) */
  detectMoves?: boolean;

  /** Whether to include full node objects in diff */
  includeFullNodes?: boolean;

  /** Maximum depth to traverse (-1 for unlimited) */
  maxDepth?: number;

  /** Properties to ignore when detecting modifications */
  ignoreProperties?: string[];

  /** Custom equality function for property comparison */
  propertyEquals?: (oldValue: unknown, newValue: unknown) => boolean;
}

/**
 * Cache key for diff results
 */
export interface DiffCacheKey {
  fromSha: string;
  toSha: string;
}

/**
 * Helper to create a diff cache key
 */
export function createDiffCacheKey(fromSha: string, toSha: string): string {
  return `diff:${fromSha}:${toSha}`;
}

/**
 * Helper to extract diff statistics from a DiffResult
 */
export function getDiffStats(diff: DiffResult): DiffStats {
  const propertyChangesCount = diff.modified.reduce(
    (sum, node) => sum + (node.propertyChanges?.length || 0),
    0
  );

  return {
    totalChanges:
      diff.added.length + diff.deleted.length + diff.modified.length + diff.moved.length,
    addedCount: diff.added.length,
    deletedCount: diff.deleted.length,
    modifiedCount: diff.modified.length,
    movedCount: diff.moved.length,
    propertyChangesCount,
  };
}

/**
 * Helper to check if a diff has any changes
 */
export function hasChanges(diff: DiffResult): boolean {
  return (
    diff.added.length > 0 ||
    diff.deleted.length > 0 ||
    diff.modified.length > 0 ||
    diff.moved.length > 0
  );
}

/**
 * Helper to filter diffs by type
 */
export function filterDiffsByType(diffs: NodeDiff[], types: DiffType[]): NodeDiff[] {
  return diffs.filter((diff) => types.includes(diff.type));
}

/**
 * Helper to find a specific node diff by ID
 */
export function findNodeDiff(diff: DiffResult, nodeId: string): NodeDiff | undefined {
  return [...diff.added, ...diff.deleted, ...diff.modified, ...diff.moved].find(
    (d) => d.nodeId === nodeId
  );
}
