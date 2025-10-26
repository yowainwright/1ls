export default {
  name: "TypeScript Config",
  version: "3.0.0",
  compilerOptions: {
    target: "ES2020",
    module: "ESNext",
    strict: true,
    esModuleInterop: true
  },
  include: ["src/**/*"],
  exclude: ["node_modules", "dist"]
};
