import type { AddonRequestTuple, AddonTransport, TransportOptions, TransportResponse } from "../core/types";
import { HttpTransport } from "./http";

export const DEFAULT_IPFS_GATEWAY_ROOT = "https://gateway.ipfs.io";

function normalizeGatewayRoot(gatewayRoot: string): string {
  const withoutProtocolSuffix = gatewayRoot
    .replace(/\/$/, "")
    .replace(/\/ipfs$/i, "")
    .replace(/\/ipns$/i, "");

  return withoutProtocolSuffix;
}

function mapIpfsUrlToGateway(url: string, gatewayRoot: string): string {
  const root = normalizeGatewayRoot(gatewayRoot);

  if (url.startsWith("ipfs://")) {
    return `${root}/ipfs/${url.slice("ipfs://".length)}`;
  }

  return `${root}/ipns/${url.slice("ipns://".length)}`;
}

export class IpfsShimTransport implements AddonTransport {
  readonly url: string;

  private readonly httpTransport: HttpTransport;

  constructor(url: string, options: TransportOptions = {}) {
    this.url = url;
    const gatewayRoot = options.ipfsGateway ?? DEFAULT_IPFS_GATEWAY_ROOT;
    this.httpTransport = new HttpTransport(mapIpfsUrlToGateway(url, gatewayRoot), options);
  }

  static isValidURL(url: string): boolean {
    return url.startsWith("ipfs://") || url.startsWith("ipns://");
  }

  manifest(): Promise<TransportResponse<import("../core/types").AddonManifest>> {
    return this.httpTransport.manifest();
  }

  get(args: AddonRequestTuple): Promise<TransportResponse<unknown>> {
    return this.httpTransport.get(args);
  }

  async destroy(): Promise<void> {
    return Promise.resolve();
  }
}
