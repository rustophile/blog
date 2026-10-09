export interface SpeechContent {
  nodes: HTMLElement[];
  parts: string[];
  totalWords: number;
}

const text = (element: HTMLElement) =>
  (element.innerText || element.textContent || "").trim();

/** Collects the title, description, and readable prose in their spoken order. */
export function extractSpeechContent(content: Element): SpeechContent {
  const article =
    content.closest("article") || document.querySelector("article") || document;
  const title = article.querySelector<HTMLElement>(
    "h1.post-title, h1.project-title, .post-header h1, .project-header h1, h1",
  );
  const description = article.querySelector<HTMLElement>(
    ".post-description, .project-description, .post-header p.post-description, .project-header p",
  );

  const introduction = [title, description].filter(
    (element): element is HTMLElement => Boolean(element && text(element)),
  );
  const body = Array.from(
    content.querySelectorAll<HTMLElement>("h2, h3, p, li, blockquote"),
  ).filter(
    (element) =>
      !element.closest("pre") &&
      !element.closest(".expressive-code") &&
      !element.closest(".code-block") &&
      !element.closest(".toc") &&
      !element.closest("table") &&
      !element.closest(".callout-title") &&
      Boolean(text(element)),
  );

  const nodes = [...introduction, ...body].filter((element) => text(element));
  const parts = nodes.map(text);
  const totalWords = parts.reduce(
    (total, part) => total + part.split(/\s+/).filter(Boolean).length,
    0,
  );

  return { nodes, parts, totalWords };
}

export function speechLanguage(pageLanguage: string): string {
  return pageLanguage.startsWith("pt") ? "pt-BR" : "en-US";
}
