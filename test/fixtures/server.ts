import { createServer, Server } from 'http';
import { setTimeout } from 'timers/promises';
import busboy from 'busboy';

export async function startServer(options?: {
  keepAliveTimeout?: number;
}): Promise<{ server: Server, url: string, closeServer: any }> {
  const server = createServer(async (req, res) => {
    if (server.keepAliveTimeout) {
      res.setHeader('Keep-Alive', 'timeout=' + server.keepAliveTimeout / 1000);
    }
    const urlObject = new URL(req.url!, `http://${req.headers.host}`);
    res.setHeader('X-Foo', 'bar');
    res.setHeader('x-href', urlObject.href);
    res.setHeader('x-method', req.method ?? '');
    res.setHeader('x-request-headers', JSON.stringify(req.headers));

    const timeout = urlObject.searchParams.get('timeout');
    if (timeout) {
      await setTimeout(parseInt(timeout));
    }

    if (req.url === '/wrongjson') {
      res.setHeader('content-type', 'application/json');
      return res.end(Buffer.from('{"foo":""'));
    }

    if (req.url === '/html') {
      res.setHeader('content-type', 'text/html');
      return res.end('<h1>hello</h1>');
    }

    if (req.url === '/redirect') {
      res.setHeader('Location', '/redirect-to-url');
      res.statusCode = 302;
      return res.end();
    }
    if (req.url === '/redirect-301') {
      res.setHeader('Location', '/redirect-301-to-url');
      res.statusCode = 301;
      return res.end();
    }
    if (req.url === '/redirect-full') {
      res.setHeader('Location', `http://${req.headers.host}/redirect-full-to-url`);
      res.statusCode = 302;
      return res.end();
    }
    if (req.url === '/redirect-full-301') {
      res.setHeader('Location', `http://${req.headers.host}/redirect-full-301-to-url`);
      res.statusCode = 301;
      return res.end();
    }

    if (req.url === '/multipart' && (req.method === 'POST' || req.method === 'PUT')) {
      const bb = busboy({ headers: req.headers });
      const result = {
        method: req.method,
        url: req.url,
        href: urlObject.href,
        headers: req.headers,
        files: {},
        form: {},
      };
      bb.on('file', (name, file, info) => {
        const { filename, encoding, mimeType } = info;
        // console.log(`File [${name}]: info %j`, info);
        let size = 0;
        file.on('data', data => {
          // console.log(`File [${name}] got ${data.length} bytes`);
          size += data.length;
        }).on('close', () => {
          // console.log(`File [${name}] done`);
          result.files[name] = {
            filename,
            encoding,
            mimeType,
            size,
          };
        });
      });
      bb.on('field', (name, val) => {
        // console.log(`Field [${name}]: value length: %d, info: %j`, val.length, info);
        result.form[name] = val;
      });
      bb.on('close', () => {
        // console.log('Done parsing form!');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      });
      req.pipe(bb);
      return;
    }

    if (req.url === '/raw') {
      req.pipe(res);
      return;
    }

    let requestBody;
    const chunks = [];
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      for await (const chunk of req) {
        chunks.push(chunk);
      }
    }

    if (req.headers['content-type']?.startsWith('application/x-www-form-urlencoded')) {
      const searchParams = new URLSearchParams(Buffer.concat(chunks).toString());
      requestBody = {};
      for (const [ field, value ] of searchParams.entries()) {
        requestBody[field] = value;
      }
    } else if (req.headers['content-type']?.startsWith('application/json')) {
      requestBody = JSON.parse(Buffer.concat(chunks).toString());
    } else {
      requestBody = Buffer.concat(chunks).toString();
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      method: req.method,
      url: req.url,
      href: urlObject.href,
      headers: req.headers,
      requestBody,
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
        closeServer() {
          (server as any).closeAllConnections && (server as any).closeAllConnections();
          return new Promise(resolve => {
            server.close(resolve);
          });
        },
      });
    });
  });
}
