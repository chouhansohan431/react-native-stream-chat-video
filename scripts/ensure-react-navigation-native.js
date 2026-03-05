const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const nativeModuleDir = path.join(
  rootDir,
  'node_modules',
  '@react-navigation',
  'native',
  'lib',
  'module',
);
const nativeTypesDir = path.join(
  rootDir,
  'node_modules',
  '@react-navigation',
  'native',
  'lib',
  'typescript',
  'src',
);

const moduleIndexPath = path.join(nativeModuleDir, 'index.js');
const hookModulePath = path.join(nativeModuleDir, 'useScrollToTop.js');
const hookTypesPath = path.join(nativeTypesDir, 'useScrollToTop.d.ts');

const hookExportLine = 'export { useScrollToTop } from "./useScrollToTop.js";';

function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function ensureHookModule() {
  if (!fileExists(moduleIndexPath) || fileExists(hookModulePath)) {
    return;
  }

  const indexContent = fs.readFileSync(moduleIndexPath, 'utf8');
  if (!indexContent.includes(hookExportLine)) {
    return;
  }

  const shim = `"use strict";

import * as React from "react";

export function useScrollToTop() {
  // Fallback shim for broken package installs that miss this file.
  React.useEffect(() => {}, []);
}
`;

  fs.writeFileSync(hookModulePath, shim, 'utf8');
  console.log(
    '[postinstall] Restored @react-navigation/native/lib/module/useScrollToTop.js shim',
  );
}

function ensureHookTypes() {
  if (!fileExists(hookTypesPath)) {
    const typesShim =
      '/// <reference types="react" />\nexport declare function useScrollToTop(ref: React.RefObject<unknown>): void;\n';
    fs.mkdirSync(nativeTypesDir, { recursive: true });
    fs.writeFileSync(hookTypesPath, typesShim, 'utf8');
  }
}

ensureHookModule();
ensureHookTypes();
