// T043: .pen file parser implementation

import { PenDocument, PenNode } from "@/types/pen";
import { PenFileError, ErrorMessages } from "@/lib/utils/errors";

/**
 * Parse .pen file content from JSON string
 * @param content - JSON string of .pen file
 * @returns Parsed PenDocument
 * @throws PenFileError if parsing fails
 */
export function parsePenFile(content: string): PenDocument {
  try {
    const parsed = JSON.parse(content);

    // Basic structure validation
    if (!parsed.version) {
      throw new Error("缺少 version 欄位");
    }

    // Validate children array exists and is valid
    if (!Array.isArray(parsed.children)) {
      throw new Error("children 必須是陣列");
    }

    // Validate each child node has required fields
    for (const child of parsed.children) {
      if (!child.id || !child.type) {
        throw new Error("子節點缺少必要欄位 (id, type)");
      }
    }

    return parsed as PenDocument;
  } catch (error) {
    if (error instanceof Error) {
      throw new PenFileError(`${ErrorMessages.PARSE_ERROR}: ${error.message}`);
    }
    throw new PenFileError(ErrorMessages.PARSE_ERROR);
  }
}

/**
 * Convert .pen document back to JSON string
 * @param penDoc - PenDocument object
 * @returns JSON string
 */
export function stringifyPenFile(penDoc: PenDocument): string {
  return JSON.stringify(penDoc, null, 2);
}

/**
 * Traverse .pen node tree and apply function to each node
 * @param node - Starting node
 * @param fn - Function to apply to each node
 */
export function traverseNodes(
  node: PenNode,
  fn: (node: PenNode, path: string[]) => void,
  path: string[] = []
): void {
  fn(node, path);

  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      traverseNodes(child, fn, [...path, child.id]);
    }
  }
}

/**
 * Find node by ID in .pen document
 * @param penDoc - PenDocument to search
 * @param nodeId - Node ID to find
 * @returns Found node or undefined
 */
export function findNodeById(penDoc: PenDocument, nodeId: string): PenNode | undefined {
  let found: PenNode | undefined;

  if (penDoc.children) {
    for (const child of penDoc.children) {
      traverseNodes(child, (node) => {
        if (node.id === nodeId) {
          found = node;
        }
      });
      if (found) break;
    }
  }

  return found;
}

/**
 * Collect all node IDs in document
 * @param penDoc - PenDocument
 * @returns Set of all node IDs
 */
export function collectNodeIds(penDoc: PenDocument): Set<string> {
  const ids = new Set<string>();

  if (penDoc.children) {
    for (const child of penDoc.children) {
      traverseNodes(child, (node) => {
        ids.add(node.id);
      });
    }
  }

  return ids;
}

/**
 * Get node by path (array of IDs from root)
 * @param penDoc - PenDocument
 * @param path - Array of node IDs
 * @returns Found node or undefined
 */
export function getNodeByPath(penDoc: PenDocument, path: string[]): PenNode | undefined {
  if (path.length === 0 || !penDoc.children) {
    return undefined;
  }

  // Find the first node in path from children
  let current: PenNode | undefined = penDoc.children.find((child) => child.id === path[0]);

  if (!current) {
    return undefined;
  }

  // Traverse remaining path
  for (let i = 1; i < path.length; i++) {
    const id = path[i];
    if (!current.children) {
      return undefined;
    }

    current = current.children.find((child) => child.id === id);

    if (!current) {
      return undefined;
    }
  }

  return current;
}

/**
 * Count total nodes in document
 * @param penDoc - PenDocument
 * @returns Total node count
 */
export function countNodes(penDoc: PenDocument): number {
  let count = 0;

  if (penDoc.children) {
    for (const child of penDoc.children) {
      traverseNodes(child, () => {
        count++;
      });
    }
  }

  return count;
}

/**
 * Convert PenDocument to a single root PenNode for diff comparison
 * Creates a virtual root node that contains the document's children
 * @param penDoc - PenDocument
 * @returns Virtual root PenNode
 */
export function documentToRootNode(penDoc: PenDocument): PenNode {
  return {
    id: "__document_root__",
    type: "document",
    properties: {
      version: penDoc.version,
    },
    children: penDoc.children || [],
  };
}
