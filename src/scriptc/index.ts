#!/usr/bin/env node

import { main } from "../cli/index.ts";

await main(process.argv.slice(2));
