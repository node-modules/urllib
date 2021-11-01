import { expectType } from 'tsd';
import { curl } from '..';

// curl
expectType<Buffer>((await curl<Buffer>('http://a.com')).data);
// RequestOptions
expectType<Buffer>((await curl<Buffer>('http://a.com', {})).data);
expectType<string>((await curl<string>('http://a.com', {
  method: 'HEAD',
})).data);
