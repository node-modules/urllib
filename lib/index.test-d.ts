import { expectType } from 'tsd';
import { curl } from '..';

// curl
expectType<Buffer>((await curl<Buffer>('http://a.com')).data);
// RequestOptions
expectType<Buffer>((await curl<Buffer>('http://a.com', {})).data);
expectType<string>((await curl<string>('http://a.com', {
  method: 'HEAD',
})).data);
expectType<string>((await curl<string>('http://a.com', {
  method: 'head',
})).data);

// HttpClientResponse
const res = await curl<Buffer>('http://a.com');
expectType<number | undefined>(res.res.timing?.queuing);
expectType<number | undefined>(res.res.timing?.dnslookup);
expectType<number | undefined>(res.res.timing?.connected);
expectType<number | undefined>(res.res.timing?.requestSent);
expectType<number | undefined>(res.res.timing?.waiting);
expectType<number | undefined>(res.res.timing?.contentDownload);
