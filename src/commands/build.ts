import Statyk from "../core/statyk";

async function build() {
  const statyk = new Statyk();
  statyk.init();
  await statyk.build();
}

if (process.argv.includes("--run")) {
  build();
}

export default build;
// const contentIncludes = root.querySelectorAll("[data-include-content]");

// contentIncludes.forEach((include) => {
//   const url = include.getAttribute("data-include-content");
//   const globUrls = glob.sync(resolvePath(buildConfig.OUTPUT_FOLDER, url));

//   globUrls.forEach((globUrl) => {
//     let markdown = fs.readFileSync(globUrl, { encoding: "utf-8" });
//     const frontmatter = fm(markdown);
//     markdown = markdown.replace(/^---$.*^---$/ms, "");

//     const html = marked.parse(frontmatter.body);
//     const title = kebabCase(frontmatter.attributes.title);
//     const file = `./dist/${fileName.replace(".html", "")}/${title}.html`;
//     root
//       .querySelector("head")
//       .setAttribute("data-prop-title", frontmatter.attributes.title);
//     include.innerHTML = html;
//     root.innerHTML = compileTemplate(root.innerHTML, buildConfig.OUTPUT_FOLDER);

//     fs.ensureDirSync(path.dirname(file));
//     fs.writeFileSync(file, root.toString());
//   });
// });

// if (contentIncludes.length === 0) {
//   fs.writeFileSync(`./dist/${fileName}`, root.toString());
// }
