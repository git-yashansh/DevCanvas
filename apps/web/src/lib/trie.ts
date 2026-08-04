/**
 * Trie (Prefix Tree) Data Structure Implementation for DevCanvas Navbar Search.
 * 
 * WHY TRIE IS USED:
 * - Extremely fast prefix lookup: O(L) where L is query length.
 * - Unlike Array.filter() which requires scanning all elements (O(N * M)), the Trie scans only the characters of the query.
 * - Fits perfectly for real-time autocomplete suggestions, returning matches instantly as the user types.
 * 
 * TIME COMPLEXITY:
 * - Insertion: O(L) where L is key length.
 * - Search: O(L) where L is query length.
 * - Prefix suggestions search: O(L + K) where K is number of matched suffixes.
 * 
 * SPACE COMPLEXITY:
 * - O(V * C) where V is number of vertices/nodes and C is size of character alphabet.
 */

export interface TrieMetadata {
  title: string;
  category: string;
  description?: string;
  path: string;
  iconName: string;
}

export class TrieNode {
  children: Map<string, TrieNode>;
  endOfWord: boolean;
  metadata: TrieMetadata | null;

  constructor() {
    this.children = new Map();
    this.endOfWord = false;
    this.metadata = null;
  }
}

export class Trie {
  root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  /**
   * Insert a word and its metadata into the Trie.
   */
  insert(word: string, metadata: TrieMetadata): void {
    let current = this.root;
    const lowerWord = word.toLowerCase().trim();
    
    for (let i = 0; i < lowerWord.length; i++) {
      const char = lowerWord[i];
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char)!;
    }
    current.endOfWord = true;
    current.metadata = metadata;
  }

  /**
   * Search for exact word match and return its metadata.
   */
  search(word: string): TrieMetadata | null {
    let current = this.root;
    const lowerWord = word.toLowerCase().trim();
    
    for (let i = 0; i < lowerWord.length; i++) {
      const char = lowerWord[i];
      if (!current.children.has(char)) {
        return null;
      }
      current = current.children.get(char)!;
    }
    return current.endOfWord ? current.metadata : null;
  }

  /**
   * Check if any word in the Trie starts with the given prefix.
   */
  startsWith(prefix: string): boolean {
    let current = this.root;
    const lowerPrefix = prefix.toLowerCase().trim();
    
    for (let i = 0; i < lowerPrefix.length; i++) {
      const char = lowerPrefix[i];
      if (!current.children.has(char)) {
        return false;
      }
      current = current.children.get(char)!;
    }
    return true;
  }

  /**
   * Retrieve up to 'limit' suggestions matching the given prefix.
   */
  getSuggestions(prefix: string, limit: number = 8): TrieMetadata[] {
    const results: TrieMetadata[] = [];
    const lowerPrefix = prefix.toLowerCase().trim();
    if (!lowerPrefix) return results;

    let current = this.root;
    for (let i = 0; i < lowerPrefix.length; i++) {
      const char = lowerPrefix[i];
      if (!current.children.has(char)) {
        return results;
      }
      current = current.children.get(char)!;
    }

    // Deduplicate suggestions since the same item is indexed by multiple prefixes
    const seenPaths = new Set<string>();
    this._dfs(current, results, limit, seenPaths);

    return results.sort((a, b) => a.title.localeCompare(b.title));
  }

  private _dfs(node: TrieNode, results: TrieMetadata[], limit: number, seenPaths: Set<string>): void {
    if (results.length >= limit) return;

    if (node.endOfWord && node.metadata && !seenPaths.has(node.metadata.path)) {
      results.push(node.metadata);
      seenPaths.add(node.metadata.path);
    }

    for (const [_, childNode] of node.children) {
      if (results.length >= limit) break;
      this._dfs(childNode, results, limit, seenPaths);
    }
  }
}

/**
 * Initialize search Trie with DevCanvas destinations and index sub-words.
 */
export function initializeSearchTrie(): Trie {
  const trie = new Trie();
  
  const items: TrieMetadata[] = [
    { title: "Home", category: "Navigation", description: "Main dashboard feed & overview", path: "/app", iconName: "Home" },
    { title: "Workspace", category: "Navigation", description: "Manage active projects & analytics", path: "/app/workspace", iconName: "LayoutDashboard" },
    { title: "AI Chat", category: "Intelligence", description: "Talk to DevAI assistant", path: "/app/chat", iconName: "MessageSquare" },
    
    { title: "Architecture Generator", category: "Generator", description: "Generate cloud infra & service graph", path: "/app/architecture", iconName: "Boxes" },
    { title: "Database Generator", category: "Generator", description: "Generate PostgreSQL schemas & ER diagrams", path: "/app/database", iconName: "Database" },
    { title: "API Generator", category: "Generator", description: "Generate REST & GraphQL endpoint specs", path: "/app/api-generator", iconName: "Code2" },
    { title: "Documentation Generator", category: "Generator", description: "Generate markdown docs & reports", path: "/app/documentation", iconName: "FileText" },
    { title: "Deployment Generator", category: "Generator", description: "Generate Docker configs & CI/CD workflow actions", path: "/app/deployment", iconName: "Server" },
    
    { title: "Security Center", category: "Management", description: "Audit API endpoints & database schemas", path: "/app/security", iconName: "ShieldCheck" },
    { title: "Repository Analyzer", category: "Management", description: "Analyze repositories & files", path: "/app/repo", iconName: "GitBranch" },
    
    { title: "Settings", category: "System", description: "Configure workspaces & credentials", path: "/app/settings", iconName: "Settings" },
    { title: "Support & Help", category: "System", description: "Help documentation & contact details", path: "/app/support", iconName: "LifeBuoy" }
  ];

  items.forEach(item => {
    // Index the full title
    trie.insert(item.title, item);
    // Index subwords for prefix/keyword suggestions
    const words = item.title.toLowerCase().split(/\s+/);
    if (words.length > 1) {
      words.forEach(word => {
        if (word.length > 1) {
          trie.insert(word, item);
        }
      });
    }
  });

  return trie;
}
