import { createTranslationRuntimeFetchFromEnvironment } from './runtime.js';
import {
  composeCloudflarePorts,
  type CloudflareTranslationEnvironment,
} from './cloudflare-ports.js';
export { TranslationQuotaCoordinator } from './cloudflare-ports.js';

type Handler = (request: Request) => Promise<Response>;
let last: { values: [string, unknown][]; fetch: typeof fetch; handler: Handler } | undefined;

function handlerFor(environment: CloudflareTranslationEnvironment): Handler {
  const values = Object.entries(environment).sort(([a], [b]) => a.localeCompare(b));
  if (
    last &&
    last.fetch === globalThis.fetch &&
    last.values.length === values.length &&
    last.values.every(
      ([key, value], index) => key === values[index]?.[0] && value === values[index]?.[1],
    )
  )
    return last.handler;
  const handler = createTranslationRuntimeFetchFromEnvironment(composeCloudflarePorts(environment));
  last = { values, fetch: globalThis.fetch, handler };
  return handler;
}
/**
 * Deployable entry point for a separately reviewed Worker environment. The
 * committed configuration keeps it disabled, so this never dispatches to a
 * provider until a later platform activation supplies every required binding.
 */
const worker = {
  fetch(request: Request, environment: CloudflareTranslationEnvironment): Promise<Response> {
    return handlerFor(environment)(request);
  },
};

export default worker;
