import { HTMLElement } from "node-html-parser";
import resolvePath from "../utils/resolvePath";
import compile from "./compile";

/**
 * @param {HTMLElement} root
 * @param {import("./types").StatykContext} statykCtx
 */
function relinkHyperlinks(root, statykCtx) {
  const pagesRegex = new RegExp(`^\\b${statykCtx.PAGES_FOLDER}\\b`);
  try {
    // Relink & parse hyperlinked files
    const hyperlinks = root.querySelectorAll('a[href!="#"]');
    hyperlinks.forEach((hyperlink) => {
      const rawUrl = hyperlink.getAttribute("href");
      const assetUrl = resolvePath(statykCtx.BASE_FOLDER, rawUrl);
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

      // !coreRuntime.compileCache.get(assetUrl)
      // disable automatic link compiling for now
      if (false) {
        console.log(assetUrl);
        compile(assetUrl, statykCtx);
      }
    });
  } catch (err) {
    console.log(err);
  }
}

export default relinkHyperlinks;
