import { detectFromURL } from "crispy-addon-client";

async function run(): Promise<void> {
  const detected = await detectFromURL("https://v3-cinemeta.strem.io/manifest.json");

  if (!detected.addon) {
    throw new Error("No addon detected");
  }

  const response = await detected.addon.get("catalog", "movie", "top", {
    skip: 0,
  });

  console.log(response);
}

void run();
