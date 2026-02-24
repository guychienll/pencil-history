/**
 * Diff Highlight Component
 *
 * Feature: User Story 3 - Diff Comparison
 * Task: T089
 *
 * Renders visual highlights (overlays) for nodes that have changed.
 * - Green for added nodes
 * - Red for deleted nodes
 * - Yellow for modified nodes
 * - Blue for moved nodes
 */

"use client";

import { useMemo } from "react";
import type { NodeDiff } from "@/lib/diff/types";

interface DiffHighlightProps {
  /** The diff information for this node */
  diff: NodeDiff;

  /** Bounding box coordinates for positioning the highlight */
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  /** Whether to show the label */
  showLabel?: boolean;

  /** Opacity of the highlight (0-1) */
  opacity?: number;

  /** Z-index for layering */
  zIndex?: number;

  /** Click handler */
  onClick?: (diff: NodeDiff) => void;
}

/**
 * Color schemes for each diff type
 */
const DIFF_COLORS = {
  added: {
    bg: "rgba(34, 197, 94, 0.2)", // green-500 with opacity
    border: "#22c55e", // green-500
    label: "Added",
    labelBg: "#22c55e",
    textColor: "#ffffff",
  },
  deleted: {
    bg: "rgba(239, 68, 68, 0.2)", // red-500 with opacity
    border: "#ef4444", // red-500
    label: "Deleted",
    labelBg: "#ef4444",
    textColor: "#ffffff",
  },
  modified: {
    bg: "rgba(251, 191, 36, 0.2)", // yellow-500 with opacity
    border: "#fbbf24", // yellow-500
    label: "Modified",
    labelBg: "#fbbf24",
    textColor: "#000000",
  },
  moved: {
    bg: "rgba(59, 130, 246, 0.2)", // blue-500 with opacity
    border: "#3b82f6", // blue-500
    label: "Moved",
    labelBg: "#3b82f6",
    textColor: "#ffffff",
  },
};

export function DiffHighlight({
  diff,
  boundingBox,
  showLabel = true,
  opacity = 0.3,
  zIndex = 100,
  onClick,
}: DiffHighlightProps) {
  const colors = useMemo(() => {
    return DIFF_COLORS[diff.type];
  }, [diff.type]);

  const style = useMemo(
    () => ({
      position: "absolute" as const,
      left: `${boundingBox.x}px`,
      top: `${boundingBox.y}px`,
      width: `${boundingBox.width}px`,
      height: `${boundingBox.height}px`,
      backgroundColor: colors.bg,
      border: `2px solid ${colors.border}`,
      borderRadius: "4px",
      pointerEvents: onClick ? ("auto" as const) : ("none" as const),
      cursor: onClick ? "pointer" : "default",
      zIndex,
      opacity,
      transition: "opacity 0.2s ease-in-out, transform 0.2s ease-in-out",
      boxShadow: `0 0 0 1px ${colors.border}40`, // Subtle glow
    }),
    [boundingBox, colors, opacity, zIndex, onClick]
  );

  const labelStyle = useMemo(
    () => ({
      position: "absolute" as const,
      top: "-24px",
      left: "0",
      backgroundColor: colors.labelBg,
      color: colors.textColor,
      padding: "2px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "600" as const,
      whiteSpace: "nowrap" as const,
      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
    }),
    [colors]
  );

  const handleClick = () => {
    if (onClick) {
      onClick(diff);
    }
  };

  return (
    <div
      className="diff-highlight"
      style={style}
      onClick={handleClick}
      role="button"
      tabIndex={onClick ? 0 : -1}
      aria-label={`${colors.label} node: ${diff.nodeId}`}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {showLabel && (
        <div style={labelStyle} className="diff-label">
          {colors.label}
        </div>
      )}

      {/* Pattern overlay for color-blind accessibility */}
      {diff.type === "added" && (
        <svg
          width="100%"
          height="100%"
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        >
          <defs>
            <pattern
              id={`pattern-added-${diff.nodeId}`}
              patternUnits="userSpaceOnUse"
              width="8"
              height="8"
              patternTransform="rotate(45)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="8"
                stroke={colors.border}
                strokeWidth="2"
                opacity="0.3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#pattern-added-${diff.nodeId})`} />
        </svg>
      )}

      {diff.type === "deleted" && (
        <svg
          width="100%"
          height="100%"
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        >
          <line
            x1="0"
            y1="0"
            x2="100%"
            y2="100%"
            stroke={colors.border}
            strokeWidth="2"
            opacity="0.5"
          />
          <line
            x1="100%"
            y1="0"
            x2="0"
            y2="100%"
            stroke={colors.border}
            strokeWidth="2"
            opacity="0.5"
          />
        </svg>
      )}
    </div>
  );
}

/**
 * DiffHighlightLayer: Renders all highlights for a set of diffs
 */
interface DiffHighlightLayerProps {
  /** All diffs to render */
  diffs: NodeDiff[];

  /** Function to get bounding box for a node ID */
  getBoundingBox: (
    nodeId: string
  ) => { x: number; y: number; width: number; height: number } | null;

  /** Filter to show only specific diff types */
  visibleTypes?: Array<"added" | "deleted" | "modified" | "moved">;

  /** Callback when a highlight is clicked */
  onHighlightClick?: (diff: NodeDiff) => void;
}

export function DiffHighlightLayer({
  diffs,
  getBoundingBox,
  visibleTypes = ["added", "deleted", "modified", "moved"],
  onHighlightClick,
}: DiffHighlightLayerProps) {
  const visibleDiffs = useMemo(() => {
    return diffs.filter((d) => visibleTypes.includes(d.type));
  }, [diffs, visibleTypes]);

  return (
    <div
      className="diff-highlight-layer"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        zIndex: 1000,
      }}
      aria-label="Diff highlights layer"
    >
      {visibleDiffs.map((diff) => {
        const bbox = getBoundingBox(diff.nodeId);
        if (!bbox) return null;

        return (
          <DiffHighlight
            key={diff.nodeId}
            diff={diff}
            boundingBox={bbox}
            onClick={onHighlightClick}
          />
        );
      })}
    </div>
  );
}
