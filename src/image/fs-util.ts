import { readdirSync, statSync, existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export function readCurrentFolder() {
  const dirs = readdirSync('.', { withFileTypes: true })
  return dirs.filter(item => item.isDirectory() && !item.name.startsWith('.')).map(item => item.name)
}

export function createGetImageFiles(checkFileFn: (filePath: string) => boolean) {
  return function getImageFiles(path: string): string[] {
    const files = readdirSync(path)
    const imageFiles = []
    files.forEach(file => {
      const filePath = path + '/' + file
      const stat = statSync(filePath)
      if (stat.isDirectory()) {
        const imgs = getImageFiles(filePath)
        imageFiles.push(...imgs)
        return
      }
      if (checkFileFn(filePath)) {
        imageFiles.push(filePath)
      }
    })
    return imageFiles
  }
}

export function checkDirExistAndCreate(filePath: string) {
  const dir = dirname(filePath)
  if (!existsSync(dir)) {
    checkDirExistAndCreate(dir)
    mkdirSync(dir)
  }
}
