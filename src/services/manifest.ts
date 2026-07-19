import { openDB } from "idb";
import { bungieGet } from "./bungieApi";
import type { ManifestResponse } from "../types/bungie.types";

export async function openManifestDb() {
  return openDB("d2-manifest", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("manifest")) {
        db.createObjectStore("manifest");
      }
    },
  });
}

export async function getManifest() {
  const manifestMeta = await bungieGet<ManifestResponse>(`/Destiny2/Manifest/`);

  const storeDatabase = await openManifestDb();
  const currentManifestVersion = manifestMeta.Response.version;

  const cachedVersion = await storeDatabase.get("manifest", "version");
  if (cachedVersion === currentManifestVersion) {
    const cachedData = await storeDatabase.get("manifest", "data");
    const titleData = await storeDatabase.get("manifest", "title");
    return { data: cachedData, titleData, currentManifestVersion };
  }

  const itemPath =
    manifestMeta.Response.jsonWorldComponentContentPaths["en"][
      "DestinyInventoryItemDefinition"
    ];
  const downloadUrl = "https://www.bungie.net" + itemPath;

  const titlePath =
    manifestMeta.Response.jsonWorldComponentContentPaths["en"][
      "DestinyRecordDefinition"
    ];
  const titleUrl = "https://www.bungie.net" + titlePath;

  const [itemResponse, titleResponse] = await Promise.all([
    fetch(downloadUrl),
    fetch(titleUrl),
  ]);

  const itemData = await itemResponse.json();
  const titleData = await titleResponse.json();

  await storeDatabase.put("manifest", itemData, "data");
  await storeDatabase.put("manifest", currentManifestVersion, "version");
  await storeDatabase.put("manifest", titleData, "title");

  return { data: itemData, titleData, currentManifestVersion };
}
