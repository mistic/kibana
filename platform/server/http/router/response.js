export class KibanaResponse {
  /**
   * @type {number}
   * @readonly
   */
  status;

  /**
   * @type {*}
   * @readonly
   */
  payload;

  constructor(status, payload) {
    this.status = status;
    this.payload = payload;
  }
}

export const responseFactory = {
  ok: payload => new KibanaResponse(200, payload),
  accepted: payload => new KibanaResponse(202, payload),
  noContent: () => new KibanaResponse(204),
  badRequest: err => new KibanaResponse(400, err),
};
