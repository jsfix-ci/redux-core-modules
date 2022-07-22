import { take, fork, race, delay } from 'redux-saga/effects';
import { Dispatch } from 'redux';
import { THROTTLE_TIMEOUT } from '@/constants';
import { FETCH_FORM_MANAGER } from '../actions';
import { FormManagerType } from '../types';
import { formManagerWorkerSaga } from './form-manager-worker-saga';

type ParamsType = {
  dependencies?: Record<string, any>;
  dispatch: Dispatch;
};

export function* formManagerWatcherSaga({
  dependencies,
  dispatch,
}: ParamsType) {
  while (true) {
    let action: { payload: FormManagerType } = yield take(FETCH_FORM_MANAGER);

    while (true) {
      const { debounced, latestAction } = yield /* TODO: JSFIX could not patch the breaking change:
      now race should be finished if any of effects resolved with END (by analogy with all)

      Suggested fix: Only relevant if any of the raced effects resolve with an END value. In most scenarios, this change can be ignored.*/
      race({
        debounced: delay(THROTTLE_TIMEOUT),
        latestAction: take(FETCH_FORM_MANAGER),
      });

      if (debounced) {
        yield fork(formManagerWorkerSaga, {
          payload: action.payload,
          dependencies,
          dispatch,
        });
        break;
      }

      action = latestAction;
    }
  }
}
