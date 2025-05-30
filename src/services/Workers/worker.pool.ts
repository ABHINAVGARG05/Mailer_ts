import Piscina from "piscina";
import path from "path";

export const templateParserPool = new Piscina({
  filename: path.resolve(__dirname, "./template.parser.worker.ts"),
  maxThreads: 4,
});
