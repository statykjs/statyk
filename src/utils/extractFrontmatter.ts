import fm from "../libs/frontmatter";
import yml from "js-yaml";

type FmExtractorReturn = {
  isCodeblock: boolean;
  body: string;
  attributes: Record<string, any>;
  code: string | null;
};

function extractFrontmatter(content: string): FmExtractorReturn {
  const matter = fm(content);

  if (matter.bodyBegin) {
    return {
      isCodeblock: false,
      body: content,
      attributes: {},
      code: null,
    };
  }

  if (matter.isYml) {
    let attributes: Record<string, any> = {};
    try {
      attributes = yml.load(matter.frontmatter!) as Record<string, any>;
    } catch {}
    return {
      isCodeblock: false,
      body: matter.body,
      attributes,
      code: null,
    };
  }

  return {
    isCodeblock: true,
    body: matter.body,
    attributes: {},
    code: matter.frontmatter!,
  };
}

export default extractFrontmatter;
