import fs from 'fs'
import axios, { AxiosProgressEvent, AxiosResponse } from 'axios'
import inquirer from 'inquirer'
import { QuestionCollection } from 'inquirer'
import chalk from 'chalk'
import compressing from 'compressing'
import spinner from '@/ora'
import { copyFile, delFile } from '@/utils.js'
import { GithubReposRes, GithubTagRes } from './types.js'

let userName = 'JackDeng666',
  repoName = null,
  tagName = null,
  dirName = null,
  size = 0,
  delOrigin = false

export async function crt(name: string) {
  dirName = name
  const questionList: QuestionCollection[] = [
    {
      type: 'input',
      name: 'userName',
      message: '请输入Github用户名',
      default: 'JackDeng666',
    },
  ]
  fs.existsSync(`./${dirName}`) &&
    questionList.unshift({
      type: 'confirm',
      name: 'delOrigin',
      message: '此目录已存在，下载模板后是否删除，否将合并',
    })
  const ret = await inquirer.prompt(questionList)
  delOrigin = ret.delOrigin
  userName = ret.userName
  await getRepos()
}

// 查询仓库
async function getRepos() {
  spinner.start(chalk.yellow('正在查询仓库信息...'))
  let url = `https://api.github.com/users/${userName}/repos`
  try {
    const { data } = await axios.get<GithubReposRes[]>(url)
    let arr = data.map(item => ({ name: item.name, size: item.size }))
    if (arr.length == 0) {
      spinner.warn(chalk.yellow('该用户可能没有开源仓库'))
    } else {
      spinner.stop()
      selectRepos(arr)
    }
  } catch (error) {
    spinner.fail(chalk.red('查询失败，用户名可能不存在'))
  }
}

// 选择仓库
async function selectRepos(arr: { name: string; size: number }[]) {
  let repo = await inquirer.prompt([
    {
      type: 'list',
      name: 'repoName',
      message: '请选择仓库',
      choices: arr,
    },
  ])
  repoName = repo.repoName
  // 粗略获取包大小
  const findRepos = arr.find(el => el.name === repoName)
  findRepos && (size = findRepos.size)
  await getTags()
}

// 查询版本标签
async function getTags() {
  spinner.start(chalk.yellow('正在查询版本标签信息...'))
  let url = `https://api.github.com/repos/${userName}/${repoName}/tags`
  const { data } = await axios.get<GithubTagRes[]>(url)
  if (data.length == 0) {
    spinner.info(chalk.blue('无版本标签，将直接下载模板最新代码'))
    downLoad()
  } else {
    spinner.stop()
    selectTags(data.map(item => ({ ...item })))
  }
}

// 选择版本标签
async function selectTags(tags: GithubTagRes[]) {
  let tag = await inquirer.prompt([
    {
      type: 'list',
      name: 'tagName',
      message: '请选择版本',
      choices: tags,
    },
  ])
  tagName = tag.tagName
  downLoad()
}

// 下载模板
async function downLoad() {
  spinner.start(chalk.blue('正在下载模板...'))
  let url = tagName
    ? `https://codeload.github.com/${userName}/${repoName}/zip/refs/tags/${tagName}`
    : `https://codeload.github.com/${userName}/${repoName}/zip/refs/heads/master`

  function onDownloadProgress(evt: AxiosProgressEvent) {
    let percent = (evt.loaded / 1024 / size) * 100
    if (percent > 100) {
      percent = 100
    }
    spinner.text = chalk.blue('正在下载模板...') + chalk.green(`${percent.toFixed(2)}%`)
    spinner.render()
  }

  axios({
    method: 'get',
    url,
    responseType: 'arraybuffer',
    onDownloadProgress,
  })
    .then(saveFile)
    .catch(() => {
      axios({
        method: 'get',
        url: `https://codeload.github.com/${userName}/${repoName}/zip/refs/heads/main`,
        responseType: 'arraybuffer',
        onDownloadProgress,
      })
        .then(saveFile)
        .catch(() => {
          spinner.fail(chalk.red('下载失败'))
        })
    })
}

async function saveFile(res: AxiosResponse) {
  // 先保存下载压缩包
  let fileName = `${repoName}-ying`
  fs.writeFileSync(`./${fileName}.zip`, res.data, 'binary')
  // 是否删除原文件夹
  delOrigin && delFile(`./${dirName}`)
  // 解压并转移文件
  spinner.text = chalk.blue('正在解压模板...')
  spinner.render()
  await compressing.zip.uncompress(`${fileName}.zip`, `${fileName}`)
  let sourcePath = `./${fileName}`
  fs.readdir(`./${fileName}`, function (err, files) {
    sourcePath += `/${files[0]}`
    copyFile(sourcePath, `./${dirName}`)
    // 删除解压内容和压缩包
    delFile(`./${fileName}`)
    fs.unlinkSync(`./${fileName}.zip`)
    spinner.succeed(chalk.green('导入模板完成'))
  })
}
