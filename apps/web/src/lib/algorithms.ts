/**
 * Production-quality Data Structures and Algorithms for DevCanvas.
 */

// ==========================================
// FEATURE 3: LRU CACHE (Least Recently Used)
// ==========================================

class LRUNode<K, V> {
  key: K;
  value: V;
  prev: LRUNode<K, V> | null = null;
  next: LRUNode<K, V> | null = null;

  constructor(key: K, value: V) {
    this.key = key;
    this.value = value;
  }
}

/**
 * Least Recently Used (LRU) Cache using a HashMap and a Doubly Linked List.
 * 
 * TIME COMPLEXITY:
 * - get(key): O(1)
 * - put(key, value): O(1)
 * 
 * SPACE COMPLEXITY: O(Capacity)
 * 
 * ADVANTAGES:
 * - Fixed memory footprint: Prevents memory leaks by evicting least-recently used elements.
 * - Constant-time insertions, updates, and retrievals.
 */
export class LRUCache<K, V> {
  private capacity: number;
  private map: Map<K, LRUNode<K, V>>;
  private head: LRUNode<K, V> | null = null;
  private tail: LRUNode<K, V> | null = null;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.map = new Map();
  }

  get(key: K): V | null {
    const node = this.map.get(key);
    if (!node) return null;
    this.moveToHead(node);
    return node.value;
  }

  put(key: K, value: V): void {
    const node = this.map.get(key);
    if (node) {
      node.value = value;
      this.moveToHead(node);
    } else {
      const newNode = new LRUNode(key, value);
      if (this.map.size >= this.capacity) {
        this.evictTail();
      }
      this.addToHead(newNode);
      this.map.set(key, newNode);
    }
  }

  private addToHead(node: LRUNode<K, V>): void {
    node.next = this.head;
    node.prev = null;
    if (this.head) {
      this.head.prev = node;
    }
    this.head = node;
    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: LRUNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private moveToHead(node: LRUNode<K, V>): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  private evictTail(): void {
    if (!this.tail) return;
    this.map.delete(this.tail.key);
    this.removeNode(this.tail);
  }

  clear(): void {
    this.map.clear();
    this.head = null;
    this.tail = null;
  }
}

// ==========================================
// FEATURE 4: STACK (UNDO / REDO)
// ==========================================

/**
 * Generic Stack Data Structure.
 * 
 * TIME COMPLEXITY:
 * - push(item): O(1)
 * - pop(): O(1)
 * - peek(): O(1)
 * - size(): O(1)
 * 
 * SPACE COMPLEXITY: O(N) where N is items pushed.
 */
export class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }

  clear(): void {
    this.items = [];
  }

  toArray(): T[] {
    return [...this.items];
  }
}

// ==========================================
// FEATURE 1 & 2: GRAPH / DFS / BFS / TOPOLOGICAL SORT
// ==========================================

export class Graph<T> {
  private adjacencyList: Map<string, { val: T; neighbors: string[] }>;

  constructor() {
    this.adjacencyList = new Map();
  }

  addNode(id: string, val: T): void {
    if (!this.adjacencyList.has(id)) {
      this.adjacencyList.set(id, { val, neighbors: [] });
    }
  }

  addEdge(fromId: string, toId: string): void {
    if (this.adjacencyList.has(fromId) && this.adjacencyList.has(toId)) {
      this.adjacencyList.get(fromId)!.neighbors.push(toId);
    }
  }

  getNode(id: string): T | undefined {
    return this.adjacencyList.get(id)?.val;
  }

  getNeighbors(id: string): string[] {
    return this.adjacencyList.get(id)?.neighbors || [];
  }

  getAllNodes(): string[] {
    return Array.from(this.adjacencyList.keys());
  }

  /**
   * Topological Sort using Kahn's Algorithm (In-degree traversal).
   * Detects circular dependencies and returns sorted node IDs.
   * 
   * TIME COMPLEXITY: O(V + E)
   * SPACE COMPLEXITY: O(V + E)
   */
  topologicalSort(): string[] {
    const inDegree: Map<string, number> = new Map();
    const sortedOrder: string[] = [];
    const queue: string[] = [];

    // Initialize all in-degrees to 0
    for (const node of this.getAllNodes()) {
      inDegree.set(node, 0);
    }

    // Populate in-degrees
    for (const node of this.getAllNodes()) {
      for (const neighbor of this.getNeighbors(node)) {
        inDegree.set(neighbor, (inDegree.get(neighbor) || 0) + 1);
      }
    }

    // Push nodes with in-degree 0 into queue
    for (const [node, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(node);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      sortedOrder.push(current);

      for (const neighbor of this.getNeighbors(current)) {
        const remaining = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, remaining);
        if (remaining === 0) {
          queue.push(neighbor);
        }
      }
    }

    // If order size is less than all nodes, a circular dependency exists
    if (sortedOrder.length !== this.getAllNodes().length) {
      throw new Error("Circular dependency detected in graph traversal!");
    }

    return sortedOrder;
  }

  /**
   * Breadth First Search (BFS) to find reachable component IDs.
   * 
   * TIME COMPLEXITY: O(V + E)
   * SPACE COMPLEXITY: O(V)
   */
  bfs(startId: string): Set<string> {
    const visited = new Set<string>();
    const queue: string[] = [startId];
    visited.add(startId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const neighbor of this.getNeighbors(current)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    return visited;
  }

  /**
   * Depth First Search (DFS) to traverse connected nodes recursively.
   * 
   * TIME COMPLEXITY: O(V + E)
   * SPACE COMPLEXITY: O(V)
   */
  dfs(startId: string): Set<string> {
    const visited = new Set<string>();
    this._dfsHelper(startId, visited);
    return visited;
  }

  private _dfsHelper(id: string, visited: Set<string>): void {
    visited.add(id);
    for (const neighbor of this.getNeighbors(id)) {
      if (!visited.has(neighbor)) {
        this._dfsHelper(neighbor, visited);
      }
    }
  }
}
