import { generateBashCompletions, generateZshCompletions } from "../src/completions/index";
import { writeFileSync } from "fs";
import { join } from "path";

const dir = join(import.meta.dir, "../src/completions");

writeFileSync(join(dir, "1ls.bash"), generateBashCompletions());
writeFileSync(join(dir, "1ls.zsh"), generateZshCompletions());

console.log("Generated src/completions/1ls.bash");
console.log("Generated src/completions/1ls.zsh");
