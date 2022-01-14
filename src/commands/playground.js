import { buildConfig } from "./build";
import compileTemplate from "./utils/compileTemplate";

const output = compileTemplate(
  `
  <div class="row">
  {{ map([1, 2], v => \`
  <include
    src="partials/card.html"
    title="\${v}"
    desc="nice"
    linkHref="#"
    linkText="text-\${v}"
  />
  \`) }}
  </div>
`,
  buildConfig.BASE_FOLDER
);
