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
    <div className="mb-3">
      <div className="font-semibold text-sm text-foreground mb-1 font-mono">{property}</div>

      {operation === "add" && (
        <div className="text-xs text-success">
          <span className="opacity-70">Added:</span>{" "}
          <code className="bg-success-light px-1.5 py-0.5 rounded">{formatValue(newValue)}</code>
        </div>
      )}

      {operation === "remove" && (
        <div className="text-xs text-error">
          <span className="opacity-70">Removed:</span>{" "}
          <code className="bg-error-light px-1.5 py-0.5 rounded">{formatValue(oldValue)}</code>
        </div>
      )}

      {operation === "replace" && (
        <div className="text-xs">
          <div className="text-error mb-0.5">
            <span className="opacity-70">From:</span>{" "}
            <code className="bg-error-light px-1.5 py-0.5 rounded">{formatValue(oldValue)}</code>
          </div>
          <div className="text-success">
            <span className="opacity-70">To:</span>{" "}
            <code className="bg-success-light px-1.5 py-0.5 rounded">{formatValue(newValue)}</code>
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

  const containerClasses = `bg-surface border border-border rounded-lg p-4 shadow-lg max-w-[400px] min-w-[250px] max-h-[400px] overflow-y-auto ${asTooltip ? "fixed" : ""}`;

  return (
    <div className={containerClasses} style={tooltipStyle}>
      {/* Header */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <div>
          <div className="text-sm font-bold text-foreground">
            {type.charAt(0).toUpperCase() + type.slice(1)} Node
          </div>
          <div className="text-xs text-foreground-secondary font-mono mt-0.5">{nodeId}</div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer p-1 text-foreground-secondary hover:text-foreground text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>

      {/* Property Changes */}
      {hasPropertyChanges && (
        <div className={isMoved ? "mb-3" : ""}>
          <div className="text-xs font-semibold text-foreground-secondary mb-2 uppercase tracking-wider">
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
          <div className="text-xs font-semibold text-foreground-secondary mb-2 uppercase tracking-wider">
            Move Details
          </div>

          {oldParentId !== newParentId && (
            <div className="text-xs mb-1.5">
              <div className="text-foreground-secondary mb-0.5">Parent changed:</div>
              <div className="font-mono">
                <span className="text-error">{oldParentId}</span>
                {" → "}
                <span className="text-success">{newParentId}</span>
              </div>
            </div>
          )}

          {oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex && (
            <div className="text-xs">
              <div className="text-foreground-secondary mb-0.5">Position changed:</div>
              <div>
                Index <span className="text-error">{oldIndex}</span>
                {" → "}
                <span className="text-success">{newIndex}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No changes message */}
      {!hasPropertyChanges && type === "modified" && (
        <div className="text-xs text-foreground-secondary italic">
          No property changes detected (type changed only)
        </div>
      )}

      {(type === "added" || type === "deleted") && (
        <div className="text-xs text-foreground-secondary mt-2">
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
      <div className="p-6 text-center text-foreground-secondary text-sm">
        Select a highlighted node to view details
      </div>
    );
  }

  return <DiffDetails diff={selectedDiff} asTooltip={false} onClose={onClose} />;
}
