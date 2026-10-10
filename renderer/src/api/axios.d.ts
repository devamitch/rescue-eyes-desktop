/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  AxiosHeaders,
  AxiosInterceptorManager,
  AxiosPromise,
  AxiosRequestConfig,
  AxiosRequestConfig as AxiosRequestConfig3,
  AxiosResponse,
  HeadersDefaults,
  RawAxiosRequestHeaders,
} from 'axios';

import type { URLS_TYPE } from '../../constants/common/urls';

declare module 'axios' {
  export type COMMON_URL_CONFIG = {
    url: URLS_TYPE;
  };
  export type CreateAxiosDefaults<D = any> = {
    headers?: RawAxiosRequestHeaders | AxiosHeaders | Partial<HeadersDefaults>;
  } & Omit<AxiosRequestConfig2<D>, 'headers'>;

  export type AxiosRequestConfig2<D = any> = {
    url?: URLS_TYPE;
  } & Omit<AxiosRequestConfig3<D>, 'url'>;

  export type API_INSTANCE_TYPE_INTERCEPTER_REQUEST_CONFIG<T extends COMMON_URL_CONFIG> = {
    url: URLS_TYPE;
  } & AxiosRequestConfig2<T>;

  export type REQUEST_CONFIG = API_INSTANCE_TYPE_INTERCEPTER_REQUEST_CONFIG<COMMON_URL_CONFIG>;
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export type API_INSTANCE_TYPE_INTERCEPTER_REQUEST = {} & AxiosInterceptorManager<REQUEST_CONFIG>;

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export type API_INSTANCE_TYPE_INTERCEPTER_Response = {} & AxiosInterceptorManager<AxiosResponse>;

  export type AxiosInstance = {
    (config: REQUEST_CONFIG): AxiosPromise;
    (url: URLS_TYPE, config?: REQUEST_CONFIG): AxiosPromise;
    url?: URLS_TYPE;
    interceptors: {
      request: API_INSTANCE_TYPE_INTERCEPTER_REQUEST;
      response: API_INSTANCE_TYPE_INTERCEPTER_Response;
    };
    get<T = unknown, R = AxiosResponse<T>, D = unknown>(
      url: URLS_TYPE,
      config?: AxiosRequestConfig<D>
    ): Promise<R>;
    delete<T = unknown, R = AxiosResponse<T>, D = unknown>(
      url: URLS_TYPE,
      config?: AxiosRequestConfig<D>
    ): Promise<R>;
    head<T = unknown, R = AxiosResponse<T>, D = unknown>(
      url: URLS_TYPE,
      config?: AxiosRequestConfig<D>
    ): Promise<R>;
    options<T = unknown, R = AxiosResponse<T>, D = unknown>(
      url: URLS_TYPE,
      config?: AxiosRequestConfig<D>
    ): Promise<R>;
    post<T = unknown, R = AxiosResponse<T>, D = unknown>(
      url: URLS_TYPE,
      data?: D,
      config?: AxiosRequestConfig<D>
    ): Promise<R>;
    put<T = unknown, R = AxiosResponse<T>, D = unknown>(
      url: URLS_TYPE,
      data?: D,
      config?: AxiosRequestConfig<D>
    ): Promise<R>;
    patch<T = unknown, R = AxiosResponse<T>, D = unknown>(
      url: URLS_TYPE,
      data?: D,
      config?: AxiosRequestConfig<D>
    ): Promise<R>;
  };
}
