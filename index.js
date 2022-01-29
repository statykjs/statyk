import Statyk from "./dist/index.mjs";
// import fetch from "cross-fetch";
// import take from "lodash/take";

const statyk = new Statyk();

statyk.init({
  out: "./out",
  input: "./examples/simple/index.html",
  pagesFolder: "pages",
});

// async function sourceDevTo() {
//   const API_BASE = "https://dev.to/api/articles";
//   const articles = await fetch(`${API_BASE}?username=anuraghazra`).then((res) =>
//     res.json()
//   );

//   const pageNodes = await Promise.all(
//     take(articles, 3).map(async (article) => {
//       const { body_markdown } = await fetch(`${API_BASE}/${article.id}`).then(
//         (res) => res.json()
//       );

//       return {
//         path: `pages/${article.slug}.md`,
//         content: `<include src="partials/layout.html" title={{props.title}}>\n${body_markdown}\n</include>`,
//         context: { title: article.title },
//       };
//     })
//   );

//   statyk.createPages(pageNodes);
// }

// /** @type {import("./src/core/types").StatykPlugin} */
// function statykPlugin() {
//   return {
//     beforeBuild: sourceDevTo,
//     afterBuild: () => {
//       console.log("Build done");
//     },
//     beforeCreatePage: async (node, buildInfo) => {
//       console.log(`beforeCreatePage for ${node.fileName}`);
//     },
//     afterCreatePage: async (node, buildInfo) => {
//       console.log(`afterCreatePage for ${node.fileName}`);
//     },
//     beforeStaticCopy() {},
//     afterStaticCopy() {},
//   };
// }

// data: 1
// [inc, inc]
// eval prop -> [2]
// -> child -> renders props.data
// -> eval prop -> [2]
statyk.use({
  beforeBuild(buildInfo) {
    statyk.createPage({
      path: "./dev.html",
      buildInfo,
      content: `
        <include src="partials/test.html" data="{{parseInt(props.data)+1}}" />
        <include src="partials/test.html" data="{{parseInt(props.data)+1}}" />
      `,
      context: { data: 1 },
    });
  },
});

statyk.build();
