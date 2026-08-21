import { select, input, number } from '@inquirer/prompts'
import { useApp, Box } from 'ink'
import { useEffect, useState } from 'react'
import chalk from 'chalk'
import { ProgressBar } from '@/components/progress-bar'
import { LoadingTip, useTipState, useTipStateList } from '@/components/loading-tip'
import sharp from 'sharp'

import { readCurrentFolder, checkDirExistAndCreate, createGetFiles } from '@/fs-utils'

const normalImageExts = ['.png', '.jpg', '.jpeg']
const getNormalImageFiles = createGetFiles(filePath => normalImageExts.some(ext => filePath.endsWith(ext)))

type AppProps = {
  saveDir?: string
}
export function App({ saveDir }: AppProps) {
  const { exit, suspendTerminal } = useApp()
  const { tipState, loading, success, fail } = useTipState()
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingText, setLoadingText] = useState('')
  const { tipStateList, startLoading } = useTipStateList()

  async function selectConfig() {
    const suspend = await suspendTerminal()
    let dirname = saveDir
    if (!dirname) {
      const dirs = await readCurrentFolder()
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
    await suspend.resume()
    return {
      dirname,
      compressedDirname,
      quality,
    }
  }

  async function start() {
    try {
      const { dirname, compressedDirname, quality } = await selectConfig()
      loading('读取图片中...')
      const imageFiles = await getNormalImageFiles(dirname)
      success('图片读取完毕.')
      const total = imageFiles.length
      let current = 0
      if (!total) {
        fail('文件夹下没有目标图片.')
        setTimeout(exit)
        return
      }
      setLoadingText('压缩图片中...')
      imageFiles.forEach(async file => {
        const outPutFile = file.replace(dirname, compressedDirname)
        const logArr = [chalk.blue(`[${file}]`), '--->', chalk.yellow(`[${outPutFile}]`)]
        const { success, fail } = startLoading(chalk.blueBright('正在压缩:'), ...logArr)
        await checkDirExistAndCreate(outPutFile)
        const sharpInstance = sharp(file, { limitInputPixels: false })
        const { format } = await sharpInstance.metadata()
        sharpInstance
          .toFormat(format, { quality })
          .toFile(outPutFile)
          .then(() => {
            success(chalk.green('压缩完成:'), ...logArr)
          })
          .catch(err => {
            fail(...logArr, chalk.red('压缩失败:' + err))
          })
          .finally(() => {
            current++
            const percent = current / total
            setLoadingProgress(percent)
            setLoadingText(`压缩图片${(percent * 100).toFixed(2)}%...`)
            if (current >= total) {
              setLoadingText('操作完成.')
              setTimeout(exit)
            }
          })
      })
    } catch (error) {
      fail(chalk.red(error))
    }
  }

  useEffect(() => {
    start()
  }, [])

  return (
    <Box flexDirection="column">
      {tipState && <LoadingTip {...tipState} />}
      <ProgressBar percent={loadingProgress} text={loadingText} />
      {tipStateList.map((el, index) => (
        <LoadingTip {...el} key={index} />
      ))}
    </Box>
  )
}
