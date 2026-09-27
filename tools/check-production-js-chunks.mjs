import { lstat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const maximumProductionChunkBytes = 500_000;
const clients = ['mobile', 'website'];

export async function inspectProductionChunkDirectory(directory, client = 'production') {
  const entries = await readdir(directory, { withFileTypes: true });
  const chunks = [];
  for (const entry of entries) {
    if (!entry.name.endsWith('.js')) continue;
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink())
      throw new Error(`${client} chunk must not be a symbolic link: ${entry.name}`);
    const stats = await lstat(file);
    if (!stats.isFile()) throw new Error(`${client} chunk is not a regular file: ${entry.name}`);
    if (stats.size > maximumProductionChunkBytes)
      throw new Error(
        `${client} production chunk ${entry.name} is ${stats.size} bytes; maximum is ${maximumProductionChunkBytes}`,
      );
    chunks.push({ name: entry.name, bytes: stats.size });
  }
  if (chunks.length === 0) throw new Error(`${client} production build has no JavaScript chunks`);
  chunks.sort((left, right) => right.bytes - left.bytes || left.name.localeCompare(right.name));
  return { client, chunks, largest: chunks[0] };
}

export async function inspectProductionChunks(workspace = process.cwd()) {
  const report = [];
  for (const client of clients) {
    const directory = path.join(workspace, 'apps', client, 'dist', 'assets');
    report.push(await inspectProductionChunkDirectory(directory, client));
  }
  return report;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const report = await inspectProductionChunks();
  console.log(JSON.stringify({ maximumProductionChunkBytes, report }));
}
