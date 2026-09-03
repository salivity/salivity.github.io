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

    articles.forEach((article) => {
      configs.forEach((item) => {
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
  if (isRegex) {
    // Ensure the 'g' flag is present for multi-match execution
    const safeFlags = flags.includes('g') ? flags : `${flags}g`;
    return new RegExp(pattern, safeFlags);
  }

  // Fallback: literal string escaping with optional word boundaries
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const source = exactBoundary ? `\\b(${escaped})\\b` : `(${escaped})`;
  const safeFlags = flags.includes('g') ? flags : `${flags}g`;

  return new RegExp(source, safeFlags);
}

/**
 * Traverses text nodes within an element and replaces matches with anchor tags.
 * Ignores text nodes already inside <a>, <script>, <style>, etc.
 */
function linkifyPatternInElement(rootElement, itemConfig) {
  const { 
    link, 
    title, 
    target = '_blank', 
    rel = 'noopener noreferrer' 
  } = itemConfig;

  let regex;
  try {
    regex = buildRegex(itemConfig);
  } catch (e) {
    console.error(`Invalid regex pattern: "${itemConfig.pattern}"`, e);
    return;
  }

  const walker = document.createTreeWalker(
    rootElement,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        // Skip text inside links, inputs, and non-rendering elements
        const forbiddenTags = ['A', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'BUTTON', 'CODE', 'PRE'];
        if (node.parentElement && forbiddenTags.includes(node.parentElement.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const nodesToReplace = [];
  let currentNode = walker.nextNode();

  while (currentNode) {
    // Reset regex index before test
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
      // Prevent infinite loops on zero-length matches (e.g. regexes like /(?=...)/)
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
        continue;
      }

      // Append plain text before match
      if (match.index > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.slice(lastIndex, match.index))
        );
      }

      // Create anchor element
      const anchor = document.createElement('a');
      anchor.href = link;
      if (target) anchor.target = target;
      if (rel) anchor.rel = rel;
      if (title) anchor.title = title;

      // Preserve matched text
      anchor.textContent = match[0];

      fragment.appendChild(anchor);
      lastIndex = regex.lastIndex;
    }

    // Append any trailing plain text
    if (lastIndex < text.length) {
      fragment.appendChild(
        document.createTextNode(text.slice(lastIndex))
      );
    }

    if (textNode.parentNode) {
      textNode.parentNode.replaceChild(fragment, textNode);
    }
  });
}
