import { schema } from '@kbn/utils';

import { KibanaRequest } from './request';
import { KibanaResponse, responseFactory } from './response';

/**
 * RouteSchemas contains the schemas for validating the different parts of a
 * request.
 *
 * @typedef {Object} RouteSchemas
 *
 * @property {?Object} params
 * @property {?Object} query
 * @property {?Object} body
 */

/**
 * Describes route configuration options.
 *
 * @typedef {Object} RouteConfig
 *
 * @property {string} path The endpoint _within_ the router path to register the route. E.g. if the
 * router is registered at `/elasticsearch` and the route path is `/search`,
 * the full path for the route is `/elasticsearch/search`.
 *
 * @function validate Function that will be called when setting up the route and that returns
 * a schema that every request will be validated against. To opt out of validating the
 * request, specify `false`.
 * @param {Schema} schema
 * @returns {RouteSchemas}
 */

/**
 * Describes a single route of router.
 *
 * @typedef {Object} RouterRoute
 *
 * @property {string} method
 * @property {string} path
 *
 * @function handler
 * @param {Request} req
 * @param {ResponseToolkit} responseToolkit
 * @returns {Promise<ResponseObject>}
 */

/**
 * @function RequestHandler
 * @param {KibanaRequest} req
 * @param {ResponseFactory} createResponse
 * @returns {Promise<KibanaResponse | Object>}
 */

export class Router {
  /**
   * @type {RouterRoute[]}
   * @readonly
   */
  routes = [];

  /**
   * @type {string}
   */
  path;

  constructor(path) {
    this.path = path;
  }

  /**
   * Register a `GET` request with the router.
   * @param {RouteConfig} route
   * @param {RequestHandler} handler
   */
  get(route, handler) {
    const routeSchemas = this._routeSchemasFromRouteConfig(route, 'GET');
    this.routes.push({
      method: 'GET',
      path: route.path,
      handler: async (req, responseToolkit) =>
        await this._handle(routeSchemas, req, responseToolkit, handler),
    });
  }

  /**
   * Register a `POST` request with the router.
   * @param {RouteConfig} route
   * @param {RequestHandler} handler
   */
  post(route, handler) {
    const routeSchemas = this._routeSchemasFromRouteConfig(route, 'POST');
    this.routes.push({
      method: 'POST',
      path: route.path,
      handler: async (req, responseToolkit) =>
        await this._handle(routeSchemas, req, responseToolkit, handler),
    });
  }

  /**
   * Register a `PUT` request with the router.
   * @param {RouteConfig} route
   * @param {RequestHandler} handler
   */
  put(route, handler) {
    const routeSchemas = this._routeSchemasFromRouteConfig(route, 'POST');
    this.routes.push({
      method: 'PUT',
      path: route.path,
      handler: async (req, responseToolkit) =>
        await this._handle(routeSchemas, req, responseToolkit, handler),
    });
  }

  /**
   * Register a `DELETE` request with the router.
   * @param {RouteConfig} route
   * @param {RequestHandler} handler
   */
  delete(route, handler) {
    const routeSchemas = this._routeSchemasFromRouteConfig(route, 'DELETE');
    this.routes.push({
      method: 'DELETE',
      path: route.path,
      handler: async (req, responseToolkit) =>
        await this._handle(routeSchemas, req, responseToolkit, handler),
    });
  }

  /**
   * Returns all routes registered with the this router.
   * @returns {RouterRoute[]} List of registered routes.
   */
  getRoutes() {
    return [...this.routes];
  }

  /**
   * Create the schemas for a route
   *
   * @param {RouteConfig} route
   * @param {string} routeMethod
   * @returns {RouteSchemas} Route schemas if `validate` is specified on the route, otherwise
   * undefined.
   * @private
   */
  _routeSchemasFromRouteConfig(route, routeMethod) {
    // The type doesn't allow `validate` to be undefined, but it can still
    // happen when it's used from JavaScript.
    if (route.validate === undefined) {
      throw new Error(
        `The [${routeMethod}] at [${
          route.path
        }] does not have a 'validate' specified. Use 'false' as the value if you want to bypass validation.`
      );
    }

    return route.validate ? route.validate(schema) : undefined;
  }

  /**
   * @param {?RouteSchemas} routeSchemas
   * @param {Request} request
   * @param {ResponseToolkit} responseToolkit
   * @param {RequestHandler} handler
   * @returns {Promise<*>}
   * @private
   */
  async _handle(routeSchemas, request, responseToolkit, handler) {
    let kibanaRequest;

    try {
      kibanaRequest = KibanaRequest.from(request, routeSchemas);
    } catch (e) {
      // TODO Handle failed validation
      return responseToolkit.response({ error: e.message }).code(400);
    }

    try {
      const kibanaResponse = await handler(kibanaRequest, responseFactory);

      if (kibanaResponse instanceof KibanaResponse) {
        let payload = null;
        if (kibanaResponse.payload instanceof Error) {
          // TODO Design an error format
          payload = { error: kibanaResponse.payload.message };
        } else if (kibanaResponse.payload !== undefined) {
          payload = kibanaResponse.payload;
        }

        return responseToolkit.response(payload).code(kibanaResponse.status);
      }

      return responseToolkit.response(kibanaResponse);
    } catch (e) {
      // TODO Handle `KibanaResponseError`

      // Otherwise we default to something along the lines of
      return responseToolkit.response({ error: e.message }).code(500);
    }
  }
}
