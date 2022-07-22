import { take, fork, race, delay } from 'redux-saga/effects';
import { Dispatch } from 'redux';
import { THROTTLE_TIMEOUT } from '@/constants';
import { DOWNLOAD_FILE_MANAGER } from '../actions';
import { DownloadFilesManagerType } from '../types';
import { downloadFilesManagerWorkerSaga } from './download-files-manager-worker-saga';

type ParamsType = {
  dependencies?: Record<string, any>;
  dispatch: Dispatch;
};

export function* downloadFilesManagerWatcherSaga({
  dependencies,
  dispatch,
}: ParamsType) {
  while (true) {
    let action: { payload: DownloadFilesManagerType } = yield take(
      DOWNLOAD_FILE_MANAGER,
    );

    while (true) {
      const { debounced, latestAction } = yield /* TODO: JSFIX could not patch the breaking change:
      now race should be finished if any of effects resolved with END (by analogy with all)

      Suggested fix: Only relevant if any of the raced effects resolve with an END value. In most scenarios, this change can be ignored.*/
      race({
        debounced: delay(THROTTLE_TIMEOUT),
        latestAction: take(DOWNLOAD_FILE_MANAGER),
      });

      if (debounced) {
        yield fork(downloadFilesManagerWorkerSaga, {
          ...action.payload,
          dependencies,
          dispatch,
        });
        break;
      }

      action = latestAction;
    }
  }
}
