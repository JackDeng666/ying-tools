import { select, input, number } from '@inquirer/prompts'
import chalk from 'chalk'
import sharp from 'sharp'
import ora from 'ora'
import { readCurrentFolder, createGetImageFiles, checkDirExistAndCreate } from './fs-util'

const normalImageExts = ['.png', '.jpg', '.jpeg']
const getNormalImageFiles = createGetImageFiles(filePath => normalImageExts.some(ext => filePath.endsWith(ext)))

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
  const quality = await number({ message: '请输入压缩质量[0~99]', default: 75 })

  return {
    dirname,
    compressedDirname,
    quality,
  }
}

export async function compressNormal(defaultDir: string) {
  const { dirname, compressedDirname, quality } = await selectConfig(defaultDir)
  const spinner = ora()
  try {
    spinner.start(chalk.blue('读取图片中...'))
    const imageFiles = getNormalImageFiles(dirname)
    const total = imageFiles.length
    let current = 0
    spinner.succeed(chalk.green('读取图片完成。'))
    spinner.start(chalk.blueBright('压缩图片中...'))

    imageFiles.forEach(async file => {
      // console.log(chalk.blueBright('正在压缩图片'), chalk.yellow(`[${file}]`))
      const outPutFile = file.replace(dirname, compressedDirname)
      checkDirExistAndCreate(outPutFile)

      const sharpInstance = sharp(file, { limitInputPixels: false })
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
            spinner.info(chalk.green('图片已全部压缩完成！'))
          }
        })
    })
  } catch (error) {
    spinner.fail(chalk.red(error))
  }
}
