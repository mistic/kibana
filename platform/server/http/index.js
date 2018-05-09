import { HttpService } from './http_service';
import { HttpConfig } from './http_config';

export { Router, KibanaRequest } from './router';
export { HttpService };

export { HttpConfig };

export class HttpModule {
  /**
   * @type {HttpService}
   * @readonly
   */
  service;

  /**
   * @type {Observable<HttpConfig>}
   * @readonly
   */
  config$;

  constructor(config$, logger, env) {
    this.config$ = config$;
    this.service = new HttpService(this.config$, logger, env);
  }
}
