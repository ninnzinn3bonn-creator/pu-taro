import { rm } from "node:fs/promises";
import { resolve } from "node:path";

await rm(resolve("dist/data/source_snapshot.local.json"), { force: true });
console.log(
  "Excluded local Auto House snapshot from dist. Set AX_FACTORY_INCLUDE_LOCAL_SNAPSHOT=1 to include it."
);
