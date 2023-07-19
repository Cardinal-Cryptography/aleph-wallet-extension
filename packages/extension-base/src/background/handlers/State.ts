// Copyright 2019-2023 @polkadot/extension-bg authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { MetadataDef, ProviderMeta } from '@polkadot/extension-inject/types';
import type { JsonRpcResponse, ProviderInterface, ProviderInterfaceCallback } from '@polkadot/rpc-provider/types';
import type { AccountJson, AuthorizeTabRequestPayload, MetadataRequest, RequestPayload, RequestRpcSend, RequestRpcSubscribe, RequestRpcUnsubscribe, ResponseRpcListProviders, SigningRequest } from '../types';

import settings from '@polkadot/ui-settings';
import { assert } from '@polkadot/util';

import localStorageStores from '../../utils/localStorageStores';
import { SignerPayloadJSONWithType, SignerPayloadRawWithType } from '../types';
import { withErrorLog } from './helpers';

interface AuthRequest {
  id: string;
  idStr: string;
  payload: AuthorizeTabRequestPayload;
  url: string;
}

export type AuthUrls = Record<string, AuthUrlInfo>;

export type AuthorizedAccountsDiff = {
  [url: string]: AuthUrlInfo['authorizedAccounts']
}

export interface AuthUrlInfo {
  count: number;
  id: string;
  // this is from pre-0.44.1
  isAllowed?: boolean;
  lastAuth: number;
  origin: string;
  url: string;
  authorizedAccounts: string[];
}

// List of providers passed into constructor. This is the list of providers
// exposed by the extension.
type Providers = Record<string, {
  meta: ProviderMeta;
  // The provider is not running at init, calling this will instantiate the
  // provider.
  start: () => ProviderInterface;
}>

interface SignRequest {
  account: AccountJson;
  id: string;
  payload: RequestPayload;
  url: string;
}

const NOTIFICATION_URL = chrome.runtime.getURL('notification.html');

const POPUP_WINDOW_OPTS = {
  focused: true,
  height: 640,
  state: 'normal',
  type: 'popup',
  url: NOTIFICATION_URL,
  width: 376
} satisfies chrome.windows.CreateData;

const NORMAL_WINDOW_OPTS = {
  focused: true,
  height: 640,
  state: 'normal',
  type: 'normal',
  url: NOTIFICATION_URL,
  width: 376
} satisfies chrome.windows.CreateData;

export enum NotificationOptions {
  None,
  Normal,
  PopUp,
}

export default class State {
  // Map of providers currently injected in tabs
  readonly #injectedProviders = new Map<chrome.runtime.Port, ProviderInterface>();

  #notification = settings.notification;

  // Map of all providers exposed by the extension, they are retrievable by key
  readonly #providers: Providers;

  #windows: number[] = [];

  #connectedTabsUrl: string[] = [];

  constructor (providers: Providers = {}) {
    this.#providers = providers;
  }

  public async getKnownMetadata (): Promise<MetadataDef[]> {
    return Object.values(await localStorageStores.chainMetadata.get());
  }

  public async getAuthRequestsNumber (): Promise<number> {
    return (await localStorageStores.authRequests.get()).length;
  }

  public async getMetadataRequestsNumber (): Promise<number> {
    return (await localStorageStores.metadataRequests.get()).length;
  }

  public async getSignRequestsNumber (): Promise<number> {
    return (await localStorageStores.signRequests.get()).length;
  }

  public getAllSignRequests (): Promise<SigningRequest[]> {
    return localStorageStores.signRequests.get();
  }

  public getAuthUrls (): Promise<AuthUrls> {
    return localStorageStores.authUrls.get();
  }

  public async getDefaultAuthAccountSelection (): Promise<string[]> {
    return localStorageStores.defaultAuthAccounts.get();
  }

  private async popupOpen (): Promise<void> {
    const windowOpts = this.#notification === 'window'
      ? NORMAL_WINDOW_OPTS
      : POPUP_WINDOW_OPTS;

    const isExtensionWindowOpened = await chrome.windows.getAll({
      populate: true,
      windowTypes: [windowOpts.type]
    })
      .then((windows) => windows.flatMap((window) => window.tabs))
      .then((tabs) => tabs.filter((tab) => tab?.url?.startsWith(windowOpts.url)))
      .then((extensionNotificationPopups) => !!extensionNotificationPopups.length);

    if (isExtensionWindowOpened) {
      return;
    }

    this.#notification !== 'extension' &&
      chrome.windows.create(
        windowOpts,
        (window): void => {
          if (window) {
            this.#windows.push(window.id || 0);

            // We're adding chrome.windows.update to make sure that the extension popup is not fullscreened
            // There is a bug in Chrome that causes the extension popup to be fullscreened when user has any fullscreened browser window opened on the main screen
            chrome.windows.update(window.id || 0, { state: 'normal' }).catch(console.error);
          }
        });
  }

  public async addAuthorizedUrl (idStr: string, origin: string, url: string, authorizedAccounts: string[]) {
    const urlOrigin = new URL(url).origin;

    await Promise.all([
      localStorageStores.authUrls.update((currentContent) => ({
        ...currentContent,
        [urlOrigin]: {
          authorizedAccounts,
          count: 0,
          id: idStr,
          lastAuth: Date.now(),
          origin,
          url: urlOrigin
        }
      })),
      this.updateDefaultAuthAccounts(authorizedAccounts)
    ]);
  }

  public async updateCurrentTabsUrl (urls: string[]) {
    const authUrls = await this.getAuthUrls();

    const connectedTabs = urls.map((url) => {
      let strippedUrl = '';

      // the assert in stripUrl may throw for new tabs with "chrome://newtab/"
      try {
        strippedUrl = new URL(url).origin;
      } catch (e) {
        console.error(e);
      }

      // return the stripped url only if this website is known
      return !!strippedUrl && authUrls[strippedUrl]
        ? strippedUrl
        : undefined;
    })
      .filter((value) => !!value) as string[];

    this.#connectedTabsUrl = connectedTabs;
  }

  public getConnectedTabsUrl () {
    return this.#connectedTabsUrl;
  }

  public async removeAuthRequest (id: string) {
    await localStorageStores.authRequests.update((authRequests) => {
      const requestToRemoveIndex = authRequests.findIndex((authRequest) => authRequest.id === id);

      if (requestToRemoveIndex < 0) {
        return authRequests;
      }

      return [...authRequests.slice(0, requestToRemoveIndex), ...authRequests.slice(requestToRemoveIndex + 1)];
    });

    await this.updateIconAuth();
  }

  public async updateDefaultAuthAccounts (newList: string[]) {
    await localStorageStores.defaultAuthAccounts.set(newList);
  }

  private async updateIcon (): Promise<void> {
    const [
      authCount,
      metaCount,
      signCount
    ] = await Promise.all([
      this.getAuthRequestsNumber(),
      this.getMetadataRequestsNumber(),
      this.getSignRequestsNumber()
    ]);

    const text = (
      authCount
        ? 'Auth'
        : metaCount
          ? 'Meta'
          : (signCount ? `${signCount}` : '')
    );

    withErrorLog(() => chrome.action.setBadgeText({ text }));
  }

  public removeAuthorization (url: string): Promise<AuthUrls> {
    return localStorageStores.authUrls.update(({ [url]: entryToRemove, ...otherAuthUrls }) => {
      assert(entryToRemove, `The source ${url} is not known`);

      return otherAuthUrls;
    });
  }

  private async updateIconAuth (): Promise<void> {
    await this.updateIcon();
  }

  private async updateIconMeta (): Promise<void> {
    await this.updateIcon();
  }

  private async updateIconSign (): Promise<void> {
    await this.updateIcon();
  }

  public async updateAuthorizedAccounts (authorizedAccountDiff: AuthorizedAccountsDiff): Promise<void> {
    await localStorageStores.authUrls.update((currentContent) => {
      const updatedAuthUrls = Object.fromEntries(Object.entries(authorizedAccountDiff).map(([url, newAuthorizedAccounts]) => {
        const origin = new URL(url).origin;

        return [
          origin,
          {
            ...currentContent[origin],
            authorizedAccounts: newAuthorizedAccounts,
            lastAuth: Date.now()
          }
        ];
      }));

      return {
        ...currentContent,
        ...updatedAuthUrls
      };
    });
  }

  public async updateAuthorizedDate (url: string): Promise<void> {
    const { origin } = new URL(url);

    await localStorageStores.authUrls.update((currentContent) => ({
      ...currentContent,
      [origin]: {
        ...currentContent[origin],
        lastAuth: Date.now()
      }
    }));
  }

  public async authorizeUrl (url: string, messageId: string, payload: AuthorizeTabRequestPayload, respond: (response: unknown) => void): Promise<void> {
    const idStr = new URL(url).origin;

    // Do not enqueue duplicate authorization requests.
    const isDuplicate = (await localStorageStores.authRequests.get())
      .some((request) => request.idStr === idStr);

    assert(!isDuplicate, `The source ${url} has a pending authorization request`);

    const authUrls = await this.getAuthUrls();

    if (authUrls[idStr]) {
      assert(authUrls[idStr].authorizedAccounts || authUrls[idStr].isAllowed, `The source ${url} is not allowed to interact with this extension`);

      return respond({
        authorizedAccounts: [],
        result: false
      });
    }

    await localStorageStores.authRequests.update((authRequests) => [
      ...authRequests,
      {
        id: messageId,
        idStr,
        payload,
        url
      }
    ]);

    await this.updateIconAuth();
    await this.popupOpen();
  }

  public async ensureUrlAuthorized (url: string): Promise<boolean> {
    const entry = (await this.getAuthUrls())[new URL(url).origin];

    assert(entry, `The source ${url} has not been enabled yet`);

    return true;
  }

  public async injectMetadata (url: string, { types, ...restPayload }: MetadataDef, messageId: string): Promise<void> {
    type TypesType = ReturnType<Parameters<typeof localStorageStores.chainMetadata.update>[0]>[string]['types']

    await localStorageStores.metadataRequests.update((signRequests) => [
      ...signRequests,
      {
        id: messageId,
        payload: {
          ...restPayload,
          // Type assertion, because "MetadataDef.types" can contain the CodecClass which should not appear here (and is not serializable anyway, so no use of it in local storage)
          types: types as TypesType
        },
        url
      }
    ]);

    await this.updateIconMeta();
    await this.popupOpen();
  }

  public async getAuthRequest (id: string): Promise<AuthRequest | undefined> {
    return (await localStorageStores.authRequests.get()).find((authRequest) => authRequest.id === id);
  }

  public async getMetaRequest (id: string): Promise<MetadataRequest | undefined> {
    return (await localStorageStores.metadataRequests.get()).find((metadataRequest) => metadataRequest.id === id);
  }

  public async getSignRequest (id: string): Promise<SignRequest | undefined> {
    return (await localStorageStores.signRequests.get()).find((signRequest) => signRequest.id === id);
  }

  public async removeSignRequest (id: string): Promise<void> {
    await localStorageStores.signRequests.update((signRequests) => {
      const requestToRemoveIndex = signRequests.findIndex((signRequest) => signRequest.id === id);

      if (requestToRemoveIndex < 0) {
        return signRequests;
      }

      return [...signRequests.slice(0, requestToRemoveIndex), ...signRequests.slice(requestToRemoveIndex + 1)];
    });

    await this.updateIconSign();
  }

  public async removeMetadataRequest (id: string): Promise<void> {
    await localStorageStores.metadataRequests.update((metadataRequests) => {
      const requestToRemoveIndex = metadataRequests.findIndex((metadataRequest) => metadataRequest.id === id);

      if (requestToRemoveIndex < 0) {
        return metadataRequests;
      }

      return [...metadataRequests.slice(0, requestToRemoveIndex), ...metadataRequests.slice(requestToRemoveIndex + 1)];
    });

    await this.updateIconMeta();
  }

  // List all providers the extension is exposing
  public rpcListProviders (): Promise<ResponseRpcListProviders> {
    return Promise.resolve(Object.keys(this.#providers).reduce((acc, key) => {
      acc[key] = this.#providers[key].meta;

      return acc;
    }, {} as ResponseRpcListProviders));
  }

  public rpcSend (request: RequestRpcSend, port: chrome.runtime.Port): Promise<JsonRpcResponse> {
    const provider = this.#injectedProviders.get(port);

    assert(provider, 'Cannot call pub(rpc.subscribe) before provider is set');

    return provider.send(request.method, request.params);
  }

  // Start a provider, return its meta
  public rpcStartProvider (key: string, port: chrome.runtime.Port): Promise<ProviderMeta> {
    assert(Object.keys(this.#providers).includes(key), `Provider ${key} is not exposed by extension`);

    if (this.#injectedProviders.get(port)) {
      return Promise.resolve(this.#providers[key].meta);
    }

    // Instantiate the provider
    this.#injectedProviders.set(port, this.#providers[key].start());

    // Close provider connection when page is closed
    port.onDisconnect.addListener((): void => {
      const provider = this.#injectedProviders.get(port);

      if (provider) {
        withErrorLog(() => provider.disconnect());
      }

      this.#injectedProviders.delete(port);
    });

    return Promise.resolve(this.#providers[key].meta);
  }

  public rpcSubscribe ({ method, params, type }: RequestRpcSubscribe, cb: ProviderInterfaceCallback, port: chrome.runtime.Port): Promise<number | string> {
    const provider = this.#injectedProviders.get(port);

    assert(provider, 'Cannot call pub(rpc.subscribe) before provider is set');

    return provider.subscribe(type, method, params, cb);
  }

  public rpcSubscribeConnected (_request: null, cb: ProviderInterfaceCallback, port: chrome.runtime.Port): void {
    const provider = this.#injectedProviders.get(port);

    assert(provider, 'Cannot call pub(rpc.subscribeConnected) before provider is set');

    cb(null, provider.isConnected); // Immediately send back current isConnected
    provider.on('connected', () => cb(null, true));
    provider.on('disconnected', () => cb(null, false));
  }

  public rpcUnsubscribe (request: RequestRpcUnsubscribe, port: chrome.runtime.Port): Promise<boolean> {
    const provider = this.#injectedProviders.get(port);

    assert(provider, 'Cannot call pub(rpc.unsubscribe) before provider is set');

    return provider.unsubscribe(request.type, request.method, request.subscriptionId);
  }

  public async saveMetadata ({ types, ...restMeta }: MetadataDef): Promise<void> {
    type TypesType = ReturnType<Parameters<typeof localStorageStores.chainMetadata.update>[0]>[string]['types']

    await localStorageStores.chainMetadata.update((currentContent) => ({
      ...currentContent,
      [restMeta.genesisHash]: {
        ...restMeta,
        // Type assertion, because "MetadataDef.types" can contain the CodecClass which should not appear here (and is not serializable anyway, so no use of it in local storage)
        types: types as TypesType
      }
    }));
  }

  public setNotification (notification: string): boolean {
    this.#notification = notification;

    return true;
  }

  public async invokeSignatureRequest (
    url: string,
    payload: SignerPayloadRawWithType | SignerPayloadJSONWithType,
    account: AccountJson,
    messageId: string
  ): Promise<void> {
    await localStorageStores.signRequests.update((signRequests) => [
      ...signRequests,
      {
        account,
        id: messageId,
        payload,
        url
      }
    ]);

    await this.updateIconSign();
    await this.popupOpen();
  }
}
