import { existsSync } from 'node:fs'
import { writeFile, rename, rm, readdir } from 'node:fs/promises'
import { input, select } from '@inquirer/prompts'
import { useApp, Box } from 'ink'
import { useEffect, useRef } from 'react'
import chalk from 'chalk'
import compressing from 'compressing'
import { LoadingTip, useTipState } from '@/components/loading-tip'
import { http, downloadWithProgress, formatBytes, type OnProgressProps } from '@/http'
import { GithubReposRes, GithubTagRes } from './types'

type AppProps = {
  saveDir?: string
}
type CrtData = {
  userName: string
  repoName?: string
  tagName?: string
}
export function App({ saveDir }: AppProps) {
  const { exit, suspendTerminal } = useApp()

  const { tipState, loading, warn, success, fail } = useTipState()

  const crtData = useRef<CrtData>({
    userName: 'JackDeng666',
  })

  async function renameFolder(name: string) {
    const suspend = await suspendTerminal()
    const newName = await input({
      message: `当前保存目录[${name}]已存在，请输入新的文件夹名称，保持默认将删除此文件夹？`,
      default: name,
    })
    await suspend.resume()
    return newName
  }

  async function saveRepo(buffer: Buffer<ArrayBuffer>) {
    try {
      const { repoName } = crtData.current
      if (!repoName) return
      loading(chalk.blue('正在写入项目压缩包...'))
      let repoZipFile = `./${repoName}.zip`
      await writeFile(repoZipFile, buffer, 'binary')
      let finalSaveDirname = saveDir ?? repoName
      if (existsSync(`./${finalSaveDirname}`)) {
        const newName = await renameFolder(finalSaveDirname)
        if (newName === finalSaveDirname) {
          loading(chalk.blue('正在删除旧文件夹...'))
          await rm(`./${finalSaveDirname}`, { recursive: true, force: true })
        } else {
          finalSaveDirname = newName
        }
      }
      loading(chalk.blue('正在解压项目...'))
      const uncompressedSourcePath = `./${repoName}-${Math.random()}`
      await compressing.zip.uncompress(repoZipFile, uncompressedSourcePath)
      const dirs = await readdir(uncompressedSourcePath)
      const sourcePath = uncompressedSourcePath + `/${dirs[0]}`
      loading(chalk.blue('正在清理临时文件...'))
      await rename(sourcePath, `./${finalSaveDirname}`)
      await Promise.all([rm(uncompressedSourcePath, { recursive: true, force: true }), rm(repoZipFile)])
      success(chalk.green('导入模板完成'))
    } catch (error) {
      fail(chalk.red('操作失败'), chalk.red(error))
    } finally {
      setTimeout(exit)
    }
  }

  async function downLoad() {
    loading(chalk.blue('正在下载项目压缩包...'))
    const { userName, repoName, tagName } = crtData.current
    if (!repoName) return

    const url = tagName
      ? `https://codeload.github.com/${userName}/${repoName}/zip/refs/tags/${tagName}`
      : `https://codeload.github.com/${userName}/${repoName}/zip/refs/heads/main`

    function onDownloadProgress({ done, loaded, progress }: OnProgressProps) {
      if (done) {
        success('项目压缩包下载完毕')
      } else {
        loading(
          chalk.blue('正在下载项目压缩包,'),
          chalk.green(`${formatBytes(loaded)}已下载.`),
          progress ? chalk.green(`${(progress * 100).toFixed(2)}%`) : '',
        )
      }
    }

    downloadWithProgress(url, onDownloadProgress)
      .then(saveRepo)
      .catch(() =>
        downloadWithProgress(
          `https://codeload.github.com/${userName}/${repoName}/zip/refs/heads/master`,
          onDownloadProgress,
        )
          .then(saveRepo)
          .catch(() => {
            fail(chalk.red('下载失败'))
            setTimeout(exit)
          }),
      )
  }

  // 选择版本标签
  async function selectTags(tags: GithubTagRes[]) {
    await suspendTerminal(async () => {
      crtData.current.tagName = await select({
        message: '请选择版本',
        choices: tags.map(el => el.name),
      })
    })
    downLoad()
  }

  // 查询版本标签
  async function getTags() {
    try {
      loading(chalk.yellow('正在查询版本标签信息...'))
      if (!crtData.current.repoName) return
      const data = await http.get<GithubTagRes[]>(
        `https://api.github.com/repos/${crtData.current.userName}/${crtData.current.repoName}/tags`,
      )
      if (data.length == 0) {
        loading(chalk.blue('无版本标签，将直接下载模板最新代码'))
        downLoad()
      } else {
        await selectTags(data.map(item => ({ ...item })))
      }
    } catch (error) {
      fail(chalk.red(error))
    }
  }

  // 选择仓库
  async function selectRepos(arr: GithubReposRes[]) {
    await suspendTerminal(async () => {
      crtData.current.repoName = await select({
        message: '请选择仓库',
        choices: arr.map(el => el.name),
      })
    })
    await getTags()
  }

  // 查询仓库
  async function getRepos() {
    try {
      loading(chalk.yellow('正在查询仓库信息...'))
      const data = await http.get<GithubReposRes[]>(`https://api.github.com/users/${crtData.current.userName}/repos`)
      if (data.length == 0) {
        warn(chalk.yellow('该用户可能没有开源仓库'))
      } else {
        await selectRepos(data)
      }
    } catch (error) {
      fail(chalk.red(error))
    }
  }

  async function startCrt() {
    await suspendTerminal(async () => {
      crtData.current.userName = await input({
        message: '请输入Github用户名',
        default: 'JackDeng666',
      })
    })
    await getRepos()
  }

  useEffect(() => {
    startCrt()
  }, [])

  return <Box>{tipState && <LoadingTip {...tipState} />}</Box>
}
