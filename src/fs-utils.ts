import { existsSync } from 'node:fs'
import { readdir, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

export async function readCurrentFolder() {
  const dirs = await readdir('.', { withFileTypes: true })
  return dirs.filter(item => item.isDirectory() && !item.name.startsWith('.')).map(item => item.name)
}

export async function checkDirExistAndCreate(filePath: string) {
  const dir = dirname(filePath)
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
}

export function createGetFiles(checkFileFn: (filePath: string) => boolean) {
  return async function getFiles(path: string) {
    const currentFiles = await readdir(path, { withFileTypes: true })
    const finalFiles: string[] = []
    await Promise.all(
      currentFiles.map(async file => {
        const filePath = path + '/' + file.name
        if (file.isDirectory()) {
          const files = await getFiles(filePath)
          finalFiles.push(...files)
          return
        }
        if (checkFileFn(filePath)) {
          finalFiles.push(filePath)
        }
      }),
    )
    return finalFiles
  }
}
