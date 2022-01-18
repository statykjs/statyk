const removeTrailingDots = (str: string) => {
  if (typeof str !== "string") throw new Error("String is expected");
  return str.replace(/^(?:\.\/)+/, "").replace(/^(?:\.\.\/)+/, "");
};

export default removeTrailingDots;
