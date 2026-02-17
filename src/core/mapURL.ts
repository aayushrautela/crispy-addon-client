import { getProtocol, isLocalHostname, toURL } from "./url";

export function mapURL(inputUrl: string): string {
  const protocol = getProtocol(inputUrl);

  if (protocol === "ipfs:" || protocol === "ipns:") {
    return inputUrl;
  }

  const normalizedInputUrl =
    protocol === "stremio:" || protocol === "crispy:"
      ? inputUrl.replace(/^(stremio|crispy):/i, "https:")
      : inputUrl;

  const parsedUrl = toURL(normalizedInputUrl);

  if (isLocalHostname(parsedUrl.hostname)) {
    if (parsedUrl.hostname === "localhost") {
      parsedUrl.hostname = "127.0.0.1";
    }

    return parsedUrl.toString();
  }

  return parsedUrl.toString();
}
