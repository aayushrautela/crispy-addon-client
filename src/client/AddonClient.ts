import { deepFreeze } from "../core/deepFreeze";
import { ERR_UNSUPPORTED_ARGS, createError, toAddonClientError } from "../core/errors";
import { isRecord } from "../core/guards";
import { isSupported } from "../core/isSupported";
import type {
  AddonClientFlags,
  AddonDescriptor,
  AddonGetCallback,
  AddonManifest,
  AddonRequestExtra,
  AddonRequestTuple,
  AddonTransport,
  TransportCacheMetadata,
} from "../core/types";

function toRequestTuple(
  resource: string,
  type: string,
  id: string,
  extra?: AddonRequestExtra,
): AddonRequestTuple {
  if (extra && Object.keys(extra).length > 0) {
    return [resource, type, id, extra] as const;
  }

  return [resource, type, id] as const;
}

export class AddonClient {
  readonly manifest: AddonManifest;
  readonly transportUrl: string;
  readonly flags: AddonClientFlags;

  private readonly transport: AddonTransport;

  constructor(manifest: AddonManifest, transport: AddonTransport, flags: AddonClientFlags = {}) {
    this.transport = transport;
    this.manifest = deepFreeze({ ...manifest });
    this.transportUrl = transport.url;
    this.flags = deepFreeze({ ...flags });

    Object.freeze(this);
  }

  isSupported(resource: string, type: string, id: string): boolean {
    return isSupported(this.manifest, resource, type, id);
  }

  async get<T = unknown>(resource: string, type: string, id: string): Promise<T>;
  async get<T = unknown>(
    resource: string,
    type: string,
    id: string,
    extra: AddonRequestExtra,
  ): Promise<T>;
  async get<T = unknown>(
    resource: string,
    type: string,
    id: string,
    callback: AddonGetCallback<T>,
  ): Promise<T>;
  async get<T = unknown>(
    resource: string,
    type: string,
    id: string,
    extra: AddonRequestExtra,
    callback: AddonGetCallback<T>,
  ): Promise<T>;
  async get<T = unknown>(
    resource: string,
    type: string,
    id: string,
    extraOrCallback?: AddonRequestExtra | AddonGetCallback<T>,
    maybeCallback?: AddonGetCallback<T>,
  ): Promise<T> {
    if (!resource || !type || !id) {
      throw createError(ERR_UNSUPPORTED_ARGS, {
        details: { resource, type, id },
      });
    }

    const extra = isRecord(extraOrCallback) ? (extraOrCallback as AddonRequestExtra) : undefined;
    const callback =
      typeof extraOrCallback === "function"
        ? extraOrCallback
        : typeof maybeCallback === "function"
          ? maybeCallback
          : undefined;

    const requestArgs = toRequestTuple(resource, type, id, extra);

    const promise = this.transport.get(requestArgs).catch((error: unknown) => {
      throw toAddonClientError(error);
    });

    if (!callback) {
      return promise.then((response) => response.data as T);
    }

    return promise
      .then((response) => {
        const data = response.data as T;
        callback(null, data, response.cache);
        return data;
      })
      .catch((error: unknown) => {
        const normalizedError = toAddonClientError(error);
        callback(normalizedError);
        throw normalizedError;
      });
  }

  async getWithMeta<T = unknown>(
    resource: string,
    type: string,
    id: string,
    extra?: AddonRequestExtra,
  ): Promise<{ data: T; cache: TransportCacheMetadata }> {
    const requestArgs = toRequestTuple(resource, type, id, extra);

    try {
      const response = await this.transport.get(requestArgs);
      return {
        data: response.data as T,
        cache: response.cache,
      };
    } catch (error) {
      throw toAddonClientError(error);
    }
  }

  async destroy(): Promise<void> {
    if (!this.transport.destroy) {
      return;
    }

    await this.transport.destroy();
  }

  toDescriptor(): AddonDescriptor {
    return {
      manifest: this.manifest,
      transportUrl: this.transportUrl,
      flags: this.flags,
    };
  }
}

export default AddonClient;
