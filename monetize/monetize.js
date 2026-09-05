/**
 * salivity.github.io - Monetize Script
 */

document.addEventListener('DOMContentLoaded', () => {
  autoLinkArticles('/monetize/patterns.json');
});

/**
 * Loads replacement configurations and links matching terms inside <article> elements.
 * @param {string} jsonPath - URL/path to the patterns JSON file.
 */
async function autoLinkArticles(jsonPath) {
  try {
    const response = await fetch(jsonPath);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const configs = await response.json();
    const articles = document.querySelectorAll('article');

    // Build individual compiled regular expressions for every config
    const compiledRules = configs
      .filter((item) => item && item.pattern)
      .map((config) => {
        let patternSource = config.pattern;
        if (!config.isRegex) {
          const escaped = config.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          patternSource = config.exactBoundary !== false ? `\\b${escaped}\\b` : escaped;
        }
        return {
          ...config,
          regex: new RegExp(patternSource, 'gi')
        };
      });

    if (compiledRules.length === 0) return;

    articles.forEach((article) => {
      linkifyElement(article, compiledRules);
    });
  } catch (error) {
    console.error('Failed to link patterns:', error);
  }
}

/**
 * Traverses text nodes within an element and links occurrences using all rules.
 * Automatically handles conflicts by choosing the longest/earliest match.
 */
function linkifyElement(rootElement, compiledRules) {
  const forbiddenSelector = 'a, script, style, textarea, input, button, code, pre';

  const walker = document.createTreeWalker(
    rootElement,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (node.parentElement && node.parentElement.closest(forbiddenSelector)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes = [];
  let currentNode = walker.nextNode();
  while (currentNode) {
    textNodes.push(currentNode);
    currentNode = walker.nextNode();
  }

  textNodes.forEach((textNode) => {
    const text = textNode.nodeValue;
    if (!text || !text.trim()) return;

    // Collect all potential matches from all patterns
    const matches = [];

    compiledRules.forEach((rule) => {
      rule.regex.lastIndex = 0;
      let m;
      while ((m = rule.regex.exec(text)) !== null) {
        if (m[0].length === 0) {
          rule.regex.lastIndex++;
          continue;
        }
        matches.push({
          start: m.index,
          end: m.index + m[0].length,
          text: m[0],
          rule: rule
        });
      }
    });

    if (matches.length === 0) return;

    // Sort matches:
    // 1. Earliest appearance first (start ascending)
    // 2. Longest matched phrase first (length descending)
    matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

    // Filter out overlapping matches (keep the earliest/longest)
    const nonOverlappingMatches = [];
    let lastMatchedIndex = 0;

    for (const match of matches) {
      if (match.start >= lastMatchedIndex) {
        nonOverlappingMatches.push(match);
        lastMatchedIndex = match.end;
      }
    }

    // Build the fragment with text and replacement <a> nodes
    const fragment = document.createDocumentFragment();
    let cursor = 0;

    nonOverlappingMatches.forEach((match) => {
      // Append preceding plain text
      if (match.start > cursor) {
        fragment.appendChild(document.createTextNode(text.slice(cursor, match.start)));
      }

      // Create target anchor tag
      const anchor = document.createElement('a');
      anchor.href = match.rule.link;
      if (match.rule.target) anchor.target = match.rule.target;
      if (match.rule.rel) anchor.rel = match.rule.rel;
      if (match.rule.title) anchor.title = match.rule.title;
      anchor.textContent = match.text;

      fragment.appendChild(anchor);
      cursor = match.end;
    });

    // Append any trailing plain text
    if (cursor < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(cursor)));
    }

    if (textNode.parentNode) {
      textNode.parentNode.replaceChild(fragment, textNode);
    }
  });
}
