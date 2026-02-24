// Core application types based on data-model.md

export interface PenFile {
  owner: string;
  repo: string;
  path: string;
  branch: string;
  size?: number;
  url: string;
}

export interface Repository {
  owner: string;
  name: string;
  fullName: string;
  branch: string;
  isPrivate: boolean;
  url: string;
}

export interface Author {
  name: string;
  email: string;
  date: Date;
}

export interface Commit {
  sha: string;
  message: string;
  author: Author;
  committer: Author;
  date: Date;
  parents: string[];
  url: string;
}

export interface PenNode {
  id: string;
  type: string;
  properties: Record<string, unknown>;
  children?: PenNode[];
}

export interface PenFileContent {
  version: string;
  root: PenNode;
  metadata?: {
    createdAt?: string;
    modifiedAt?: string;
    author?: string;
    title?: string;
    description?: string;
  };
}

export interface FileVersion {
  sha: string;
  content: PenFileContent;
  size: number;
  encoding?: string;
  rawContent?: string;
}

export interface RenderedNode {
  id: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  visible: boolean;
}

export interface VisualDesign {
  sha: string;
  screenshotUrl?: string;
  renderedNodes?: RenderedNode[];
  width: number;
  height: number;
  generatedAt: Date;
}

export interface PropertyChange {
  property: string;
  operation: "add" | "remove" | "replace";
  oldValue?: unknown;
  newValue?: unknown;
}

export interface NodeDiff {
  nodeId: string;
  type: "added" | "deleted" | "modified" | "moved";
  path: string[];
  oldNode?: PenNode;
  newNode?: PenNode;
  propertyChanges?: PropertyChange[];
}

export interface DiffComparison {
  fromSha: string;
  toSha: string;
  added: NodeDiff[];
  deleted: NodeDiff[];
  modified: NodeDiff[];
  moved: NodeDiff[];
  computedAt: Date;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}
