import path from 'node:path';

import { createServer, type ViteDevServer } from 'vite';

type FoundationServer = {
  port: number;
  root: string;
};

const foundationServers: FoundationServer[] = [
  { port: 43_173, root: 'apps/mobile' },
  { port: 43_174, root: 'apps/website' },
];

async function closeServers(servers: ViteDevServer[]) {
  await Promise.allSettled(servers.map(async (server) => server.close()));
}

export default async function globalSetup() {
  const servers: ViteDevServer[] = [];

  try {
    for (const foundationServer of foundationServers) {
      const server = await createServer({
        clearScreen: false,
        configFile: false,
        logLevel: 'error',
        root: path.resolve(foundationServer.root),
        server: {
          host: '127.0.0.1',
          port: foundationServer.port,
          strictPort: true,
        },
      });

      await server.listen();
      servers.push(server);
    }
  } catch (error) {
    await closeServers(servers);
    throw error;
  }

  return async () => {
    await closeServers(servers);
  };
}
