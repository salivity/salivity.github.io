/**
 * salivity.github.io - Monetize Script
 *
 * All these projects have been created by the owner of salivity.github.io and are 
 * relevant to the text they are injected into through pattern matching.
 */

document.addEventListener('DOMContentLoaded', () => {
  autoLinkArticles('/monetize/patterns.json');
});

/**
 * Loads replacement configurations from a JSON file and links matching terms
 * inside all <article> elements on the page.
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

    // Sort patterns by length descending so longer/more specific patterns
    // claim text before shorter subsets can
    const prioritizedConfigs = [...configs].sort((a, b) => {
      const lenA = (a.pattern || '').length;
      const lenB = (b.pattern || '').length;
      return lenB - lenA;
    });

    articles.forEach((article) => {
      prioritizedConfigs.forEach((item) => {
        linkifyPatternInElement(article, item);
      });
    });
  } catch (error) {
    console.error('Failed to link patterns:', error);
  }
}

/**
 * Builds a RegExp instance based on the pattern configuration.
 * @param {Object} config - Pattern configuration.
 * @returns {RegExp}
 */
function buildRegex({ pattern, isRegex = false, flags = 'gi', exactBoundary = true }) {
  const safeFlags = flags.includes('g') ? flags : `${flags}g`;

  if (isRegex) {
    return new RegExp(pattern, safeFlags);
  }

  // Fallback: literal string escaping with optional word boundaries
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const source = exactBoundary ? `\\b(${escaped})\\b` : `(${escaped})`;

  return new RegExp(source, safeFlags);
}

/**
 * Traverses text nodes within an element and replaces matches with anchor tags.
 * Ignores text nodes already inside <a>, <script>, <style>, <pre>, <code>, etc.
 */
function linkifyPatternInElement(rootElement, itemConfig) {
  const { 
    link, 
    title, 
    target = '_blank', 
    rel = undefined 
  } = itemConfig;

  let regex;
  try {
    regex = buildRegex(itemConfig);
  } catch (e) {
    console.error(`Invalid regex pattern: "${itemConfig.pattern}"`, e);
    return;
  }

  const forbiddenSelector = 'a, script, style, textarea, input, button, code, pre';

  // Fresh TreeWalker for each pattern to discover only remaining raw text nodes
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

  const nodesToReplace = [];
  let currentNode = walker.nextNode();

  while (currentNode) {
    regex.lastIndex = 0;
    if (regex.test(currentNode.nodeValue)) {
      nodesToReplace.push(currentNode);
    }
    currentNode = walker.nextNode();
  }

  nodesToReplace.forEach((textNode) => {
    const text = textNode.nodeValue;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    regex.lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
        continue;
      }

      // 1. Append preceding text unchanged
      const prefixText = text.slice(lastIndex, match.index);
      if (prefixText.length > 0) {
        fragment.appendChild(document.createTextNode(prefixText));
      }

      // 2. Build the anchor element
      const anchor = document.createElement('a');
      anchor.href = link;
      if (target) anchor.target = target;
      if (rel) anchor.rel = rel;
      if (title) anchor.title = title;
      anchor.textContent = match[0];

      fragment.appendChild(anchor);

      lastIndex = regex.lastIndex;
    }

    // 3. Append remaining text after the final match
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    if (textNode.parentNode) {
      textNode.parentNode.replaceChild(fragment, textNode);
    }
  });
}
