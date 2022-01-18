import path from "node:path";

const resolvePath = (baseFolder: string, url: string) => {
  return path.resolve(process.cwd(), baseFolder, ...url.split(path.sep));
};
export default resolvePath;
