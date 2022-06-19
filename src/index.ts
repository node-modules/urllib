import { HttpClient } from './HttpClient';
import { RequestOptions, RequestURL } from './Request';

let httpclient: HttpClient;
export async function request(url: RequestURL, options?: RequestOptions) {
  if (!httpclient) {
    httpclient = new HttpClient();
  }
  return await httpclient.request(url, options);
}

export { HttpClient } from './HttpClient';

export default {
  request,
};

