import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';
import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

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

export async function readableToString(stream: Readable | ReadableStream) {
  const bytes = await readableToBytes(stream);
  return bytes.toString();
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

export function nodeMajorVersion() {
  return parseInt(process.versions.node.split('.')[0]);
}
