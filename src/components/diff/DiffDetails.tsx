/**
 * Diff Details Component
 *
 * Feature: User Story 3 - Diff Comparison
 * Task: T091
 *
 * Displays detailed information about property changes in a tooltip or panel.
 * Shows what changed, from what value to what value.
 */

"use client";

import { useMemo } from "react";
import type { NodeDiff, PropertyChange } from "@/lib/diff/types";

interface DiffDetailsProps {
  /** The diff to display details for */
  diff: NodeDiff;

  /** Whether to show as tooltip (true) or panel (false) */
  asTooltip?: boolean;

  /** Position for tooltip */
  position?: {
    x: number;
    y: number;
  };

  /** Close handler */
  onClose?: () => void;
}

/**
 * Format a value for display
 */
function formatValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

/**
 * Render a single property change
 */
function PropertyChangeItem({ change }: { change: PropertyChange }) {
  const { property, operation, oldValue, newValue } = change;

  return (
    <div className="property-change-item" style={{ marginBottom: "12px" }}>
      <div
        style={{
          fontWeight: "600",
          fontSize: "13px",
          color: "#374151",
          marginBottom: "4px",
          fontFamily: "monospace",
        }}
      >
        {property}
      </div>

      {operation === "add" && (
        <div style={{ fontSize: "12px", color: "#22c55e" }}>
          <span style={{ opacity: 0.7 }}>Added:</span>{" "}
          <code style={{ backgroundColor: "#f0fdf4", padding: "2px 6px", borderRadius: "3px" }}>
            {formatValue(newValue)}
          </code>
        </div>
      )}

      {operation === "remove" && (
        <div style={{ fontSize: "12px", color: "#ef4444" }}>
          <span style={{ opacity: 0.7 }}>Removed:</span>{" "}
          <code style={{ backgroundColor: "#fef2f2", padding: "2px 6px", borderRadius: "3px" }}>
            {formatValue(oldValue)}
          </code>
        </div>
      )}

      {operation === "replace" && (
        <div style={{ fontSize: "12px" }}>
          <div style={{ color: "#ef4444", marginBottom: "2px" }}>
            <span style={{ opacity: 0.7 }}>From:</span>{" "}
            <code style={{ backgroundColor: "#fef2f2", padding: "2px 6px", borderRadius: "3px" }}>
              {formatValue(oldValue)}
            </code>
          </div>
          <div style={{ color: "#22c55e" }}>
            <span style={{ opacity: 0.7 }}>To:</span>{" "}
            <code style={{ backgroundColor: "#f0fdf4", padding: "2px 6px", borderRadius: "3px" }}>
              {formatValue(newValue)}
            </code>
          </div>
        </div>
      )}
    </div>
  );
}

export function DiffDetails({ diff, asTooltip = true, position, onClose }: DiffDetailsProps) {
  const { nodeId, type, propertyChanges, oldParentId, newParentId, oldIndex, newIndex } = diff;

  const hasPropertyChanges = propertyChanges && propertyChanges.length > 0;
  const isMoved = type === "moved";

  const tooltipStyle = useMemo(() => {
    if (!asTooltip || !position) return {};

    return {
      position: "fixed" as const,
      left: `${position.x}px`,
      top: `${position.y}px`,
      transform: "translate(-50%, -100%)",
      marginTop: "-8px",
      zIndex: 1000,
    };
  }, [asTooltip, position]);

  const containerStyle = {
    ...tooltipStyle,
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "12px 16px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
    maxWidth: "400px",
    minWidth: "250px",
    maxHeight: "400px",
    overflowY: "auto" as const,
  };

  return (
    <div className="diff-details" style={containerStyle}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          paddingBottom: "8px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div>
          <div style={{ fontSize: "14px", fontWeight: "700", color: "#111827" }}>
            {type.charAt(0).toUpperCase() + type.slice(1)} Node
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#6b7280",
              fontFamily: "monospace",
              marginTop: "2px",
            }}
          >
            {nodeId}
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "#6b7280",
              fontSize: "18px",
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>

      {/* Property Changes */}
      {hasPropertyChanges && (
        <div style={{ marginBottom: isMoved ? "12px" : "0" }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#6b7280",
              marginBottom: "8px",
              textTransform: "uppercase" as const,
              letterSpacing: "0.05em",
            }}
          >
            Property Changes
          </div>
          {propertyChanges.map((change, index) => (
            <PropertyChangeItem key={`${change.property}-${index}`} change={change} />
          ))}
        </div>
      )}

      {/* Move Information */}
      {isMoved && (
        <div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#6b7280",
              marginBottom: "8px",
              textTransform: "uppercase" as const,
              letterSpacing: "0.05em",
            }}
          >
            Move Details
          </div>

          {oldParentId !== newParentId && (
            <div style={{ fontSize: "12px", marginBottom: "6px" }}>
              <div style={{ color: "#6b7280", marginBottom: "2px" }}>Parent changed:</div>
              <div style={{ fontFamily: "monospace" }}>
                <span style={{ color: "#ef4444" }}>{oldParentId}</span>
                {" → "}
                <span style={{ color: "#22c55e" }}>{newParentId}</span>
              </div>
            </div>
          )}

          {oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex && (
            <div style={{ fontSize: "12px" }}>
              <div style={{ color: "#6b7280", marginBottom: "2px" }}>Position changed:</div>
              <div>
                Index <span style={{ color: "#ef4444" }}>{oldIndex}</span>
                {" → "}
                <span style={{ color: "#22c55e" }}>{newIndex}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No changes message */}
      {!hasPropertyChanges && type === "modified" && (
        <div style={{ fontSize: "12px", color: "#6b7280", fontStyle: "italic" }}>
          No property changes detected (type changed only)
        </div>
      )}

      {(type === "added" || type === "deleted") && (
        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
          {type === "added" && "This node was added in the new version."}
          {type === "deleted" && "This node was removed in the new version."}
        </div>
      )}
    </div>
  );
}

/**
 * Diff Details Panel: Non-tooltip version for persistent display
 */
interface DiffDetailsPanelProps {
  /** Currently selected diff */
  selectedDiff: NodeDiff | null;

  /** Close handler */
  onClose?: () => void;
}

export function DiffDetailsPanel({ selectedDiff, onClose }: DiffDetailsPanelProps) {
  if (!selectedDiff) {
    return (
      <div
        style={{
          padding: "24px",
          textAlign: "center",
          color: "#6b7280",
          fontSize: "14px",
        }}
      >
        Select a highlighted node to view details
      </div>
    );
  }

  return <DiffDetails diff={selectedDiff} asTooltip={false} onClose={onClose} />;
}
