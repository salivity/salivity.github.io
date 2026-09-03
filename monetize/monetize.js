/**
 * salivity.github.io - Monetize Script
 *
 * All these projects have been created by the owner of salivity.github.io and are relevant to the text they in injected in to through pattern matching
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
 * Traverses text nodes within an element and replaces matches with anchor tags.
 * Ignores text nodes already inside <a>, <script>, <style>, etc.
 */
function linkifyPatternInElement(rootElement, { pattern, link, title }) {

  // Match the pattern globally and case-insensitive
  const regex = new RegExp(pattern, 'gi');

  const walker = document.createTreeWalker(
    rootElement,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        // Skip text nodes already nested within links or non-display elements
        const forbiddenTags = ['A', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE' ,'PRE'];
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
    if (regex.test(currentNode.nodeValue)) {
      nodesToReplace.push(currentNode);
    }
    currentNode = walker.nextNode();
  }

  // Replace collected text nodes with a DocumentFragment containing <a> elements
  nodesToReplace.forEach((textNode) => {
    const text = textNode.nodeValue;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    // Reset regex index for repeated execution
    regex.lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Append preceding plain text
      if (match.index > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.slice(lastIndex, match.index))
        );
      }

      // Create the anchor element
      const anchor = document.createElement('a');
      anchor.href = link;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer'; // Security & performance best practice
      anchor.title = title;
      anchor.textContent = match[0]; // Retains the original casing from the source text

      fragment.appendChild(anchor);
      lastIndex = regex.lastIndex;
    }

    // Append remaining trailing text
    if (lastIndex < text.length) {
      fragment.appendChild(
        document.createTextNode(text.slice(lastIndex))
      );
    }

    textNode.parentNode.replaceChild(fragment, textNode);
  });
}
