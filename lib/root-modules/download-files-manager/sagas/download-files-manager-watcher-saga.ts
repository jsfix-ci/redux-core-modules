import { take, fork, cancel } from 'redux-saga/effects';
import { DOWNLOAD_FILE_MANAGER } from '../actions';
import { DownloadFilesManagerType } from '../types';
import { downloadFilesManagerWorkerSaga } from './download-files-manager-worker-saga';

export function* downloadFilesManagerWatcherSaga() {
  let lastTask;

  while (true) {
    const { payload }: { payload: DownloadFilesManagerType } = yield take(
      DOWNLOAD_FILE_MANAGER,
    );

    if (lastTask) {
      yield cancel(lastTask);
    }

    lastTask = yield fork(downloadFilesManagerWorkerSaga, payload);
  }
}
