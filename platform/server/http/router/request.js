import { filterHeaders } from './headers';

/**
 * Validates the different parts of a request based on the schemas defined for
 * the route. Builds up the actual params, query and body object that will be
 * received in the route handler.
 *
 * @param {Request} req
 * @param {?RouteSchemas} routeSchemas
 * @returns {{ params?: Object, query?: Object, body?: Object}}
 */
function validate(req, routeSchemas) {
  if (routeSchemas === undefined) {
    return {
      params: {},
      query: {},
      body: {},
    };
  }

  const params =
    routeSchemas.params === undefined
      ? {}
      : routeSchemas.params.validate(req.params);

  const query =
    routeSchemas.query === undefined
      ? {}
      : routeSchemas.query.validate(req.query);

  const body =
    routeSchemas.body === undefined
      ? {}
      : routeSchemas.body.validate(req.payload);

  return { query, params, body };
}

export class KibanaRequest {
  /**
   * @type {Object<string, string | string[] | undefined>}
   * @readonly
   */
  headers;

  /**
   * @type {Object}
   * @readonly
   */
  params;

  /**
   * @type {Object}
   * @readonly
   */
  query;

  /**
   * @type {Object}
   * @readonly
   */
  body;

  /**
   * Factory for creating requests. Validates the request before creating an
   * instance of a KibanaRequest.
   *
   * @param {Request} req
   * @param {?RouteSchemas} routeSchemas
   * @returns {KibanaRequest}
   */
  static from(req, routeSchemas) {
    const requestParts = validate(req, routeSchemas);
    return new KibanaRequest(
      req,
      requestParts.params,
      requestParts.query,
      requestParts.body
    );
  }

  constructor(req, params, query, body) {
    this.params = params;
    this.query = query;
    this.body = body;
    this.headers = req.headers;
  }

  /**
   * @param {string[]} headersToKeep
   * @returns {Object<string, string|string[]|undefined>}
   */
  getFilteredHeaders(headersToKeep) {
    return filterHeaders(this.headers, headersToKeep);
  }
}
