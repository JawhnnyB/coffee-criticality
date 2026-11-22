/**
 * Cabinet and desk tests bundle TypeScript with the esbuild devDependency
 * (the same 0.28 line Vite asks for). ESBUILD_PKG can point at another copy.
 */
import { pathToFileURL } from "node:url";

export async function loadEsbuild() {
  if (process.env.ESBUILD_PKG) return import(pathToFileURL(process.env.ESBUILD_PKG).href);
  return import("esbuild");
}
