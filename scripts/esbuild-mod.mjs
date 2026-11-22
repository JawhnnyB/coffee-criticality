/**
 * Cabinet and desk tests bundle TypeScript. This repo does not depend on
 * esbuild, so a bare import("esbuild") fails here. ESBUILD_PKG wins, then a
 * normal install, then the copy that ships with the Vercel CLI.
 */
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

const FALLBACK = "/usr/lib/node_modules/vercel/node_modules/esbuild/lib/main.js";

export async function loadEsbuild() {
  if (process.env.ESBUILD_PKG) return import(pathToFileURL(process.env.ESBUILD_PKG).href);
  try {
    return await import("esbuild");
  } catch (err) {
    if (existsSync(FALLBACK)) return import(pathToFileURL(FALLBACK).href);
    throw err;
  }
}
