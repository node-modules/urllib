import { createServer, Server } from 'node:http';

const socketPathPrefix = '/tmp/urllib.unix.sock';
let index = 0;

export async function startServer(): Promise<{
  server: Server,
  url: string,
  socketPath: string,
  closeServer: any,
}> {
  const socketPath = `${socketPathPrefix}_${index++}`;
  const unixSocketServer = createServer();

  unixSocketServer.on('request', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify({ a: 1 }));
    res.end();
  });

  return new Promise(resolve => {
    unixSocketServer.listen(socketPath, () => {
      resolve({
        url: 'http://localhost/',
        server: unixSocketServer,
        socketPath,
        closeServer: () => new Promise(resolve => unixSocketServer.close(resolve)),
      });
    });
  });
}
