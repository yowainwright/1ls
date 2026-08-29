import { Generator, getConfig } from "@tanstack/router-generator";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const routeConfig = getConfig({ target: "react", autoCodeSplitting: true }, appRoot);
const generator = new Generator({ config: routeConfig, root: appRoot });

await generator.run();
