import { AnyAction } from '@/types';

export interface IRedirectManagerPayload {
  pathName: string;
  params?: any;
  actionAfterRedirect?: AnyAction;
  actionAfterRedirectParams?: Record<string, any>;
  callbackAfterRedirect?: () => any;
  reload?: boolean;
}
