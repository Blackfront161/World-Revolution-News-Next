/**
 * Deploy-valid but deliberately non-operational Worker entrypoint. It has no
 * provider, quota, article, moderation, or storage binding and never parses a
 * generation body. A future reviewed composition must inject those ports.
 */
export interface PodcastWorkerEnvironment {
  readonly WRN_PODCAST_GENERATION_ENABLED?: string;
  readonly PODCAST_RESOURCE_VERIFICATION?: string;
}

function response(
  status: number,
  body: { readonly code: string; readonly message: string },
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export const podcastWorker = {
  fetch(request: Request): Response {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health')
      return response(503, {
        code: 'PODCAST_GENERATION_DISABLED',
        message: 'Podcast generation is not configured.',
      });
    if (request.method === 'POST' && url.pathname === '/v1/podcasts')
      return response(503, {
        code: 'PODCAST_GENERATION_DISABLED',
        message: 'Podcast generation is not configured.',
      });
    return response(404, { code: 'NOT_FOUND', message: 'Not found.' });
  },
};

export default podcastWorker;
