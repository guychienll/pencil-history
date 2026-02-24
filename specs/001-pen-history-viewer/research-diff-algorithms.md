# Research: Node-Level Structural Diff Algorithms for .pen Design Files

**Date**: 2026-02-24
**Research Topic**: Comparing tree-structured .pen design files across git commits
**Context**: PencilHistory.xyz P3 feature - highlighting added/modified/deleted nodes in JSON-based tree structures

---

## Executive Summary

**Recommended Approach**: Hybrid ID-based tree diff using a modified version of the Zhang-Shasha tree edit distance algorithm combined with node ID tracking.

**Key Decision**: Implement a custom diff algorithm optimized for .pen files that:

1. Leverages stable node IDs to track elements across versions
2. Computes tree edit distance for structural changes
3. Performs deep property comparison for modified nodes
4. Provides actionable diff results for visualization

**Recommended Library**: No existing library fully meets requirements. Recommend custom implementation using `fast-json-patch` for property-level diffs and building tree diff logic on top.

---

## Research Task 1: Existing Tree Diff Algorithms

### 1.1 Myers Diff Algorithm

**Description**:

- The Myers algorithm (1986) is a classic diff algorithm that finds the shortest edit script (SES) between two sequences
- Uses a greedy approach with dynamic programming to compute longest common subsequence (LCS)
- Optimized for linear sequences (text, arrays)

**Strengths**:

- Well-established and proven algorithm
- Optimal for 1D sequences
- Good performance: O(ND) where N is sum of lengths, D is size of minimal edit script
- Available in many implementations (diff-match-patch, node-diff, etc.)

**Weaknesses**:

- Designed for sequences, not trees
- Cannot detect node moves within tree hierarchy
- Treats tree as flattened sequence, losing structural information
- Cannot leverage node IDs for tracking

**Applicability to .pen files**: **Low**

- .pen files are hierarchical trees, not flat sequences
- Would require tree traversal strategy (pre-order, post-order) which may miss structural changes
- Cannot differentiate between property change and full node replacement

---

### 1.2 Tree-to-Tree Correction / Zhang-Shasha Algorithm

**Description**:

- Zhang and Shasha (1989) developed an algorithm for computing tree edit distance
- Measures minimum-cost sequence of operations (insert, delete, relabel) to transform one tree into another
- Uses dynamic programming with keyroot concept for efficiency

**Strengths**:

- Specifically designed for tree structures
- Can detect insertions, deletions, and modifications
- Formal mathematical foundation
- O(N²) time and space complexity where N is number of nodes

**Weaknesses**:

- Does not inherently track node IDs (treats nodes as unlabeled)
- Relatively expensive for large trees
- Does not distinguish between moves and delete+insert
- Property-level changes require custom implementation

**Applicability to .pen files**: **Medium-High**

- Good fit for hierarchical structure
- Can be extended to use node IDs as labels
- Needs customization for property comparison

**Variations**:

- **Klein's algorithm**: O(N³) but handles all ordered tree operations
- **PQ-Gram distance**: Approximation with O(N log N) performance
- **APTED (All Pairs Tree Edit Distance)**: Modern optimized implementation

---

### 1.3 React Reconciliation Algorithm (Virtual DOM Diffing)

**Description**:

- React's fiber reconciliation algorithm (2017) optimizes tree diffing for UI rendering
- Uses heuristic approach with stable keys for component identity
- Assumes two trees at same level are comparable
- Uses breadth-first traversal with component keys

**Strengths**:

- Battle-tested at massive scale (Facebook, Instagram, etc.)
- Excellent performance in practice: O(N) heuristic complexity
- Strong support for keyed elements (analogous to node IDs)
- Handles moves efficiently when keys are present
- Can detect insertions, deletions, moves, and updates

**Weaknesses**:

- Heuristic-based, not mathematically optimal
- Assumes UI rendering constraints (same-level comparison)
- May miss complex tree restructuring
- Optimized for frequent, small changes (not historical diffs)

**Applicability to .pen files**: **High**

- .pen files have stable node IDs (similar to React keys)
- Tree structure similar to component trees
- Can detect all required operations
- Practical performance characteristics

**Key Insight**: React's approach of using stable keys (node IDs) is crucial for our use case.

---

### 1.4 Git Tree Diff (libgit2 approach)

**Description**:

- Git uses specialized algorithms for comparing file trees
- Combines content-based hashing (SHA-1) with path tracking
- Optimized for filesystem hierarchies

**Strengths**:

- Extremely efficient for large trees
- Uses content addressing (hash-based identity)
- Handles renames and moves

**Weaknesses**:

- Designed for filesystem trees, not general trees
- Relies on path-based identity, not arbitrary node IDs
- Does not perform deep property comparison
- Not suitable for JSON tree structures

**Applicability to .pen files**: **Low**

- Different problem domain (filesystem vs. JSON trees)
- .pen node identity is ID-based, not path-based

---

## Research Task 2: Algorithm Selection for .pen Files

### 2.1 Requirements Analysis

For .pen design files, the diff algorithm must:

1. **Detect node operations**:
   - Addition: New nodes in version B
   - Deletion: Nodes in version A not in version B
   - Modification: Nodes present in both but with different properties
   - Move: Nodes with same ID but different parent/position

2. **Leverage node IDs**:
   - .pen files use unique node IDs (e.g., `"id": "abc123"`)
   - Must track nodes across versions by ID
   - Avoid misidentifying modification as delete+add

3. **Property-level granularity**:
   - Detect which specific properties changed (color, size, position, etc.)
   - Support nested property changes
   - Handle different property types (primitives, objects, arrays)

4. **Performance requirements**:
   - Handle trees with 100-1000s of nodes
   - Real-time performance (< 2 seconds as per spec)
   - Memory efficient (runs in browser)

5. **Visualization support**:
   - Provide structured diff output suitable for highlighting
   - Include old/new values for modified properties
   - Support side-by-side or overlay visualization

---

### 2.2 Recommended Approach: Hybrid ID-Based Tree Diff

**Algorithm Design**:

Combine the best aspects of tree edit distance and React reconciliation:

1. **Phase 1: ID-based node matching**
   - Build ID → Node maps for both trees
   - Identify: added nodes (in B only), deleted nodes (in A only), common nodes (in both)
   - This is O(N) and leverages node IDs directly

2. **Phase 2: Structural diff for common nodes**
   - For each common node, compare:
     - Parent ID (detect moves)
     - Sibling position (detect reordering)
     - Child list (detect child structure changes)
   - This is O(N) for nodes, O(M) per node for children

3. **Phase 3: Property-level diff**
   - For each common node with same structure, deep-compare properties
   - Use JSON diff algorithm (RFC 6902 JSON Patch format)
   - Track specific property changes
   - This is O(P) where P is number of properties

4. **Phase 4: Classify changes**
   - Combine results into structured diff output:

     ```typescript
     interface DiffResult {
       added: NodeDiff[]; // Nodes only in version B
       deleted: NodeDiff[]; // Nodes only in version A
       moved: NodeDiff[]; // Nodes with different parent/position
       modified: NodeDiff[]; // Nodes with property changes
     }

     interface NodeDiff {
       id: string;
       path: string[]; // Path from root
       oldNode?: PenNode;
       newNode?: PenNode;
       propertyChanges?: PropertyChange[];
     }

     interface PropertyChange {
       property: string;
       oldValue: any;
       newValue: any;
       operation: "add" | "remove" | "replace";
     }
     ```

**Complexity Analysis**:

- Time: O(N + M) where N is nodes in tree A, M is nodes in tree B
- Space: O(N + M) for ID maps and diff results
- Practical performance: ~100-1000ms for typical .pen files (100-1000 nodes)

**Why this approach**:

1. **ID-based matching is fundamental**: Since .pen files have stable IDs, we should use them
2. **Structural awareness**: We check parent/child relationships explicitly
3. **Property granularity**: Deep comparison provides actionable diff info
4. **Efficient**: Linear complexity vs. quadratic for full tree edit distance
5. **Practical**: Similar to proven approaches (React, JSON Patch)

---

## Research Task 3: Tracking Elements with Node IDs

### 3.1 Node ID Stability in .pen Files

From the Pencil MCP schema (inferred from context), .pen nodes have:

- Unique `id` field (string)
- `type` field (frame, text, rectangle, etc.)
- `children` array for hierarchical structure
- Various properties (position, size, style, etc.)

**Key Insight**: Node IDs are stable across versions (like React keys). This is our primary identity mechanism.

---

### 3.2 ID-Based Tracking Strategy

**Approach**:

```typescript
// Build ID index for fast lookup
function buildIdIndex(node: PenNode, path: string[] = []): Map<string, NodeWithPath> {
  const index = new Map<string, NodeWithPath>();

  function traverse(node: PenNode, currentPath: string[]) {
    if (node.id) {
      index.set(node.id, { node, path: currentPath });
    }

    if (node.children) {
      node.children.forEach((child, idx) => {
        traverse(child, [...currentPath, `children[${idx}]`]);
      });
    }
  }

  traverse(node, path);
  return index;
}

// Compare two versions
function diffPenTrees(oldRoot: PenNode, newRoot: PenNode): DiffResult {
  const oldIndex = buildIdIndex(oldRoot);
  const newIndex = buildIdIndex(newRoot);

  const added: NodeDiff[] = [];
  const deleted: NodeDiff[] = [];
  const moved: NodeDiff[] = [];
  const modified: NodeDiff[] = [];

  // Find deleted nodes (in old, not in new)
  for (const [id, oldData] of oldIndex) {
    if (!newIndex.has(id)) {
      deleted.push({ id, path: oldData.path, oldNode: oldData.node });
    }
  }

  // Find added nodes (in new, not in old)
  for (const [id, newData] of newIndex) {
    if (!oldIndex.has(id)) {
      added.push({ id, path: newData.path, newNode: newData.node });
    }
  }

  // Find moved or modified nodes (in both)
  for (const [id, newData] of newIndex) {
    if (oldIndex.has(id)) {
      const oldData = oldIndex.get(id)!;

      // Check for structural move
      if (getParentId(oldData.node) !== getParentId(newData.node)) {
        moved.push({
          id,
          path: newData.path,
          oldNode: oldData.node,
          newNode: newData.node,
        });
      }

      // Check for property changes
      const propChanges = diffProperties(oldData.node, newData.node);
      if (propChanges.length > 0) {
        modified.push({
          id,
          path: newData.path,
          oldNode: oldData.node,
          newNode: newData.node,
          propertyChanges: propChanges,
        });
      }
    }
  }

  return { added, deleted, moved, modified };
}
```

**Benefits**:

- O(1) lookup by node ID
- Clear separation of concerns (added/deleted/moved/modified)
- Avoids false positives (won't confuse property change with delete+add)

---

### 3.3 Handling Nodes Without IDs

**Edge Case**: What if some nodes don't have IDs?

**Solution**:

1. **Fallback to structural position**: Use path-based identity (e.g., `root.children[2].children[0]`)
2. **Content-based hashing**: For text nodes or simple elements, use content hash as pseudo-ID
3. **Conservative approach**: Treat as delete+add if no reliable identity

```typescript
function getNodeIdentity(node: PenNode, path: string[]): string {
  if (node.id) return node.id;
  if (node.type === "text" && node.content) {
    return `text:${hashContent(node.content)}:${path.join("/")}`;
  }
  return `path:${path.join("/")}`;
}
```

---

## Research Task 4: Visualization Best Practices

### 4.1 Visualization Modes

**Option 1: Side-by-Side View**

- Show old version on left, new version on right
- Highlight corresponding changes in both views
- Connect related elements with lines

**Pros**:

- Clear separation of versions
- Easy to see before/after
- Familiar pattern (Git diff tools)

**Cons**:

- Requires more screen space
- Harder to see contextual changes
- May duplicate unchanged content

---

**Option 2: Overlay View**

- Show single canvas with highlighted changes
- Use color coding: green=added, red=deleted, yellow=modified
- Toggle between versions with fade transition

**Pros**:

- Space efficient
- Shows changes in context
- Better for dense designs

**Cons**:

- Can be cluttered with many changes
- Harder to see complete before/after

---

**Option 3: Inline Highlighting**

- Show new version as primary
- Overlay deletion markers (ghost elements)
- Highlight modified elements
- Show property change tooltips

**Pros**:

- Most space efficient
- Focuses on new state
- Good for incremental changes

**Cons**:

- Deleted elements may be confusing
- Need good visual indicators

---

**Recommendation**: **Start with Overlay View (Option 2), add Side-by-Side as enhancement**

Rationale:

- Overlay view is more intuitive for visual designs
- Matches user mental model (seeing evolution, not just diff)
- Can reuse single .pen renderer
- Better for small-to-medium diffs (most common case)

---

### 4.2 Color Coding Standards

Follow Git diff conventions with design-friendly adjustments:

| Change Type | Background            | Border                 | Opacity     |
| ----------- | --------------------- | ---------------------- | ----------- |
| Added       | `#d4edda` (green-50)  | `#28a745` (green-600)  | 0.3         |
| Deleted     | `#f8d7da` (red-50)    | `#dc3545` (red-600)    | 0.2 (ghost) |
| Modified    | `#fff3cd` (yellow-50) | `#ffc107` (yellow-600) | 0.4         |
| Moved       | `#d1ecf1` (blue-50)   | `#17a2b8` (cyan-600)   | 0.3         |

**Visual Treatment**:

- Added: Solid color, pulse animation on load
- Deleted: Dashed border, reduced opacity, strikethrough
- Modified: Solid color, "info" icon for property details
- Moved: Dotted line from old position to new position

---

### 4.3 Interactive Features

**Hover Tooltips**:

```typescript
interface DiffTooltip {
  nodeId: string;
  nodeName: string;
  changeType: "added" | "deleted" | "modified" | "moved";
  propertyChanges?: {
    property: string;
    oldValue: string;
    newValue: string;
  }[];
}
```

**Click Details Panel**:

- Show full node properties
- Highlight changed properties
- Link to commit info
- Copy node ID

**Filter Controls**:

- Toggle change types (show/hide added, deleted, etc.)
- Search by node ID or name
- Jump to next/previous change

---

## Research Task 5: Existing Libraries

### 5.1 JSON Diff Libraries

#### `fast-json-patch` (RFC 6902)

- **Repository**: https://github.com/Starcounter-Jack/JSON-Patch
- **Purpose**: Generate and apply JSON Patch (RFC 6902) operations
- **Bundle Size**: ~10KB gzipped
- **Performance**: Excellent (optimized for speed)

**Pros**:

- Standards-based (RFC 6902)
- Property-level granularity
- Well maintained
- TypeScript support

**Cons**:

- Not tree-aware (treats JSON as flat)
- No node ID tracking
- Requires post-processing for visualization

**Use Case**: **Property-level diffing for modified nodes**

---

#### `json-diff` / `diff`

- **Repository**: https://github.com/andreyvit/json-diff
- **Purpose**: Human-readable JSON comparison
- **Bundle Size**: ~15KB gzipped

**Pros**:

- Human-readable output
- Supports nested structures

**Cons**:

- Text-based output (not structured)
- Not optimized for large trees
- No node ID awareness

**Use Case**: Not recommended for programmatic use

---

#### `deep-diff`

- **Repository**: https://github.com/flitbit/diff
- **Purpose**: Deep object comparison
- **Bundle Size**: ~5KB gzipped

**Pros**:

- Lightweight
- Simple API
- Detects additions, deletions, edits

**Cons**:

- No tree-specific optimizations
- No node ID tracking
- Limited visualization support

**Use Case**: Possible for property comparison, but limited

---

### 5.2 Tree Diff Libraries

#### `tree-diff` (npm package)

- **Repository**: https://github.com/azu/tree-diff
- **Purpose**: Generic tree diffing
- **Bundle Size**: ~8KB gzipped

**Pros**:

- Tree-aware algorithm
- Customizable node comparison

**Cons**:

- Not actively maintained
- Limited documentation
- No ID-based tracking built-in

**Use Case**: Could be adapted, but requires significant customization

---

#### `automerge` (CRDT-based)

- **Repository**: https://github.com/automerge/automerge
- **Purpose**: Conflict-free replicated data types
- **Bundle Size**: ~150KB gzipped (too large)

**Pros**:

- Sophisticated merging
- Handles concurrent edits
- Tree-aware

**Cons**:

- Overkill for our use case
- Large bundle size
- Complex API
- Requires special data structures

**Use Case**: Not recommended (over-engineering)

---

#### `react-reconciler` (React internals)

- **Repository**: Part of React core
- **Purpose**: Virtual DOM diffing
- **Bundle Size**: Included in React (~40KB gzipped)

**Pros**:

- Battle-tested algorithm
- Efficient key-based diffing
- Handles all operations

**Cons**:

- Tightly coupled to React rendering
- Not designed for external use
- No structured diff output
- Difficult to extract logic

**Use Case**: Learn from algorithm, but don't use directly

---

### 5.3 Recommendation: Custom Implementation with `fast-json-patch`

**Decision**: Build custom tree diff, use `fast-json-patch` for property comparison

**Rationale**:

1. **No library fully meets requirements**:
   - Tree diff libraries don't handle node IDs well
   - JSON diff libraries aren't tree-aware
   - General diff libraries (Myers) aren't optimized for trees

2. **Custom implementation provides**:
   - Full control over algorithm
   - Node ID tracking
   - Visualization-friendly output
   - Performance optimization for .pen structure

3. **Leverage `fast-json-patch` for**:
   - Property-level comparison (already solved problem)
   - Standards-based format (RFC 6902)
   - Battle-tested library

4. **Manageable complexity**:
   - Tree traversal: ~100 lines
   - ID-based matching: ~50 lines
   - Property comparison: use library
   - Total custom code: ~300-500 lines

---

## Implementation Guidance

### Algorithm Pseudocode

```typescript
/**
 * Main diff function
 */
function diffPenFiles(oldFile: PenFile, newFile: PenFile): DiffResult {
  // Step 1: Build ID indexes
  const oldIndex = buildIdIndex(oldFile.root);
  const newIndex = buildIdIndex(newFile.root);

  // Step 2: Identify operations
  const result: DiffResult = {
    added: [],
    deleted: [],
    moved: [],
    modified: [],
    stats: { total: 0, addCount: 0, delCount: 0, modCount: 0, moveCount: 0 },
  };

  // Step 3: Find deleted nodes
  for (const [id, oldNode] of oldIndex) {
    if (!newIndex.has(id)) {
      result.deleted.push(createNodeDiff("deleted", id, oldNode, null));
      result.stats.delCount++;
    }
  }

  // Step 4: Find added/moved/modified nodes
  for (const [id, newNode] of newIndex) {
    if (!oldIndex.has(id)) {
      // New node
      result.added.push(createNodeDiff("added", id, null, newNode));
      result.stats.addCount++;
    } else {
      const oldNode = oldIndex.get(id)!;

      // Check for move (parent or position changed)
      const wasMoved = checkIfMoved(oldNode, newNode, oldIndex, newIndex);
      if (wasMoved) {
        result.moved.push(createNodeDiff("moved", id, oldNode, newNode));
        result.stats.moveCount++;
      }

      // Check for property changes
      const propChanges = diffNodeProperties(oldNode.node, newNode.node);
      if (propChanges.length > 0) {
        result.modified.push({
          ...createNodeDiff("modified", id, oldNode, newNode),
          propertyChanges: propChanges,
        });
        result.stats.modCount++;
      }
    }
  }

  result.stats.total =
    result.stats.addCount + result.stats.delCount + result.stats.modCount + result.stats.moveCount;

  return result;
}

/**
 * Build ID index with parent and path information
 */
function buildIdIndex(
  root: PenNode,
  parentId: string | null = null,
  path: string[] = []
): Map<string, NodeMetadata> {
  const index = new Map<string, NodeMetadata>();

  function traverse(node: PenNode, parent: string | null, currentPath: string[]) {
    const nodeId = node.id;

    index.set(nodeId, {
      node,
      parentId: parent,
      path: currentPath,
      childIds: node.children?.map((c) => c.id) || [],
    });

    if (node.children) {
      node.children.forEach((child, idx) => {
        traverse(child, nodeId, [...currentPath, nodeId, "children", String(idx)]);
      });
    }
  }

  traverse(root, parentId, path);
  return index;
}

/**
 * Check if node moved (different parent or position)
 */
function checkIfMoved(
  oldMeta: NodeMetadata,
  newMeta: NodeMetadata,
  oldIndex: Map<string, NodeMetadata>,
  newIndex: Map<string, NodeMetadata>
): boolean {
  // Check parent change
  if (oldMeta.parentId !== newMeta.parentId) {
    return true;
  }

  // Check position change among siblings
  if (oldMeta.parentId && newMeta.parentId) {
    const oldParent = oldIndex.get(oldMeta.parentId);
    const newParent = newIndex.get(newMeta.parentId);

    if (oldParent && newParent) {
      const oldPos = oldParent.childIds.indexOf(oldMeta.node.id);
      const newPos = newParent.childIds.indexOf(newMeta.node.id);

      if (oldPos !== newPos) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Diff node properties using fast-json-patch
 */
function diffNodeProperties(oldNode: PenNode, newNode: PenNode): PropertyChange[] {
  // Exclude children and id from property comparison
  const { id: oldId, children: oldChildren, ...oldProps } = oldNode;
  const { id: newId, children: newChildren, ...newProps } = newNode;

  // Use fast-json-patch to generate RFC 6902 operations
  const patches = jsonpatch.compare(oldProps, newProps);

  // Convert to our PropertyChange format
  return patches.map((patch) => ({
    property: patch.path,
    operation: patch.op as "add" | "remove" | "replace",
    oldValue:
      patch.op === "replace" || patch.op === "remove"
        ? getValueAtPath(oldProps, patch.path)
        : undefined,
    newValue: patch.op === "replace" || patch.op === "add" ? patch.value : undefined,
  }));
}

/**
 * Create node diff entry
 */
function createNodeDiff(
  type: DiffType,
  id: string,
  oldMeta: NodeMetadata | null,
  newMeta: NodeMetadata | null
): NodeDiff {
  return {
    id,
    type,
    path: (newMeta || oldMeta)!.path,
    oldNode: oldMeta?.node,
    newNode: newMeta?.node,
    parentId: (newMeta || oldMeta)!.parentId,
  };
}
```

---

### TypeScript Type Definitions

```typescript
/**
 * .pen file structure (simplified)
 */
interface PenFile {
  version: string;
  root: PenNode;
}

interface PenNode {
  id: string;
  type: "frame" | "text" | "rectangle" | "ellipse" | "group" | "path" | "image";
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  opacity?: number;
  children?: PenNode[];
  [key: string]: any; // Other properties
}

/**
 * Diff result structure
 */
interface DiffResult {
  added: NodeDiff[];
  deleted: NodeDiff[];
  moved: NodeDiff[];
  modified: NodeDiff[];
  stats: DiffStats;
}

interface NodeDiff {
  id: string;
  type: "added" | "deleted" | "moved" | "modified";
  path: string[];
  oldNode?: PenNode;
  newNode?: PenNode;
  parentId: string | null;
  propertyChanges?: PropertyChange[];
}

interface PropertyChange {
  property: string; // JSON pointer path (e.g., "/fill", "/width")
  operation: "add" | "remove" | "replace";
  oldValue?: any;
  newValue?: any;
}

interface DiffStats {
  total: number;
  addCount: number;
  delCount: number;
  modCount: number;
  moveCount: number;
}

/**
 * Internal metadata for indexing
 */
interface NodeMetadata {
  node: PenNode;
  parentId: string | null;
  path: string[];
  childIds: string[];
}
```

---

### Library Usage Example

```typescript
import { compare as jsonPatchCompare } from 'fast-json-patch'

/**
 * Example usage in application
 */
async function compareCommits(
  repoUrl: string,
  commitA: string,
  commitB: string
) {
  // Fetch .pen files from GitHub
  const [fileA, fileB] = await Promise.all([
    fetchPenFile(repoUrl, commitA),
    fetchPenFile(repoUrl, commitB)
  ])

  // Compute diff
  const diffResult = diffPenFiles(fileA, fileB)

  // Log summary
  console.log(`Diff summary:
    Added: ${diffResult.stats.addCount}
    Deleted: ${diffResult.stats.delCount}
    Modified: ${diffResult.stats.modCount}
    Moved: ${diffResult.stats.moveCount}
  `)

  // Visualize
  return renderDiffVisualization(fileB, diffResult)
}

/**
 * Render diff visualization
 */
function renderDiffVisualization(
  newFile: PenFile,
  diff: DiffResult
): React.ReactElement {
  return (
    <PenViewer file={newFile}>
      {/* Highlight added nodes */}
      {diff.added.map(nodeDiff => (
        <HighlightOverlay
          key={nodeDiff.id}
          nodeId={nodeDiff.id}
          type="added"
          tooltip={`Added: ${nodeDiff.newNode?.type}`}
        />
      ))}

      {/* Show deleted nodes as ghosts */}
      {diff.deleted.map(nodeDiff => (
        <GhostNode
          key={nodeDiff.id}
          node={nodeDiff.oldNode!}
          tooltip={`Deleted: ${nodeDiff.oldNode?.type}`}
        />
      ))}

      {/* Highlight modified nodes */}
      {diff.modified.map(nodeDiff => (
        <HighlightOverlay
          key={nodeDiff.id}
          nodeId={nodeDiff.id}
          type="modified"
          tooltip={
            <PropertyChangeList changes={nodeDiff.propertyChanges!} />
          }
        />
      ))}

      {/* Show move indicators */}
      {diff.moved.map(nodeDiff => (
        <MoveIndicator
          key={nodeDiff.id}
          nodeId={nodeDiff.id}
          oldPath={getNodePath(nodeDiff.oldNode!)}
          newPath={getNodePath(nodeDiff.newNode!)}
        />
      ))}
    </PenViewer>
  )
}
```

---

## Performance Considerations

### Optimization Strategies

1. **Memoization**:
   - Cache diff results for commit pairs
   - Use browser IndexedDB for persistent cache
   - Key: `${commitHashA}:${commitHashB}`

2. **Web Workers**:
   - Offload diff computation to worker thread
   - Prevents UI blocking for large files
   - Post structured diff result back to main thread

3. **Incremental Diffing**:
   - For long commit ranges (A → B → C), reuse intermediate diffs
   - Compose diff operations: `diff(A,C) ≈ compose(diff(A,B), diff(B,C))`

4. **Lazy Evaluation**:
   - Compute high-level stats first (added/deleted counts)
   - Compute detailed property diffs only when user inspects node
   - Progressive enhancement approach

---

### Benchmarking

Expected performance on typical .pen files:

| Tree Size (nodes) | Diff Time | Memory Usage |
| ----------------- | --------- | ------------ |
| 100               | 5-10ms    | ~50KB        |
| 500               | 20-50ms   | ~200KB       |
| 1000              | 50-150ms  | ~500KB       |
| 5000              | 200-500ms | ~2MB         |
| 10000             | 500ms-1s  | ~5MB         |

**Target**: < 2 seconds for 99% of files (spec requirement: FR-004)

---

## Alternatives Considered

### Alternative 1: Use Myers Diff on Serialized Trees

**Approach**: Serialize trees to strings (pre-order traversal), run Myers diff, map back to nodes

**Pros**:

- Simple to implement
- Can use existing libraries (diff-match-patch)

**Cons**:

- Loses tree structure information
- Cannot detect moves reliably
- Poor accuracy for visualizing changes
- Serialization overhead

**Verdict**: ❌ Not recommended

---

### Alternative 2: Use Automerge CRDT

**Approach**: Use Automerge's CRDT-based diffing and merging

**Pros**:

- Sophisticated conflict resolution
- Handles concurrent edits
- Well-tested

**Cons**:

- Massive bundle size (~150KB)
- Complex API
- Overkill for read-only history viewing
- Requires special data structures

**Verdict**: ❌ Not recommended (over-engineering)

---

### Alternative 3: Pixel-Based Visual Diff

**Approach**: Render both versions, compare pixel differences

**Pros**:

- Simple concept
- No need to understand .pen structure
- Visual output is final result

**Cons**:

- Cannot identify which nodes changed
- No semantic information
- Cannot distinguish move from delete+add
- Requires expensive rendering twice
- Poor accessibility

**Verdict**: ❌ Not recommended (doesn't meet P3 requirements)

---

### Alternative 4: Use React Reconciliation Directly

**Approach**: Wrap .pen nodes in React components, let React compute diff

**Pros**:

- Proven algorithm
- Efficient key-based tracking

**Cons**:

- Tightly coupled to React rendering
- Cannot extract structured diff output
- Not designed for historical diffs
- Would need significant hacking

**Verdict**: ❌ Not recommended (architectural mismatch)

---

## Conclusion

**Recommended Solution**: Custom ID-based tree diff with `fast-json-patch` for property comparison

**Key Benefits**:

1. ✅ Leverages stable node IDs for accurate tracking
2. ✅ Linear time complexity O(N+M)
3. ✅ Detects all required operations (add, delete, move, modify)
4. ✅ Provides property-level granularity
5. ✅ Generates structured output for visualization
6. ✅ Manageable implementation (~300-500 lines)
7. ✅ Excellent performance for target file sizes
8. ✅ Small bundle size (~10KB + custom code)

**Next Steps**:

1. Implement core diff algorithm in `src/lib/diff/node-diff.ts`
2. Add unit tests for various diff scenarios
3. Integrate `fast-json-patch` for property comparison
4. Build visualization components
5. Add performance benchmarking
6. Document API and usage examples

---

## References

1. Myers, Eugene W. (1986). "An O(ND) Difference Algorithm and Its Variations". Algorithmica.
2. Zhang, Kaizhong; Shasha, Dennis (1989). "Simple Fast Algorithms for the Editing Distance between Trees and Related Problems". SIAM Journal on Computing.
3. RFC 6902: JavaScript Object Notation (JSON) Patch. https://tools.ietf.org/html/rfc6902
4. React Fiber Architecture: https://github.com/acdlite/react-fiber-architecture
5. Git Tree Diff Implementation: https://github.com/libgit2/libgit2/tree/main/src/diff
6. fast-json-patch: https://github.com/Starcounter-Jack/JSON-Patch
7. APTED (All Pairs Tree Edit Distance): https://github.com/DatabaseGroup/apted
8. React Reconciliation: https://react.dev/learn/preserving-and-resetting-state

---

**Document Version**: 1.0
**Author**: Research Agent
**Date**: 2026-02-24
**Status**: ✅ Complete
