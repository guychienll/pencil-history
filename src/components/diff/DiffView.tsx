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
    <div
      className="diff-view"
      style={{ display: "flex", flexDirection: "column", height: "100vh" }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <div>
          <h2
            style={{ fontSize: "18px", fontWeight: "700", color: "#111827", marginBottom: "4px" }}
          >
            Diff Comparison
          </h2>
          <div style={{ fontSize: "13px", color: "#6b7280" }}>
            {totalChanges} change{totalChanges !== 1 ? "s" : ""} detected
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {/* View Mode Toggle */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              backgroundColor: "#f3f4f6",
              borderRadius: "6px",
              padding: "2px",
            }}
          >
            <button
              onClick={() => setViewMode("side-by-side")}
              style={{
                padding: "6px 12px",
                fontSize: "13px",
                fontWeight: "500",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                backgroundColor: viewMode === "side-by-side" ? "#ffffff" : "transparent",
                color: viewMode === "side-by-side" ? "#111827" : "#6b7280",
                boxShadow: viewMode === "side-by-side" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
              }}
            >
              Side by Side
            </button>
            <button
              onClick={() => setViewMode("overlay")}
              style={{
                padding: "6px 12px",
                fontSize: "13px",
                fontWeight: "500",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                backgroundColor: viewMode === "overlay" ? "#ffffff" : "transparent",
                color: viewMode === "overlay" ? "#111827" : "#6b7280",
                boxShadow: viewMode === "overlay" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
              }}
            >
              Overlay
            </button>
          </div>

          {/* Navigation and Action Buttons */}
          <button
            onClick={() => setShowDetailsPanel(!showDetailsPanel)}
            style={{
              padding: "6px 16px",
              fontSize: "13px",
              fontWeight: "500",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              cursor: "pointer",
              backgroundColor: showDetailsPanel ? "#111827" : "#ffffff",
              color: showDetailsPanel ? "#ffffff" : "#374151",
            }}
          >
            {showDetailsPanel ? "Hide" : "Show"} Details
          </button>
          <button
            onClick={onBack}
            style={{
              padding: "6px 16px",
              fontSize: "13px",
              fontWeight: "500",
              border: "1px solid #3b82f6",
              borderRadius: "6px",
              cursor: "pointer",
              backgroundColor: "#3b82f6",
              color: "#ffffff",
            }}
          >
            ← Back
          </button>
          <button
            onClick={onExitComparison}
            style={{
              padding: "6px 16px",
              fontSize: "13px",
              fontWeight: "500",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              cursor: "pointer",
              backgroundColor: "#ffffff",
              color: "#374151",
            }}
          >
            Exit Comparison
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left/Before View */}
        {viewMode === "side-by-side" && (
          <div
            ref={leftScrollRef}
            onScroll={() => handleScroll("left")}
            style={{
              flex: 1,
              overflow: "auto",
              borderRight: "1px solid #e5e7eb",
              position: "relative",
            }}
          >
            <div
              style={{
                padding: "16px 24px",
                backgroundColor: "#fef2f2",
                borderBottom: "1px solid #fecaca",
                position: "sticky",
                top: 0,
                zIndex: 10,
              }}
            >
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#991b1b" }}>
                Before: {fromCommit.message}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#b91c1c",
                  fontFamily: "monospace",
                  marginTop: "2px",
                }}
              >
                {fromCommit.sha.substring(0, 7)}
              </div>
            </div>

            <div style={{ position: "relative", padding: "24px" }}>
              {fromError ? (
                <div style={{ padding: "24px", textAlign: "center", color: "#ef4444" }}>
                  截圖載入失敗: {fromError}
                </div>
              ) : (
                <div style={{ position: "relative" }}>
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
          style={{
            flex: 1,
            overflow: "auto",
            position: "relative",
          }}
        >
          <div
            style={{
              padding: "16px 24px",
              backgroundColor: "#f0fdf4",
              borderBottom: "1px solid #bbf7d0",
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#166534" }}>
              After: {toCommit.message}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#15803d",
                fontFamily: "monospace",
                marginTop: "2px",
              }}
            >
              {toCommit.sha.substring(0, 7)}
            </div>
          </div>

          <div
            style={{
              position: "relative",
              padding: "24px",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
            }}
          >
            {toError ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#ef4444" }}>
                截圖載入失敗: {toError}
              </div>
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
          <div
            style={{
              width: "350px",
              borderLeft: "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
              overflow: "auto",
            }}
          >
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
