/**
 * Diff View Component
 *
 * Feature: User Story 3 - Diff Comparison
 * Task: T090
 *
 * Provides side-by-side comparison view of two .pen file versions.
 * Shows "before" and "after" views with synchronized scrolling and highlights.
 */

"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import type { DiffResult } from "@/lib/diff/types";
import type { Commit, FileVersion } from "@/types/app";
import { PenRenderer } from "@/components/viewer/PenRenderer";
import { DiffHighlightLayer } from "./DiffHighlight";
import { DiffDetailsPanel } from "./DiffDetails";
import type { NodeDiff } from "@/lib/diff/types";
import { useScreenshot } from "@/hooks/useScreenshot";
import type { PenNode } from "@/types/pen";

interface DiffViewProps {
  /** The diff result */
  diff: DiffResult;

  /** "Before" commit */
  fromCommit: Commit;

  /** "After" commit */
  toCommit: Commit;

  /** "Before" file version */
  fromVersion: FileVersion;

  /** "After" file version */
  toVersion: FileVersion;

  /** Repository context for screenshots */
  owner: string;
  repo: string;

  /** Callback to go back to comparison mode (keep selection) */
  onBack: () => void;

  /** Callback to exit comparison mode completely */
  onExitComparison: () => void;
}

type ViewMode = "side-by-side" | "overlay";

export function DiffView({
  diff,
  fromCommit,
  toCommit,
  fromVersion,
  toVersion,
  owner,
  repo,
  onBack,
  onExitComparison,
}: DiffViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("side-by-side");
  const [selectedDiff, setSelectedDiff] = useState<NodeDiff | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);

  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const isScrollingSyncRef = useRef(false);

  // Get screenshots for both versions
  const {
    imageData: fromImageData,
    loading: fromLoading,
    error: fromError,
  } = useScreenshot({
    penContent: JSON.stringify(fromVersion.content),
    enabled: true,
    repoContext: { owner, repo, ref: fromCommit.sha },
  });

  const {
    imageData: toImageData,
    loading: toLoading,
    error: toError,
  } = useScreenshot({
    penContent: JSON.stringify(toVersion.content),
    enabled: true,
    repoContext: { owner, repo, ref: toCommit.sha },
  });

  // Synchronized scrolling
  const handleScroll = useCallback((source: "left" | "right") => {
    if (isScrollingSyncRef.current) return;

    isScrollingSyncRef.current = true;

    const sourceRef = source === "left" ? leftScrollRef : rightScrollRef;
    const targetRef = source === "left" ? rightScrollRef : leftScrollRef;

    if (sourceRef.current && targetRef.current) {
      targetRef.current.scrollTop = sourceRef.current.scrollTop;
      targetRef.current.scrollLeft = sourceRef.current.scrollLeft;
    }

    setTimeout(() => {
      isScrollingSyncRef.current = false;
    }, 50);
  }, []);

  // Create node lookup maps for quick access
  const fromNodeMap = useMemo(() => {
    const map = new Map<string, PenNode>();
    const traverse = (node: PenNode) => {
      map.set(node.id, node);
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    if (fromVersion.content.children) {
      fromVersion.content.children.forEach(traverse);
    }
    return map;
  }, [fromVersion.content]);

  const toNodeMap = useMemo(() => {
    const map = new Map<string, PenNode>();
    const traverse = (node: PenNode) => {
      map.set(node.id, node);
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    if (toVersion.content.children) {
      toVersion.content.children.forEach(traverse);
    }
    return map;
  }, [toVersion.content]);

  // Get bounding box for a node from "before" version
  const getFromBoundingBox = useCallback(
    (nodeId: string) => {
      const node = fromNodeMap.get(nodeId);
      if (!node) return null;

      const x = typeof node.x === "number" ? node.x : 0;
      const y = typeof node.y === "number" ? node.y : 0;
      const width = typeof node.width === "number" ? node.width : 100;
      const height = typeof node.height === "number" ? node.height : 100;

      return { x, y, width, height };
    },
    [fromNodeMap]
  );

  // Get bounding box for a node from "after" version
  const getToBoundingBox = useCallback(
    (nodeId: string) => {
      const node = toNodeMap.get(nodeId);
      if (!node) return null;

      const x = typeof node.x === "number" ? node.x : 0;
      const y = typeof node.y === "number" ? node.y : 0;
      const width = typeof node.width === "number" ? node.width : 100;
      const height = typeof node.height === "number" ? node.height : 100;

      return { x, y, width, height };
    },
    [toNodeMap]
  );

  const totalChanges =
    diff.added.length + diff.deleted.length + diff.modified.length + diff.moved.length;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-surface">
        <div>
          <h2 className="text-lg font-bold text-foreground mb-1">Diff Comparison</h2>
          <div className="text-sm text-foreground-secondary">
            {totalChanges} change{totalChanges !== 1 ? "s" : ""} detected
          </div>
        </div>

        <div className="flex gap-3">
          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-background-tertiary rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("side-by-side")}
              className={`px-3 py-1.5 text-sm font-medium border-none rounded-md cursor-pointer transition-all duration-200 ${
                viewMode === "side-by-side"
                  ? "bg-surface text-foreground shadow-sm"
                  : "bg-transparent text-foreground-secondary hover:text-foreground"
              }`}
            >
              Side by Side
            </button>
            <button
              onClick={() => setViewMode("overlay")}
              className={`px-3 py-1.5 text-sm font-medium border-none rounded-md cursor-pointer transition-all duration-200 ${
                viewMode === "overlay"
                  ? "bg-surface text-foreground shadow-sm"
                  : "bg-transparent text-foreground-secondary hover:text-foreground"
              }`}
            >
              Overlay
            </button>
          </div>

          {/* Navigation and Action Buttons */}
          <button
            onClick={() => setShowDetailsPanel(!showDetailsPanel)}
            className={`px-4 py-1.5 text-sm font-medium border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              showDetailsPanel
                ? "bg-foreground text-background border-foreground"
                : "bg-surface text-foreground border-border hover:border-border-secondary"
            }`}
          >
            {showDetailsPanel ? "Hide" : "Show"} Details
          </button>
          <button
            onClick={onBack}
            className="px-4 py-1.5 text-sm font-medium border-2 border-primary rounded-lg cursor-pointer bg-primary text-white hover:bg-primary-hover transition-all duration-200"
          >
            ← Back
          </button>
          <button
            onClick={onExitComparison}
            className="px-4 py-1.5 text-sm font-medium border-2 border-border rounded-lg cursor-pointer bg-surface text-foreground hover:border-border-secondary transition-all duration-200"
          >
            Exit Comparison
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left/Before View */}
        {viewMode === "side-by-side" && (
          <div
            ref={leftScrollRef}
            onScroll={() => handleScroll("left")}
            className="flex-1 overflow-auto border-r border-border relative bg-background-secondary"
          >
            <div className="px-6 py-4 bg-error-light border-b border-error/30 sticky top-0 z-10">
              <div className="text-sm font-semibold text-error">Before: {fromCommit.message}</div>
              <div className="text-xs text-error font-mono mt-0.5">
                {fromCommit.sha.substring(0, 7)}
              </div>
            </div>

            <div className="relative p-6">
              {fromError ? (
                <div className="p-6 text-center text-error">截圖載入失敗: {fromError}</div>
              ) : (
                <div className="relative">
                  <PenRenderer imageData={fromImageData} loading={fromLoading} />

                  {/* Highlight deleted nodes only */}
                  <DiffHighlightLayer
                    diffs={diff.deleted}
                    getBoundingBox={getFromBoundingBox}
                    visibleTypes={["deleted"]}
                    onHighlightClick={(d) => {
                      setSelectedDiff(d);
                      setShowDetailsPanel(true);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right/After View */}
        <div
          ref={rightScrollRef}
          onScroll={() => handleScroll("right")}
          className="flex-1 overflow-auto relative bg-background-secondary"
        >
          <div className="px-6 py-4 bg-success-light border-b border-success/30 sticky top-0 z-10">
            <div className="text-sm font-semibold text-success">After: {toCommit.message}</div>
            <div className="text-xs text-success font-mono mt-0.5">
              {toCommit.sha.substring(0, 7)}
            </div>
          </div>

          <div className="relative p-6 flex justify-center items-start">
            {toError ? (
              <div className="p-6 text-center text-error">截圖載入失敗: {toError}</div>
            ) : (
              <>
                <div style={{ position: "relative" }}>
                  {viewMode === "overlay" && fromImageData ? (
                    <>
                      {/* Overlay mode: stack both images with color filters */}
                      <div style={{ position: "relative", display: "inline-block" }}>
                        {/* Before image with red tint */}
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            mixBlendMode: "multiply",
                            opacity: 0.7,
                          }}
                        >
                          <PenRenderer imageData={fromImageData} loading={fromLoading} />
                          <div
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: "rgba(239, 68, 68, 0.3)",
                              mixBlendMode: "multiply",
                              pointerEvents: "none",
                            }}
                          />
                        </div>

                        {/* After image with green tint */}
                        <div style={{ position: "relative" }}>
                          <PenRenderer imageData={toImageData} loading={toLoading} />
                          <div
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: "rgba(34, 197, 94, 0.3)",
                              mixBlendMode: "multiply",
                              pointerEvents: "none",
                            }}
                          />
                        </div>
                      </div>

                      {/* Overlay highlights layer */}
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
                        <DiffHighlightLayer
                          diffs={[...diff.added, ...diff.modified, ...diff.moved]}
                          getBoundingBox={getToBoundingBox}
                          visibleTypes={["added", "modified", "moved"]}
                          onHighlightClick={(d) => {
                            setSelectedDiff(d);
                            setShowDetailsPanel(true);
                          }}
                        />
                        <DiffHighlightLayer
                          diffs={diff.deleted}
                          getBoundingBox={getFromBoundingBox}
                          visibleTypes={["deleted"]}
                          onHighlightClick={(d) => {
                            setSelectedDiff(d);
                            setShowDetailsPanel(true);
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Side-by-side mode: just show after image */}
                      <PenRenderer imageData={toImageData} loading={toLoading} />

                      {/* Highlight added, modified, moved nodes */}
                      <DiffHighlightLayer
                        diffs={[...diff.added, ...diff.modified, ...diff.moved]}
                        getBoundingBox={getToBoundingBox}
                        visibleTypes={["added", "modified", "moved"]}
                        onHighlightClick={(d) => {
                          setSelectedDiff(d);
                          setShowDetailsPanel(true);
                        }}
                      />
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Details Panel */}
        {showDetailsPanel && (
          <div className="w-[350px] border-l border-border bg-surface overflow-auto">
            <DiffDetailsPanel
              selectedDiff={selectedDiff}
              onClose={() => {
                setSelectedDiff(null);
                setShowDetailsPanel(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
