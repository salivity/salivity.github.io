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

      // 1. Slice preceding text
      let prefixText = text.slice(lastIndex, match.index);

      // Ensure a space exists before the anchor tag
      if (prefixText.length > 0) {
        if (!/\s$/.test(prefixText)) {
          prefixText += ' ';
        }
      } else if (lastIndex === 0 && textNode.previousSibling) {
        // Handle boundary if this match is at the very beginning of the text node
        fragment.appendChild(document.createTextNode(' '));
      }

      if (prefixText) {
        fragment.appendChild(document.createTextNode(prefixText));
      }

      // 2. Build the anchor element (trimming in case the regex captured whitespace)
      const anchor = document.createElement('a');
      anchor.href = link;
      if (target) anchor.target = target;
      if (rel) anchor.rel = rel;
      if (title) anchor.title = title;
      anchor.textContent = match[0].trim();

      fragment.appendChild(anchor);

      // 3. Ensure a space exists after the anchor tag
      const remainingSlice = text.slice(regex.lastIndex);
      if (remainingSlice.length > 0) {
        // If the immediate next character is not whitespace, prepend a space
        if (!/^\s/.test(remainingSlice)) {
          fragment.appendChild(document.createTextNode(' '));
        }
      } else if (!textNode.nextSibling) {
        // Optional: appends trailing space if at end of text node
        fragment.appendChild(document.createTextNode(' '));
      }

      lastIndex = regex.lastIndex;
    }

    // Append any trailing text after the last match
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    if (textNode.parentNode) {
      textNode.parentNode.replaceChild(fragment, textNode);
    }
  });
}
