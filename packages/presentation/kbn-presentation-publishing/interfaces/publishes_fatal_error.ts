/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { PublishingSubject, useReactiveVarFromSubject } from '../publishing_utils';

export interface PublishesFatalError {
  fatalError: PublishingSubject<Error>;
}

export const apiPublishesFatalError = (
  unknownApi: null | unknown
): unknownApi is PublishesFatalError => {
  return Boolean(unknownApi && (unknownApi as PublishesFatalError)?.fatalError !== undefined);
};

export const useFatalError = (api: null | unknown) =>
  useReactiveVarFromSubject(apiPublishesFatalError(api) ? api.fatalError : undefined);
export const getFatalError = (api: null | unknown) =>
  apiPublishesFatalError(api) ? api.fatalError.getValue() : undefined;
