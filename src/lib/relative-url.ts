function normalizePathname(pathname: string) {
  if (!pathname || pathname === '/') {
    return [];
  }

  return pathname
    .replace(/\/index\.html$/i, '/')
    .split('/')
    .filter(Boolean);
}

export function toRelativePath(currentPathname: string, targetPathname: string) {
  const currentSegments = normalizePathname(currentPathname);
  const targetSegments = normalizePathname(targetPathname);
  const maxSharedLength = Math.min(currentSegments.length, targetSegments.length);
  let sharedLength = 0;

  while (
    sharedLength < maxSharedLength &&
    currentSegments[sharedLength] === targetSegments[sharedLength]
  ) {
    sharedLength += 1;
  }

  const upwardPath = '../'.repeat(currentSegments.length - sharedLength);
  const forwardPath = targetSegments.slice(sharedLength).join('/');
  const relativePath = `${upwardPath}${forwardPath}`;

  if (!relativePath) {
    return './';
  }

  return relativePath.endsWith('/') ? relativePath : `${relativePath}/`;
}
