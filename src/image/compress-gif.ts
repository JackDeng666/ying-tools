import { select, input, number } from '@inquirer/prompts'
import chalk from 'chalk'
import sharp from 'sharp'
import ora from 'ora'

import { readCurrentFolder, createGetImageFiles, checkDirExistAndCreate } from './fs-util'

const getGifFiles = createGetImageFiles(filePath => filePath.endsWith('.gif'))

async function selectConfig(defaultDirname?: string) {
  let dirname = defaultDirname
  if (!dirname) {
    const dirs = readCurrentFolder()
    dirname = await select({
      message: '请选择目标文件夹',
      choices: dirs.map(dir => ({
        name: dir,
        value: dir,
      })),
    })
  }
  const compressedDirname = await input({ message: '请输入压缩后的图片存放位置', default: `${dirname}_compressed` })

  const colors = await number({ message: '请输入colors[0~256]', default: 64 })
  const interFrameMaxError = await number({ message: '请输入interFrameMaxError[0~32]', default: 8 })
  const dither = Number(await input({ message: '请输入dither[0~1]', default: '0.5' }))

  return {
    dirname,
    compressedDirname,
    colors,
    interFrameMaxError,
    dither,
  }
}

export async function compressGif(defaultDir: string) {
  const { dirname, compressedDirname, colors, interFrameMaxError, dither } = await selectConfig(defaultDir)

  const spinner = ora()
  try {
    spinner.start(chalk.blue('读取图片中...'))
    const imageFiles = getGifFiles(dirname)
    const total = imageFiles.length
    let current = 0
    spinner.succeed(chalk.green('读取图片完成。'))
    spinner.start(chalk.blueBright('压缩图片中...'))

    imageFiles.forEach(async file => {
      // console.log(chalk.blueBright('正在压缩图片'), chalk.yellow(`[${file}]`))
      const outPutFile = file.replace(dirname, compressedDirname)
      checkDirExistAndCreate(outPutFile)
      sharp(file, { limitInputPixels: false, animated: true })
        .gif({ colors, interFrameMaxError, dither })
        .toFile(outPutFile)
        .then(() => {
          console.log(chalk.yellow(`[${outPutFile}]`), chalk.green('压缩完成。'))
        })
        .catch(err => {
          console.log(chalk.yellow(`[${outPutFile}]`) + chalk.red('压缩失败！' + err))
        })
        .finally(() => {
          current++
          if (current >= total) {
            spinner.info('操作已结束！')
          }
        })
    })
  } catch (error) {
    spinner.fail(chalk.red(error))
  }
}
