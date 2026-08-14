import fs from 'node:fs'
import path from 'node:path'
import { select, input, number } from '@inquirer/prompts'
import chalk from 'chalk'
import sharp from 'sharp'
import spinner from '@/ora'

const imgExts = ['.png', '.jpg', '.jpeg']

export async function compressImage(_imagesDir: string) {
  const { dirname, compressedDirname, quality } = await selectDirAndQuality(_imagesDir)

  spinner.start(chalk.blue('读取图片中...'))
  try {
    const imageFiles = getImageFiles(dirname)
    const total = imageFiles.length
    let current = 0
    spinner.succeed(chalk.green('读取图片完成。'))
    spinner.start(chalk.blueBright('压缩图片中...'))

    imageFiles.forEach(async file => {
      const outPutFile = file.replace(dirname, compressedDirname)
      checkDirExistAndCreate(outPutFile)

      let sharpInstance = sharp(file, { limitInputPixels: false })
      const { format } = await sharpInstance.metadata()

      sharpInstance
        .toFormat(format, { quality })
        .toFile(outPutFile)
        .then(() => {
          console.log(chalk.yellow(`[${outPutFile}]`), chalk.green('压缩完成。'))
        })
        .catch(err => {
          console.log(chalk.yellow(`[${outPutFile}]`, chalk.red('压缩失败！' + err)))
        })
        .finally(() => {
          current++
          if (current >= total) {
            spinner.succeed(chalk.green('图片已全部压缩完成！'))
          }
        })
    })
  } catch (error) {
    spinner.fail(chalk.red(error))
  }
}

async function selectDirAndQuality(defaultDirname?: string) {
  let dirname = defaultDirname
  if (!dirname) {
    const dirs = fs.readdirSync('.')
    dirname = await select({
      message: '请选择源文件的文件夹',
      choices: dirs.map(dir => ({
        name: dir,
        value: dir,
      })),
    })
  }
  const compressedDirname = await input({ message: '请输入压缩后的文件的存放位置', default: `${dirname}_compressed` })
  const quality = await number({ message: '请输入压缩质量[0~99]', default: 75 })

  return {
    dirname,
    compressedDirname,
    quality,
  }
}

function getImageFiles(path: string): string[] {
  const files = fs.readdirSync(path)
  const imageFiles = []
  files.forEach(file => {
    const filePath = path + '/' + file

    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      const imgs = getImageFiles(filePath)
      imageFiles.push(...imgs)
      return
    }

    if (imgExts.some(ext => filePath.endsWith(ext))) {
      imageFiles.push(filePath)
    }
  })
  return imageFiles
}

function checkDirExistAndCreate(filePath: string) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    checkDirExistAndCreate(dir)
    fs.mkdirSync(dir)
  }
}
