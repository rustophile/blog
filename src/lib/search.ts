// Search over /search-index.json (built by src/pages/search-index.json.ts): scoring, filtering,
// and match highlighting, kept free of DOM code so the dialog only renders the results.

export interface SearchItem {
  id: string;
  type: "post" | "project";
  title: string;
  description: string;
  url: string;
  date: string;
  tags: string[];
  category?: string;
  emoji?: string;
}

export interface TagItem {
  name: string;
  count: number;
  url: string;
}

export interface SearchData {
  posts: SearchItem[];
  projects: SearchItem[];
  tags: TagItem[];
}

export interface SearchResults {
  posts: SearchItem[];
  projects: SearchItem[];
  tags: TagItem[];
}

/** A run of text, marked when it matched part of the query. */
export interface Segment {
  text: string;
  match: boolean;
}

// case- and accent-insensitive: "Café" matches "cafe"
export function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokens(query: string): string[] {
  return normalize(query).split(/\s+/).filter(Boolean);
}

// Each query word scores where it appears: in the title (more if the title starts with it),
// in a tag, in a project's category, or in the description. Items scoring 0 don't match.
function score(item: SearchItem, words: string[]): number {
  const title = normalize(item.title);
  const description = normalize(item.description);
  const tags = item.tags.map(normalize);
  const category = item.category ? normalize(item.category) : "";

  let total = 0;
  for (const word of words) {
    if (title.includes(word)) total += 50;
    if (title.startsWith(word)) total += 30;
    if (tags.some((tag) => tag.includes(word))) total += 40;
    if (category.includes(word)) total += 25;
    if (description.includes(word)) total += 15;
  }
  return total;
}

function rank(items: SearchItem[], words: string[]): SearchItem[] {
  return items
    .map((item) => ({ item, score: score(item, words) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}

export function search(data: SearchData, query: string): SearchResults {
  const words = tokens(query);
  if (words.length === 0) return { posts: [], projects: [], tags: [] };
  return {
    posts: rank(data.posts, words),
    projects: rank(data.projects, words),
    // a tag matches only when it contains every word
    tags: data.tags.filter((tag) => {
      const name = normalize(tag.name);
      return words.every((word) => name.includes(word));
    }),
  };
}

const escapeRegExp = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Splits text into segments, marking each case-insensitive occurrence of a query word. */
export function highlight(text: string, query: string): Segment[] {
  const words = query.trim().split(/\s+/).filter(Boolean).map(escapeRegExp);
  if (!text || words.length === 0) return [{ text, match: false }];
  const pattern = new RegExp(`(${words.join("|")})`, "gi");
  // split with a capture group puts the matches at the odd indexes
  return text
    .split(pattern)
    .map((part, i) => ({ text: part, match: i % 2 === 1 }))
    .filter((segment) => segment.text);
}
