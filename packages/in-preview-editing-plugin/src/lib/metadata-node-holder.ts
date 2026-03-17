import { isMarkedAsEditable, PDE_METADATA_ATTRIBUTE, PDE_METADATA_ID_ATTRIBUTE } from "./utils";

export interface MetadataNode {
  /** The DOM element carrying the `data-cm-metadata` attribute. */
  element: HTMLElement;
  /** Value of `data-cm-metadata-id` (empty string when absent). */
  metadataId: string;
  /** Parsed JSON value of `data-cm-metadata`. */
  metadata: object[];
  /** Whether the node is marked as editable. */
  markedEditable: boolean;
  /** Direct child metadata nodes in the DOM tree. */
  children: MetadataNode[];
  /** Reference to the parent metadata node, or `null` for root nodes. */
  parent: MetadataNode | null;
}

/**
 * Singleton that keeps track of all {@link MetadataNode}s present in the DOM.
 *
 * It exposes:
 * - {@link flatList} – a flat array containing every metadata node found.
 * - {@link tree}     – a forest (array of root nodes) representing the
 *                      parent-child relationships between metadata nodes.
 *
 * Call {@link refresh} whenever the DOM changes to rebuild both structures.
 */
class MetadataNodeHolder {
  // ─── Singleton ────────────────────────────────────────────────────────────

  private static instance: MetadataNodeHolder;

  private constructor() {}

  public static getInstance(): MetadataNodeHolder {
    if (!MetadataNodeHolder.instance) {
      MetadataNodeHolder.instance = new MetadataNodeHolder();
    }
    return MetadataNodeHolder.instance;
  }

  // ─── State ────────────────────────────────────────────────────────────────

  /** All metadata nodes in document order (flat). */
  private _flatList: MetadataNode[] = [];

  /** Root nodes of the metadata node forest. */
  private _tree: MetadataNode[] = [];

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Flat list of **all** metadata nodes found in the DOM (document order).
   */
  get flatList(): ReadonlyArray<MetadataNode> {
    return this._flatList;
  }

  /**
   * Forest of metadata nodes reflecting the DOM hierarchy.
   * Each entry is a root node (no metadata ancestor).
   */
  get tree(): ReadonlyArray<MetadataNode> {
    return this._tree;
  }

  /**
   * (Re-)scans the DOM starting at `root` and rebuilds {@link flatList} and
   * {@link tree}.  Defaults to `document.body`.
   *
   * @param root - The DOM subtree to scan (defaults to `document.body`).
   */
  refresh(root: HTMLElement = document.body): void {
    const elements = Array.from(
      root.querySelectorAll<HTMLElement>(`[${PDE_METADATA_ATTRIBUTE}]`)
    );

    const nodeMap = new Map<HTMLElement, MetadataNode>();

    // ── Pass 1: create a MetadataNode for every element ──────────────────
    for (const el of elements) {
      let metadata: object[] = [];
      try {
        const raw = el.getAttribute(PDE_METADATA_ATTRIBUTE) ?? "[]";
        const parsed = JSON.parse(raw);
        metadata = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // malformed JSON → keep empty array
      }

      nodeMap.set(el, {
        element: el,
        metadataId: el.getAttribute(PDE_METADATA_ID_ATTRIBUTE) ?? "",
        metadata,
        markedEditable: isMarkedAsEditable(el),
        children: [],
        parent: null,
      });
    }

    // ── Pass 2: wire parent ↔ children relationships ─────────────────────
    const roots: MetadataNode[] = [];

    for (const el of elements) {
      const node = nodeMap.get(el)!;
      const parentEl = el.parentElement?.closest<HTMLElement>(
        `[${PDE_METADATA_ATTRIBUTE}]`
      );

      if (parentEl && nodeMap.has(parentEl)) {
        const parentNode = nodeMap.get(parentEl)!;
        node.parent = parentNode;
        parentNode.children.push(node);
      } else {
        roots.push(node);
      }
    }

    this._flatList = Array.from(nodeMap.values());
    this._tree = roots;
  }

  // ─── Convenience helpers ──────────────────────────────────────────────────

  /**
   * Returns the {@link MetadataNode} whose `element` matches the given DOM
   * element, or `undefined` when not found.
   */
  findByElement(element: HTMLElement): MetadataNode | undefined {
    return this._flatList.find((n) => n.element === element);
  }

  /**
   * Returns all {@link MetadataNode}s that are marked as editable.
   */
  getEditableNodes(): MetadataNode[] {
    return this._flatList.filter((n) => n.markedEditable);
  }

  /**
   * Recursively searches `tree` for the first node that satisfies
   * `predicate`.
   *
   * @param predicate - Test function.
   * @param nodes     - Sub-tree to search (defaults to the root tree).
   */
  findInTree(
    predicate: (node: MetadataNode) => boolean,
    nodes: ReadonlyArray<MetadataNode> = this._tree
  ): MetadataNode | undefined {
    for (const node of nodes) {
      if (predicate(node)) return node;
      const found = this.findInTree(predicate, node.children);
      if (found) return found;
    }
    return undefined;
  }
}

export default MetadataNodeHolder;

