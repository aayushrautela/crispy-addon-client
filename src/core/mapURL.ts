import { getProtocol, isLocalHostname, toURL } from "./url";

export function mapURL(inputUrl: string): string {
  const protocol = getProtocol(inputUrl);

  if (protocol === "ipfs:" || protocol === "ipns:") {
    return inputUrl;
  }

  const parsedUrl = toURL(inputUrl);

  if (isLocalHostname(parsedUrl.hostname)) {
    if (parsedUrl.hostname === "localhost") {
      parsedUrl.hostname = "127.0.0.1";
    }

    return parsedUrl.toString();
  }

  if (parsedUrl.protocol === "http:") {
    parsedUrl.protocol = "https:";
  }

  return parsedUrl.toString();
}
