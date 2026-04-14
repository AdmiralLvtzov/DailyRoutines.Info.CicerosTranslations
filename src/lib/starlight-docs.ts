export function isArticleDocsPage(routeId: string) {
  const segments = routeId.replace(/\\/g, '/').split('/').filter(Boolean);
  const docsIndex = segments.indexOf('docs');

  if (docsIndex === -1) {
    return false;
  }

  return segments.length - docsIndex - 1 >= 2;
}
