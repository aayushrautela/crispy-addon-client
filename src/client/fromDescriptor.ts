import { ERR_NO_TRANSPORT, createError } from "../core/errors";
import { assertAddonManifest } from "../core/manifest";
import type { AddonDescriptor, AddonTransportConstructor, FromDescriptorOptions } from "../core/types";
import { HttpTransport } from "../transports/http";
import { IpfsShimTransport } from "../transports/ipfsShim";
import { LegacyTransport } from "../transports/legacy";
import { AddonClient } from "./AddonClient";

const TRANSPORTS: readonly AddonTransportConstructor[] = [
  IpfsShimTransport,
  LegacyTransport,
  HttpTransport,
];

export async function fromDescriptor(
  descriptor: AddonDescriptor,
  options: FromDescriptorOptions = {},
): Promise<AddonClient> {
  const transportUrl = descriptor.transportUrl;
  const Transport = TRANSPORTS.find((transport) => transport.isValidURL(transportUrl));

  if (!Transport) {
    throw createError(ERR_NO_TRANSPORT, {
      details: { transportUrl: descriptor.transportUrl },
    });
  }

  const transport = new Transport(transportUrl, options);
  const manifest = assertAddonManifest(descriptor.manifest, descriptor.transportUrl);

  return new AddonClient(manifest, transport, descriptor.flags ?? {});
}

export default fromDescriptor;
