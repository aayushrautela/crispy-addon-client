import { fromDescriptor } from "../client/fromDescriptor";
import { ERR_MANIFEST_INVALID, createError } from "../core/errors";
import type { AddonDescriptor, FromDescriptorOptions } from "../core/types";
import { AddonClient } from "../client/AddonClient";

function assertAddonClient(addon: AddonClient): void {
  if (!(addon instanceof AddonClient)) {
    throw createError(ERR_MANIFEST_INVALID, {
      message: "AddonCollection only accepts AddonClient instances",
      details: { addon },
    });
  }
}

export class AddonCollection {
  private addons: AddonClient[];

  constructor(addons: readonly AddonClient[] = []) {
    this.addons = [...addons];
  }

  getAddons(): AddonClient[] {
    return [...this.addons];
  }

  async load(descriptors: readonly AddonDescriptor[], options: FromDescriptorOptions = {}): Promise<void> {
    this.addons = await Promise.all(descriptors.map((descriptor) => fromDescriptor(descriptor, options)));
  }

  save(): AddonDescriptor[] {
    return this.addons.map((addon) => addon.toDescriptor());
  }

  includes(addon: AddonClient): boolean {
    assertAddonClient(addon);
    return this.addons.some((entry) => entry.transportUrl === addon.transportUrl);
  }

  add(addon: AddonClient): void {
    assertAddonClient(addon);

    if (!this.includes(addon)) {
      this.addons.push(addon);
    }
  }

  remove(addon: AddonClient): void {
    assertAddonClient(addon);
    this.addons = this.addons.filter((entry) => entry.transportUrl !== addon.transportUrl);
  }

  clone(): AddonCollection {
    return new AddonCollection([...this.addons]);
  }
}

export default AddonCollection;
