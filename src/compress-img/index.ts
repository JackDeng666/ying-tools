import fs from 'fs'
import path from 'path'
import inquirer from 'inquirer'
import type { QuestionCollection } from 'inquirer'
import chalk from 'chalk'
import sharp from 'sharp'
import spinner from '@/ora'

const imgExts = ['.png', '.jpg', '.jpeg']

export async function compressImage(_imagesDir: string) {
  let imagesDir = _imagesDir
  let quality = 75
  const res = await selectDirAndQuality(imagesDir)
  imagesDir = res.dirname
  quality = res.quality

  spinner.start(chalk.blue('读取图片中...'))
  let outPutFileDir = res.compressDir

  try {
    const imageFiles = getImageFiles(imagesDir)
    const total = imageFiles.length
    let current = 0
    spinner.succeed(chalk.green('读取图片完成。'))
    spinner.start(chalk.blueBright('压缩图片中...'))

    imageFiles.forEach(async file => {
      const outPutFile = file.replace(imagesDir, outPutFileDir)
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

function selectDirAndQuality(dirname: string) {
  const questionList: QuestionCollection[] = [
    {
      type: 'input',
      name: 'compressDir',
      message: '请输入压缩后的文件的存放位置',
      default: pre => `${pre.dirname || dirname}_compress`,
    },
    {
      type: 'number',
      name: 'quality',
      message: '请输入压缩质量[0~99]',
      default: 75,
    },
  ]

  if (!dirname) {
    const dirs = fs.readdirSync('.')

    questionList.unshift({
      type: 'list',
      name: 'dirname',
      message: '请选择源文件的文件夹',
      choices: dirs.map(name => ({
        name,
        value: name,
      })),
    })
  }

  return inquirer.prompt(questionList)
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
