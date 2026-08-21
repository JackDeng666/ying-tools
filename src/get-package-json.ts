import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

interface Package {
  name: string
  version: string
  description: string
  author: string
}

export function getPackageJson(): Package {
  const data = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../package.json'))
  return JSON.parse(data.toString())
}
