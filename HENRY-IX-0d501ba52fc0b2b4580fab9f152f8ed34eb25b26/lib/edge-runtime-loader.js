module.exports = function(source) {
  if (!source.includes("export const runtime = 'edge'") && !source.includes("export const runtime='edge'")) {
    return source + "\nexport const runtime = 'edge';";
  }
  return source;
};
