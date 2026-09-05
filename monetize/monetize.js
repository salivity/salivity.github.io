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

    // Filter out invalid items and sort longer/more specific patterns first
    const prioritizedConfigs = [...configs]
      .filter((item) => item && item.pattern)
      .sort((a, b) => (b.pattern.length || 0) - (a.pattern.length || 0));

    if (prioritizedConfigs.length === 0) return;

    // Build the combined master regex mapping capture groups to their respective configs
    const { combinedRegex, groupToConfigMap } = buildCombinedRegex(prioritizedConfigs);

    articles.forEach((article) => {
      linkifyElementWithCombinedRegex(article, combinedRegex, groupToConfigMap);
    });
  } catch (error) {
    console.error('Failed to link patterns:', error);
  }
}

/**
 * Combines all individual pattern rules into a single regular expression with capture groups.
 * Every pattern is evaluated in the same pass.
 */
function buildCombinedRegex(configs) {
  const groupToConfigMap = [];
  const patternParts = [];

  configs.forEach((config) => {
    const { pattern, isRegex = false, exactBoundary = true } = config;
    let source;

    if (isRegex) {
      source = pattern;
    } else {
      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      source = exactBoundary ? `\\b${escaped}\\b` : escaped;
    }

    // Wrap each in an outer capturing group
    patternParts.push(`(${source})`);
    groupToConfigMap.push(config);
  });

  const combinedRegex = new RegExp(patternParts.join('|'), 'gi');
  return { combinedRegex, groupToConfigMap };
}

/**
 * Traverses text nodes within an element and replaces matches with anchor tags.
 * Ignores text nodes already inside <a>, <script>, <style>, <pre>, <code>, etc.
 */
function linkifyElementWithCombinedRegex(rootElement, combinedRegex, groupToConfigMap) {
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
    combinedRegex.lastIndex = 0;

    // Check if node contains any match before DOM manipulation
    if (!combinedRegex.test(text)) return;

    combinedRegex.lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match;

    while ((match = combinedRegex.exec(text)) !== null) {
      if (match.index === combinedRegex.lastIndex) {
        combinedRegex.lastIndex++;
        continue;
      }

      // Identify which pattern captured the match
      // match[0] is the full match, match[1..n] are the respective capture groups
      let matchedConfig = null;
      for (let i = 1; i < match.length; i++) {
        if (match[i] !== undefined) {
          matchedConfig = groupToConfigMap[i - 1];
          break;
        }
      }

      if (!matchedConfig) continue;

      // Append preceding plain text
      const prefixText = text.slice(lastIndex, match.index);
      if (prefixText.length > 0) {
        fragment.appendChild(document.createTextNode(prefixText));
      }

      // Build target anchor tag
      const anchor = document.createElement('a');
      anchor.href = matchedConfig.link;
      if (matchedConfig.target) anchor.target = matchedConfig.target;
      if (matchedConfig.rel) anchor.rel = matchedConfig.rel;
      if (matchedConfig.title) anchor.title = matchedConfig.title;
      anchor.textContent = match[0];

      fragment.appendChild(anchor);
      lastIndex = combinedRegex.lastIndex;
    }

    // Append remainder text
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    if (textNode.parentNode) {
      textNode.parentNode.replaceChild(fragment, textNode);
    }
  });
}
