/**
 */
const regexMatchAll = (regex: RegExp, template: string, callback: (match: RegExpExecArray, index?: number) => void) => {
  /** allMatches holds all the results of RegExp.exec() */
  const allMatches = [];
  let match = regex.exec(template);
  if (!match) {
    return { matches: [], input: template };
  }

  const { input } = match;

  while (match !== null) {
    // @ts-ignore
    delete match.input;
    allMatches.push(match);
    match = regex.exec(template);
  }

  if (callback) {
    allMatches.forEach((m, index) => callback(m, index));
  }
  return { matches: allMatches, input };
};

export default regexMatchAll;
