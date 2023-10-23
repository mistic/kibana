/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

export interface HasId {
  id: string;
}

export const apiHasId = (unknownApi: unknown | null): unknownApi is HasId => {
  return Boolean((unknownApi as HasId)?.id !== undefined);
};

export const getId = (api: unknown | null): string | undefined =>
  apiHasId(api) ? api.id : undefined;
