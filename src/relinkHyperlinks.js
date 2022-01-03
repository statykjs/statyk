import resolvePath from "./utils/resolvePath";
import cache from "memory-cache";
import compile from "./build";

function relinkHyperlinks(root, OUTPUT_FOLDER = OUTPUT_FOLDER) {
  try {
    // Relink & parse hyperlinked files
    const hyperlinks = root.querySelectorAll('a[href!="#"]');
    hyperlinks.forEach((hyperlink) => {
      const rawUrl = hyperlink
        .getAttribute("href")
        .replace(/^(?:\.\/)+/, "")
        .replace(/^(?:\.\.\/)+/, "");

      if (rawUrl.startsWith("http")) {
        return;
      }
      const assetUrl = resolvePath(OUTPUT_FOLDER, rawUrl);
      hyperlink.setAttribute("href", `./${rawUrl.replace(".html", "")}`);
      // Fix css newline classes
      if (hyperlink.attributes.class) {
        hyperlink.setAttribute(
          "class",
          hyperlink.attributes.class.replace(/\s+/gim, " ")
        );
      }
      if (!cache.get(assetUrl)) {
        compile(assetUrl);
      }
    });
  } catch (err) {
    console.log(err);
  }
}

export default relinkHyperlinks;
