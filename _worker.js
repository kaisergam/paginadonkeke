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

export default {
  async fetch(request, env) {
    try {
      const kv = env.__STATIC_CONTENT;
      if (!kv || typeof kv.get !== 'function') {
        return new Response(
          JSON.stringify({
            error: 'Static assets binding is unavailable or invalid',
            envKeys: Object.keys(env),
            kvType: typeof kv,
            kvHasGet: kv && typeof kv.get,
          }, null, 2),
          {
            status: 500,
            headers: { 'content-type': 'application/json;charset=UTF-8' },
          }
        );
      }

      const url = new URL(request.url);
      let path = url.pathname === '/' ? '/index.html' : url.pathname;
      if (path.startsWith('/')) {
        path = path.slice(1);
      }

      const data = await kv.get(path, { type: 'arrayBuffer' });
      if (data === null) {
        return new Response('Not found', { status: 404 });
      }

      return new Response(data, {
        headers: {
          'content-type': getContentType(url.pathname === '/' ? '/index.html' : url.pathname),
        },
      });
    } catch (error) {
      return new Response(`Worker error: ${error.message}`, { status: 500 });
    }
  },
};