import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface Package {
  name: string;
  version: string;
  description: string;
  author: string;
}

export function getPackageJsonObject(): Package {
  const data = readFileSync(join(__dirname, '../package.json'));
  return JSON.parse(data.toString());
}

export function getRegistriesJsonObject() {
  const data = readFileSync(join(__dirname, '../registries.json'));
  return JSON.parse(data.toString());
}

export function setRegistriesJson(str: string) {
  writeFileSync(join(__dirname, '../registries.json'), str);
}
