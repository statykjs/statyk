/**
 *
 * @param {RegExp} regex
 * @param {string} template
 * @param {(match: string) => void} template
 * @returns {{matches: string[], template: string}}
 */
const regexMatchAll = (regex, template, callback) => {
  /** allMatches holds all the results of RegExp.exec() */
  const allMatches = [];
  let match = regex.exec(template);
  if (!match) {
    return { matches: [], input: template };
  }

  const { input } = match;

  while (match !== null) {
    delete match.input;
    allMatches.push(match);
    match = regex.exec(template);
  }

  if (callback) {
    allMatches.forEach(callback);
  }
  return { matches: allMatches, input };
};

export default regexMatchAll;
