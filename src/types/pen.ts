// .pen file structure types based on contracts/pen-file.md

export interface PenDocument {
  version: string;
  children?: PenNode[];
  metadata?: PenMetadata;
}

export interface PenMetadata {
  createdAt?: string; // ISO 8601
  modifiedAt?: string; // ISO 8601
  author?: string;
  title?: string;
  description?: string;
}

export type PenNodeType =
  | "frame"
  | "group"
  | "rectangle"
  | "ellipse"
  | "line"
  | "polygon"
  | "path"
  | "text"
  | "connection"
  | "note"
  | "icon_font"
  | "image"
  | "ref" // component instance
  | string; // Allow other types for extensibility

export interface PenNode {
  id: string;
  type: string | PenNodeType;
  name?: string;
  visible?: boolean;
  locked?: boolean;

  // Layout properties
  x?: number;
  y?: number;
  width?: number | string; // can be "fill_container", "hug_content", or number
  height?: number | string;
  rotation?: number;

  // Visual properties
  fill?: string | PenFill[] | PenFill;
  stroke?: PenStroke[];
  opacity?: number;
  blendMode?: string;
  cornerRadius?: number | number[]; // for rectangles
  clip?: boolean; // for frames

  // Layout-specific properties (for frames)
  layout?: "none" | "horizontal" | "vertical" | "grid";
  gap?: number;
  padding?: number | number[];

  // Text-specific properties
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  textAlign?: "left" | "center" | "right" | "justify";
  textColor?: string;

  // Component-specific properties
  ref?: string; // for component instances
  reusable?: boolean; // marks this as a component definition

  // Hierarchy
  children?: PenNode[];

  // Other properties
  properties?: Record<string, unknown>;
}

export interface PenFill {
  type: "solid" | "gradient" | "image";
  color?: string;
  opacity?: number;
  gradientStops?: Array<{
    color: string;
    position: number;
  }>;
  // Image fill properties
  imageUrl?: string; // Standard property
  url?: string; // Alternative property used by Pencil
  enabled?: boolean;
  mode?: string;
}

export interface PenStroke {
  color: string;
  thickness: number;
  position?: "inside" | "outside" | "center";
  style?: "solid" | "dashed" | "dotted";
}

// Screenshot request/response types for Pencil MCP integration
export interface PenScreenshotRequest {
  penContent: string; // JSON stringified .pen file
  nodeId?: string; // optional: screenshot specific node
  width?: number;
  height?: number;
  // GitHub repo context for resolving relative image paths
  repoContext?: {
    owner: string;
    repo: string;
    ref: string; // branch or commit SHA
  };
}

export interface PenScreenshotResponse {
  imageData: string; // base64 encoded PNG
  width: number;
  height: number;
  generatedAt: string; // ISO 8601
}
