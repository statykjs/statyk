import resolvePath from "../utils/resolvePath";
import cache from "memory-cache";

/**
 * @param {HTMLElement} root
 * @param {string} baseFolder
 * @param {string} pagesFolder
 */
function relinkHyperlinks(root, baseFolder, pagesFolder) {
  const pagesRegex = new RegExp(`^\\b${pagesFolder}\\b`);
  try {
    // Relink & parse hyperlinked files
    const hyperlinks = root.querySelectorAll('a[href!="#"]');
    hyperlinks.forEach((hyperlink) => {
      const rawUrl = hyperlink.getAttribute("href");
      const assetUrl = resolvePath(baseFolder, rawUrl);
      if (rawUrl.startsWith("http")) return;

      const href = `/${rawUrl.replace(pagesRegex, "").replace("/", "")}`;
      hyperlink.setAttribute("href", href);

      // Fix css newline classes
      // (only related to tailwind classes where classes are newline separated)
      if (hyperlink.attributes.class) {
        hyperlink.setAttribute(
          "class",
          hyperlink.attributes.class.replace(/\s+/gim, " ")
        );
      }

      if (!cache.get(assetUrl)) {
        // compile(assetUrl);
      }
    });
  } catch (err) {
    console.log(err);
  }
}

export default relinkHyperlinks;
