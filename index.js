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

const staticKeyMap = new Map();
let staticKeyMapLoaded = false;

async function loadStaticKeyMap(kv) {
  if (staticKeyMapLoaded) return;
  const list = await kv.list({ limit: 100 });
  for (const { name } of list.keys) {
    const match = name.match(/^(.*)\.[0-9a-f]{8,}\.([^./]+)$/);
    if (match) {
      const originalPath = `/${match[1]}.${match[2]}`;
      staticKeyMap.set(originalPath, name);
    }
    staticKeyMap.set(`/${name}`, name);
  }
  staticKeyMapLoaded = true;
}

async function resolveStaticKey(kv, path) {
  await loadStaticKeyMap(kv);
  if (staticKeyMap.has(path)) {
    return staticKeyMap.get(path);
  }

  const clean = path.startsWith('/') ? path.slice(1) : path;
  for (const [originalPath, hashedName] of staticKeyMap.entries()) {
    if (originalPath === path) return hashedName;
    if (originalPath.endsWith(`/${clean}`) || originalPath === `/${clean}`) {
      return hashedName;
    }
  }
  return null;
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
      if (url.pathname === '/_debug') {
        const list = await kv.list({ limit: 100 });
        return new Response(JSON.stringify(list, null, 2), {
          headers: { 'content-type': 'application/json;charset=UTF-8' },
        });
      }

      const path = url.pathname === '/' ? '/index.html' : url.pathname;
      const key = await resolveStaticKey(kv, path);
      if (!key) {
        const list = await kv.list({ limit: 100 });
        return new Response(JSON.stringify({
          error: 'Not found',
          requestedPath: path,
          list,
        }, null, 2), {
          status: 404,
          headers: { 'content-type': 'application/json;charset=UTF-8' },
        });
      }

      const data = await kv.get(key, { type: 'arrayBuffer' });
      if (data === null) {
        return new Response('Not found', { status: 404 });
      }

      return new Response(data, {
        headers: {
          'content-type': getContentType(path),
        },
      });
    } catch (error) {
      return new Response(`Worker error: ${error.message}`, { status: 500 });
    }
  },
};