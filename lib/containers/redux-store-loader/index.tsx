import React, { PropsWithChildren } from 'react';
import { State } from 'router5';
import { ReactReduxContext } from 'react-redux';
import { IAdvancedStore } from '@/types';
import { replaceReducersAndSagas } from '@/utils/replace-reducers-and-sagas';
import { getIsClient } from '@/utils';
import { StoreInjectConfig } from './types';
import { runInjectorConfig } from './utils/run-injector-config';
import { processDeprecationLogs } from './utils/loggers';

type PropsType = PropsWithChildren<{
  toState?: State;
  fromState?: State;
  store?: IAdvancedStore;
  storeInjectConfig?: StoreInjectConfig;
  withoutRemovingReducers?: boolean;
}>;

type StateType = {
  reduxStore: IAdvancedStore;
  ableToReplace: boolean;
};

export class ReduxStoreLoader extends React.Component<PropsType, StateType> {
  // eslint-disable-next-line
  static contextType = ReactReduxContext;

  contextStore: IAdvancedStore;

  constructor(props: PropsType, context: any) {
    super(props, context);

    this.contextStore = context.store;

    // link to store in state because of getting "this.context" in getDerivedStateFromProps
    this.state = {
      reduxStore: context.store,
      ableToReplace: !context.store.isSSR, // need not to replace after SSR send chunk to the client
    };

    processDeprecationLogs(props);
  }

  static getDerivedStateFromProps(props: PropsType, state: any) {
    const isNode = !getIsClient();

    // if SSR and initial load
    if (isNode) {
      return { ableToReplace: false };
    }

    if (!state.ableToReplace) {
      return { ableToReplace: true };
    }

    replaceReducersAndSagas({
      fromState: props.fromState,
      toState: props.toState,
      store: state.reduxStore,
      withoutRemovingReducers: props.withoutRemovingReducers,
    });

    return {};
  }

  componentDidMount() {
    runInjectorConfig({
      ...this.props,
      store: this.state.reduxStore,
    });
  }

  componentDidUpdate() {
    runInjectorConfig({
      ...this.props,
      store: this.state.reduxStore,
    });
  }

  render() {
    return this.props.children;
  }
}
