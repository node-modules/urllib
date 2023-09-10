import { RequestURL, RequestOptions2, RequestOptions } from 'urllib';
import { HttpClientResponse } from 'urllib';
import urllib from 'urllib';
import * as urllib2 from 'urllib';

async function request(url: RequestURL, options: RequestOptions): Promise<HttpClientResponse> {
  return await urllib.request(url, options);
}

async function request2(url: RequestURL, options: RequestOptions2): Promise<HttpClientResponse> {
  return await urllib2.curl(url, options);
}

console.log(request, request2);
