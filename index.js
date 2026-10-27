const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function getContentType(pathname) {
  const ext = pathname.substring(pathname.lastIndexOf('.')).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

function candidatePaths(pathname) {
  if (pathname === '/') {
    return ['/index.html', '/Public/index.html'];
  }

  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const candidates = [cleanPath];

  if (cleanPath.startsWith('/Public/')) {
    candidates.push(cleanPath.replace('/Public', ''));
  } else {
    candidates.push(`/Public${cleanPath}`);
  }

  return [...new Set(candidates)];
}

async function tryAssetFetch(assetBinding, request, pathname) {
  const candidates = candidatePaths(pathname);

  for (const candidate of candidates) {
    const candidateUrl = new URL(request.url);
    candidateUrl.pathname = candidate;
    const response = await assetBinding.fetch(new Request(candidateUrl.toString(), request));

    if (response.status !== 404) {
      return { response, resolvedPath: candidate };
    }
  }

  return { response: null, resolvedPath: null };
}

export default {
  async fetch(request, env) {
    try {
      const assets = env.ASSETS;
      if (!assets || typeof assets.fetch !== 'function') {
        return new Response(
          'Assets binding is unavailable or invalid',
          {
            status: 500,
            headers: { 'content-type': 'text/plain; charset=utf-8' },
          }
        );
      }

      const url = new URL(request.url);

      const { response, resolvedPath } = await tryAssetFetch(assets, request, url.pathname);
      if (!response) {
        return new Response('Not found', { status: 404 });
      }

      return response;
    } catch (error) {
      return new Response('Worker error', { status: 500 });
    }
  },
};