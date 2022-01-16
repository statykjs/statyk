import Statyk from "./src/core/statyk";
import fetch from "node-fetch";
import { take } from "lodash-es";

const statyk = new Statyk();

statyk.init({
  out: "./dist",
  input: "./examples/simple/index.html",
  pagesFolder: "pages",
});

async function sourceDevTo() {
  const API_BASE = "https://dev.to/api/articles";
  const articles = await fetch(`${API_BASE}?username=anuraghazra`).then((res) =>
    res.json()
  );

  const pageNodes = await Promise.all(
    take(articles, 3).map(async (article) => {
      const { body_markdown } = await fetch(`${API_BASE}/${article.id}`).then(
        (res) => res.json()
      );

      return {
        path: `pages/${article.slug}.md`,
        content: `<include src="partials/layout.html" title={{props.title}}>${body_markdown}</include>`,
        context: { title: article.title },
      };
    })
  );

  statyk.createPages(pageNodes);
}

function statykPlugin() {
  return {
    beforeStaticCopy() {},
    afterStaticCopy() {},
    beforeBuild: sourceDevTo,
    afterBuild: () => {
      console.log("Build done");
    },
    beforeCreatePage: () => {},
    afterCreatepage: () => {},
  };
}

statyk.use(statykPlugin());

statyk.serve();
