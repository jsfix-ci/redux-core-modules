import { put, call, all, select } from 'redux-saga/effects';
import {
  setModalAction,
  DEFAULT_SUCCESS_NOTIFICATION_MESSAGE,
} from '@wildberries/notifications';
import { getTranslationsDictionary } from '@mihanizm56/i18n-react';
import { setAppErrorAction } from '@/root-modules/ui-module';
import { requestExtraDataHandlerActionSaga } from '@/root-modules/request-extra-data-handler-module';
import {
  redirectManagerSagaAction,
  IRedirectManagerPayload,
} from '@/root-modules/redirect-manager-module';
import { InitLoadManagerActionPayloadType } from '../types';

export function* initLoadManagerWorkerSaga({
  payload: {
    requestConfigList,
    options: { fullActionLoadingStop, fullActionLoadingStart } = {},
  },
}: {
  payload: InitLoadManagerActionPayloadType;
}) {
  const langDict = yield select(getTranslationsDictionary);

  let counterRequests = 0;

  if (fullActionLoadingStart) {
    yield put(fullActionLoadingStart());
  }

  while (counterRequests < requestConfigList.length) {
    const {
      resetAction,
      resetActionsArray,
      request,
      requestDataFormatter,
      actionSuccess,
      actionsArraySuccess,
      requestExtraDataHandlerOptions,
      showSuccessNotification,
      isDataCritical,
      errorAction,
      errorActionsArray,
      showErrorNotification,
      loadingStopAction,
      loadingStartAction,
      withoutFormattingError,
      requestOptions,
      formatDataToRedirectParamsSuccess,
      redirectRouteParamsSuccess,
      formatDataToRedirectParamsError,
      redirectRouteParamsError,
    } = requestConfigList[counterRequests];

    try {
      // reset actions
      if (resetAction) {
        yield put(resetAction());
      } else if (resetActionsArray) {
        yield all(resetActionsArray.map(action => put(action())));
      }

      if (loadingStartAction) {
        yield put(loadingStartAction());
      }

      // make the request with language dictionary (optionally with params)
      const { error, errorText, data, additionalErrors } = yield call(request, {
        body: requestOptions,
        langDict,
        isErrorTextStraightToOutput: withoutFormattingError,
      });

      // if an error in request
      if (error) {
        // eslint-disable-next-line
        throw { message: errorText, additionalErrors };
      }

      // format data
      const formattedData = requestDataFormatter
        ? requestDataFormatter(data)
        : data;

      // success actions
      if (actionSuccess && formattedData) {
        yield put(actionSuccess(formattedData));
      } else if (actionsArraySuccess) {
        yield all(
          actionsArraySuccess.map(action => put(action(formattedData))),
        );
      }

      // custom data redux actions in one middleware
      if (requestExtraDataHandlerOptions) {
        yield put(
          requestExtraDataHandlerActionSaga({
            data: formattedData,
            options: requestExtraDataHandlerOptions,
          }),
        );
      }

      // set success notification
      if (showSuccessNotification) {
        yield put(
          setModalAction({
            status: 'error',
            text: DEFAULT_SUCCESS_NOTIFICATION_MESSAGE,
          }),
        );
      }

      // handle success redirect
      if (redirectRouteParamsSuccess) {
        const redirectData: IRedirectManagerPayload = formatDataToRedirectParamsSuccess
          ? formatDataToRedirectParamsSuccess({
              ...redirectRouteParamsSuccess,
              ...data,
            })
          : redirectRouteParamsSuccess;

        yield put(redirectManagerSagaAction(redirectData));
      }
    } catch (error) {
      console.error('error in initLoadManagerWorkerSaga', error.message);

      // if data in request is critical and we dont get it -> set app global error
      if (isDataCritical) {
        console.error('error', 'get is critical fetch fail');

        yield put(setAppErrorAction());
        break;
      }

      // set error actions
      if (errorAction) {
        yield put(errorAction(error.message));
      } else if (errorActionsArray) {
        yield all(errorActionsArray.map(action => put(action(error.message))));
      }

      // set error notification
      if (showErrorNotification) {
        yield put(
          setModalAction({
            status: 'error',
            text: error.message,
          }),
        );
      }

      // handle error redirect
      if (redirectRouteParamsError) {
        const redirectData: IRedirectManagerPayload = formatDataToRedirectParamsError
          ? formatDataToRedirectParamsError({
              ...redirectRouteParamsError,
              ...error.additionalErrors,
            })
          : redirectRouteParamsError;

        yield put(redirectManagerSagaAction(redirectData));
      }
    } finally {
      if (loadingStopAction) {
        yield put(loadingStopAction());
      }
    }

    // go to next request
    counterRequests += 1;
  }

  if (fullActionLoadingStop) {
    yield put(fullActionLoadingStop());
  }
}
