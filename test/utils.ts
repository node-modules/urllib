import { Readable } from 'stream';
import { ReadableStream } from 'stream/web';
import { rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

export async function sleep(ms: number) {
  await new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export async function readableToBytes(stream: Readable | ReadableStream) {
  const chunks: Buffer[] = [];
  let chunk: Buffer;
  for await (chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function createTempfile(content?: Buffer | string) {
  const tmpfile = join(tmpdir(), randomUUID());
  if (typeof content === 'string') {
    content = Buffer.from(content);
  }
  if (Buffer.isBuffer(content)) {
    await writeFile(tmpfile, content);
  }
  return {
    tmpfile,
    async cleanup() {
      await rm(tmpfile, { force: true });
    },
  };
}
