/// <reference types="vite/client" />

declare module "*.mdx" {
  import type { ComponentType } from "react";

  const MDXContent: ComponentType;
  export default MDXContent;
}
