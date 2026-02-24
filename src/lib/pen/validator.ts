// T044: .pen file validator implementation

import { PenDocument, PenNode } from "@/types/pen";
import { ValidationResult } from "@/types/app";
import { ErrorMessages } from "@/lib/utils/errors";
import { collectNodeIds, traverseNodes } from "./parser";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate .pen file structure and constraints
 * @param penDoc - PenDocument to validate
 * @param fileSize - Optional file size in bytes
 * @returns Validation result
 */
export function validatePenFile(penDoc: PenDocument, fileSize?: number): ValidationResult {
  // Check file size
  if (fileSize && fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: ErrorMessages.FILE_TOO_LARGE,
    };
  }

  // Check required fields
  if (!penDoc.version) {
    return {
      valid: false,
      error: "缺少 version 欄位",
    };
  }

  if (!Array.isArray(penDoc.children)) {
    return {
      valid: false,
      error: "children 必須是陣列",
    };
  }

  // Validate all child nodes
  if (penDoc.children) {
    for (const child of penDoc.children) {
      const childValidation = validateNode(child);
      if (!childValidation.valid) {
        return childValidation;
      }
    }
  }

  // Check for duplicate node IDs
  const duplicateCheck = checkDuplicateIds(penDoc);
  if (!duplicateCheck.valid) {
    return duplicateCheck;
  }

  // Check for circular references (if using ref nodes)
  const circularCheck = checkCircularReferences(penDoc);
  if (!circularCheck.valid) {
    return circularCheck;
  }

  return { valid: true };
}

/**
 * Validate a single node
 * @param node - Node to validate
 * @returns Validation result
 */
export function validateNode(node: PenNode): ValidationResult {
  // Check required fields
  if (!node.id) {
    return {
      valid: false,
      error: "節點缺少 id 欄位",
    };
  }

  if (!node.type) {
    return {
      valid: false,
      error: `節點 ${node.id} 缺少 type 欄位`,
    };
  }

  // Validate node type
  const validTypes = [
    "frame",
    "group",
    "rectangle",
    "ellipse",
    "line",
    "polygon",
    "path",
    "text",
    "connection",
    "note",
    "icon_font",
    "image",
    "ref",
  ];

  if (!validTypes.includes(node.type)) {
    return {
      valid: false,
      error: `節點 ${node.id} 有無效的 type: ${node.type}`,
    };
  }

  // Validate ref nodes have ref property
  if (node.type === "ref" && !node.ref) {
    return {
      valid: false,
      error: `ref 節點 ${node.id} 缺少 ref 屬性`,
    };
  }

  // Validate numeric properties
  if (node.x !== undefined && typeof node.x !== "number") {
    return {
      valid: false,
      error: `節點 ${node.id} 的 x 屬性必須是數字`,
    };
  }

  if (node.y !== undefined && typeof node.y !== "number") {
    return {
      valid: false,
      error: `節點 ${node.id} 的 y 屬性必須是數字`,
    };
  }

  // Recursively validate children
  if (node.children) {
    for (const child of node.children) {
      const childValidation = validateNode(child);
      if (!childValidation.valid) {
        return childValidation;
      }
    }
  }

  return { valid: true };
}

/**
 * Check for duplicate node IDs
 * @param penDoc - PenDocument to check
 * @returns Validation result
 */
export function checkDuplicateIds(penDoc: PenDocument): ValidationResult {
  const ids = collectNodeIds(penDoc);
  const idArray: string[] = [];

  if (penDoc.children) {
    for (const child of penDoc.children) {
      traverseNodes(child, (node) => {
        idArray.push(node.id);
      });
    }
  }

  if (ids.size !== idArray.length) {
    return {
      valid: false,
      error: "文件中存在重複的節點 ID",
    };
  }

  return { valid: true };
}

/**
 * Check for circular references in ref nodes
 * @param penDoc - PenDocument to check
 * @returns Validation result
 */
export function checkCircularReferences(penDoc: PenDocument): ValidationResult {
  const visited = new Set<string>();
  const refMap = new Map<string, string>();

  // Build ref map
  if (penDoc.children) {
    for (const child of penDoc.children) {
      traverseNodes(child, (node) => {
        if (node.type === "ref" && node.ref) {
          refMap.set(node.id, node.ref);
        }
      });
    }
  }

  // Check for cycles
  for (const [nodeId, refId] of refMap.entries()) {
    visited.clear();
    let current = refId;

    while (current) {
      if (visited.has(current)) {
        return {
          valid: false,
          error: `檢測到循環引用: ${nodeId} → ${current}`,
        };
      }

      visited.add(current);
      current = refMap.get(current) || "";
    }
  }

  return { valid: true };
}

/**
 * Validate file size
 * @param content - File content string
 * @returns Validation result
 */
export function validateFileSize(content: string): ValidationResult {
  const sizeInBytes = new Blob([content]).size;

  if (sizeInBytes > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: ErrorMessages.FILE_TOO_LARGE,
    };
  }

  return { valid: true };
}

/**
 * Validate node structure (for specific node types)
 * @param node - Node to validate
 * @param nodeType - Expected node type
 * @returns Validation result
 */
export function validateNodeStructure(node: PenNode, nodeType: string): ValidationResult {
  if (node.type !== nodeType) {
    return {
      valid: false,
      error: `預期節點類型為 ${nodeType}，實際為 ${node.type}`,
    };
  }

  // Type-specific validation
  switch (nodeType) {
    case "text":
      if (!node.content) {
        return {
          valid: false,
          error: "text 節點缺少 content 屬性",
        };
      }
      break;

    case "ref":
      if (!node.ref) {
        return {
          valid: false,
          error: "ref 節點缺少 ref 屬性",
        };
      }
      break;
  }

  return { valid: true };
}
