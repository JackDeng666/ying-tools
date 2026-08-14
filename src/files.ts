import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

interface Package {
  name: string
  version: string
  description: string
  author: string
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export function getPackageJsonObject(): Package {
  const data = readFileSync(join(__dirname, '../package.json'))
  return JSON.parse(data.toString())
}

export function getRegistriesJsonObject() {
  const data = readFileSync(join(__dirname, '../registries.json'))
  return JSON.parse(data.toString())
}

export function setRegistriesJson(str: string) {
  writeFileSync(join(__dirname, '../registries.json'), str)
}
