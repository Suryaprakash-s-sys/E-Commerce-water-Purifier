/** Adds a record version to remote image URLs so replaced assets bypass native caches. */
export function versionImageUrl(url: string, updatedAt?: Date): string {
  if (!url || !updatedAt || Number.isNaN(updatedAt.getTime())) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${updatedAt.getTime()}`;
}
