import { CustomReducerType, InjectAsyncReducerParams } from '@/types';
import { createReducer } from '@/store/create-reducer';

export const removeAsyncReducer = ({
  store,
  name,
}: Omit<InjectAsyncReducerParams, 'reducer'>) => {
  const asyncReducersInStore = store.asyncReducers;
  const rootReducers = store.rootReducers;
  const wasReducerInjected = Boolean(asyncReducersInStore[name]);
  const wasRootReducerInjected = Boolean(rootReducers[name]);

  if (!wasReducerInjected || wasRootReducerInjected) {
    return;
  }

  delete asyncReducersInStore[name];

  const { [name]: reducerToDelete, ...prevState } = store.getState(); // eslint-disable-line

  // define new reducer
  const newReducer: CustomReducerType = createReducer({
    prevState,
    asyncReducers: asyncReducersInStore,
    rootReducers,
  }) as CustomReducerType;

  // log to the devtools
  store.dispatch({
    type: '@REDUX-CORE-MODULES REMOVE REDUCER',
    payload: {
      name,
    },
  });

  // inject reducer
  store.replaceReducer(newReducer);
};
