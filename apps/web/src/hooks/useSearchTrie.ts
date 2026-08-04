import { useMemo } from "react";
import { initializeSearchTrie, type TrieMetadata } from "@/lib/trie";

// Initialize the global search Trie once at the module level.
// This ensures that the Trie is constructed once when the module loads,
// avoiding expensive re-initializations during React component render cycles.
const globalSearchTrie = initializeSearchTrie();

export function useSearchTrie() {
  const getSuggestions = useMemo(() => {
    return (query: string, limit: number = 8): TrieMetadata[] => {
      if (!query.trim()) return [];
      return globalSearchTrie.getSuggestions(query, limit);
    };
  }, []);

  return {
    getSuggestions,
    trie: globalSearchTrie
  };
}
