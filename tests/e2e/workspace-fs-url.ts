import { fileURLToPath } from 'node:url';

export function workspaceFsUrl(relativePath: string): string {
  const file = fileURLToPath(new URL(`../../${relativePath}`, import.meta.url));
  return `/@fs/${file.replaceAll('\\', '/')}`;
}
