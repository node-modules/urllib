import { createServer, Server } from 'node:http';

const socketPath = '/tmp/urllib.unix.sock';
export async function startServer(): Promise<{
  server: Server,
  url: string,
  socketPath: string,
  closeServer: any,
}> {
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
