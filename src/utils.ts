import axios from 'axios'
import type { PathLike } from 'fs'
import { existsSync, statSync, readdirSync, unlinkSync, rmdirSync, mkdirSync, copyFileSync } from 'fs'
import { resolve } from 'path'

/**
 *
 * @param {*} path 必传参数可以是文件夹可以是文件
 * @param {*} reservePath 保存path目录 path值与reservePath值一样就保存
 */
export function delFile(path: PathLike, reservePath?: PathLike) {
  if (existsSync(path)) {
    if (statSync(path).isDirectory()) {
      let files = readdirSync(path)
      files.forEach((file, index) => {
        let currentPath = path + '/' + file
        if (statSync(currentPath).isDirectory()) {
          delFile(currentPath, reservePath)
        } else {
          unlinkSync(currentPath)
        }
      })
      if (path != reservePath) {
        rmdirSync(path)
      }
    } else {
      unlinkSync(path)
    }
  }
}

const isExist = (path: PathLike) => {
  if (!existsSync(path)) {
    mkdirSync(path)
  }
}

export const copyFile = (sourcePath: string, targetPath: string) => {
  isExist(targetPath)
  const sourceFile = readdirSync(sourcePath, { withFileTypes: true })

  sourceFile.forEach(file => {
    const newSourcePath = resolve(sourcePath, file.name)
    const newTargetPath = resolve(targetPath, file.name)
    if (file.isDirectory()) {
      isExist(newTargetPath)
      copyFile(newSourcePath, newTargetPath)
    } else {
      copyFileSync(newSourcePath, newTargetPath)
    }
  })
}

export function pingUrl(url: string) {
  return new Promise(async function (resolve, reject) {
    const start = Date.now()
    try {
      await axios.get(url)
      resolve(Date.now() - start)
    } catch (error) {
      reject(error)
    }
  })
}
