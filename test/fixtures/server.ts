import { createServer, Server } from 'http';
import { setTimeout } from 'timers/promises';

export async function startServer(options?: {
  keepAliveTimeout?: number;
}): Promise<{ server: Server, url: string }> {
  const server = createServer(async (req, res) => {
    if (server.keepAliveTimeout) {
      res.setHeader('Keep-Alive', 'timeout=' + server.keepAliveTimeout / 1000);
    }

    const urlObject = new URL(req.url!, `http://${req.headers.host}`);
    const timeout = urlObject.searchParams.get('timeout');
    if (timeout) {
      await setTimeout(parseInt(timeout));
    }
    res.setHeader('X-Foo', 'bar');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      method: req.method,
      url: req.url,
      href: urlObject.href,
      headers: req.headers,
    }));
  });
  if (options?.keepAliveTimeout) {
    server.keepAliveTimeout = options.keepAliveTimeout;
  }

  return new Promise(resolve => {
    server.listen(0, () => {
      const address: any = server.address();
      resolve({
        url: `http://127.0.0.1:${address.port}/`,
        server,
      });
    });
  });
}
