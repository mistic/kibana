/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { EuiButton, EuiTitle } from '@elastic/eui';
import React, { useEffect, useImperativeHandle, useMemo, useState } from 'react';
import useAsync from 'react-use/lib/useAsync';
import { BehaviorSubject } from 'rxjs';

// Publishes errors
// Publishes view mode
// publishes description
// publishes title
// publishes loading
// publishes uuid
// has edit capability

interface SuperApiType {
  superCounter$: BehaviorSubject<number>;
  incrementSuperCounter: () => void;
}

/** ------------------------------------------------------------------------------------------
 * testing getting state from API
 * ------------------------------------------------------------------------------------------ */
const useSubjectFromReactiveVar = <T extends unknown = unknown>(value: T) => {
  const subject = useMemo<BehaviorSubject<T>>(
    () => new BehaviorSubject<T>(value),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  useEffect(() => subject.next(value), [subject, value]);
  return subject;
};

const useReactiveVarFromSubject = <T extends unknown = unknown>(subject?: BehaviorSubject<T>) => {
  const [value, setValue] = useState<T | undefined>(subject?.getValue() ?? undefined);
  useEffect(() => {
    if (!subject) return;
    const subscription = subject.subscribe((newValue) => setValue(newValue));
    return () => subscription.unsubscribe();
  }, [subject]);

  return value;
};

const isSuperApiType = (unknownApi: null | unknown): unknownApi is SuperApiType => {
  const isSuperType = Boolean(
    unknownApi &&
      (unknownApi as SuperApiType)?.incrementSuperCounter &&
      (unknownApi as SuperApiType)?.superCounter$ !== undefined
  );
  return isSuperType;
};

const useSuperCounterFromAPI = (api: null | unknown) => {
  const isSuperAPI = isSuperApiType(api);
  const superCounter = useReactiveVarFromSubject(isSuperAPI ? api.superCounter$ : undefined);
  const incrementSuperCounter = isSuperAPI ? api.incrementSuperCounter : undefined;
  return { superCounter, incrementSuperCounter };
};

const useApiPublisher = <ApiType extends unknown = unknown>(
  api: ApiType,
  ref: React.ForwardedRef<ApiType>
) => {
  const publishApi = useMemo(
    () => api,
    // disabling exhaustive deps because the API should be created once and never change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  useImperativeHandle(ref, () => publishApi);
};

const CreateEmbeddableComponent: <ApiType extends unknown = unknown>(
  component: (
    ref: React.ForwardedRef<ApiType>
  ) => React.ReactElement<any, string | React.JSXElementConstructor<any>> | null
) => EmbeddableComponent<ApiType> = (component) =>
  React.forwardRef((_, apiRef) => component(apiRef));

/** ------------------------------------------------------------------------------------------
 * testing registering a React embeddable component
 * ------------------------------------------------------------------------------------------ */

const superTestEmbeddableFactory: EmbeddableComponentFactory<{ superName: string }, SuperApiType> =
  {
    deserializeState: (state) => {
      // this is where you'd do any validation or type casting.
      return state as { superName: string };
    },
    getComponent: async (initialState) => {
      // simulate async import
      await new Promise((r) => setTimeout(r, 3000));

      const { superName } = initialState;

      return CreateEmbeddableComponent((apiRef) => {
        const [superCounter, setSuperCounter] = useState<number>(0);
        const superCounter$ = useSubjectFromReactiveVar(superCounter);

        useApiPublisher(
          {
            superCounter$,
            incrementSuperCounter: () => setSuperCounter((curr) => curr + 1),
          },
          apiRef
        );

        return (
          <>
            <EuiTitle>
              <span>
                {superName}&apos;s Ye olde Component: INTERNAL COUNTER IS {superCounter}
              </span>
            </EuiTitle>
            <EuiButton onClick={() => setSuperCounter((curr) => curr + 10)}>
              INCREMENT INTERNAL
            </EuiButton>
          </>
        );
      });
    },
  };

/** ------------------------------------------------------------------------------------------
 * testing types
 * ------------------------------------------------------------------------------------------ */

type EmbeddableComponent<ApiType extends unknown = unknown> = React.ForwardRefExoticComponent<
  React.RefAttributes<ApiType>
>;

interface EmbeddableComponentFactory<
  StateType extends unknown = unknown,
  APIType extends unknown = unknown
> {
  getComponent: (initialState: StateType) => Promise<EmbeddableComponent<APIType>>;
  deserializeState: (state: unknown) => StateType;
}

/** ------------------------------------------------------------------------------------------
 * testing rendering an embeddable component INTO the Analytics panel
 * ------------------------------------------------------------------------------------------ */
export const EmbeddableComponentRenderer = ({
  getInitialState,
}: {
  getInitialState: () => unknown;
}) => {
  const { value: Component, loading } = useAsync(() => {
    const initialState = getInitialState();
    return superTestEmbeddableFactory.getComponent(
      superTestEmbeddableFactory.deserializeState(initialState)
    );
  });

  if (loading || !Component) return <span>loading...</span>;
  return <AnalyticsPanel Component={Component} />;
};

/** ------------------------------------------------------------------------------------------
 * testing Analytics panel
 * ------------------------------------------------------------------------------------------ */
export const AnalyticsPanel = <ApiType extends unknown = unknown, PropsType extends {} = {}>({
  Component,
  componentProps,
}: {
  Component: React.ForwardRefExoticComponent<PropsType & React.RefAttributes<ApiType>>;
  componentProps?: Omit<React.ComponentProps<typeof Component>, 'ref'>;
}) => {
  const [api, setApi] = useState<ApiType | null>(null);
  const { superCounter, incrementSuperCounter } = useSuperCounterFromAPI(api);

  return (
    <>
      <Component
        {...(componentProps as React.ComponentProps<typeof Component>)}
        ref={(newApi) => {
          if (newApi && !api) setApi(newApi);
        }}
      />
      <EuiTitle>
        <span>Count is {superCounter}</span>
      </EuiTitle>
      <EuiButton onClick={() => incrementSuperCounter?.()}>INCREMENT PLZ</EuiButton>
    </>
  );
};

/** ------------------------------------------------------------------------------------------
 * testing rendering some other componet into the Analytics panel
 * ------------------------------------------------------------------------------------------ */

export const SpecificAnalyticsComponent = React.forwardRef<SuperApiType, { testName: string }>(
  ({ testName }, apiRef) => {
    const [superCounter, setSuperCounter] = useState<number>(0);
    const superCounter$ = useSubjectFromReactiveVar(superCounter);

    useApiPublisher(
      {
        superCounter$,
        incrementSuperCounter: () => setSuperCounter((curr) => curr + 1),
      },
      apiRef
    );

    return (
      <>
        <EuiTitle>
          <span>
            {testName}&apos;s super specific whatever component {superCounter}
          </span>
        </EuiTitle>
        <EuiButton onClick={() => setSuperCounter((curr) => curr + 10)}>INCREMENT me plz</EuiButton>
      </>
    );
  }
);
