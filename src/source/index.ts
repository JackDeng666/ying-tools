import { exec, execSync } from 'node:child_process'
import { select, input } from '@inquirer/prompts'
import chalk from 'chalk'
import spinner from '@/ora'
import { pingUrl } from '@/utils'
import { getRegistriesJsonObject, setRegistriesJson } from '@/files'

const registries = getRegistriesJsonObject()
const whiteList = ['npm', 'yarn', 'tencent', 'cnpm', 'taobao', 'npmMirror']

const getOrigin = () => {
  return execSync('npm get registry', { encoding: 'utf-8' })
}

const pingFormat = (url: string) => {
  const arr = url.split('')
  return arr[arr.length - 1] == '/' ? arr.pop() && arr.join('') : arr.join('')
}

export function ls() {
  const res = getOrigin()

  const keys = Object.keys(registries)

  const message = []

  const max = Math.max(...keys.map(v => v.length)) + 3
  keys.forEach(k => {
    const newK = registries[k].registry == res.trim() ? '* ' + k : '  ' + k
    const Arr = new Array(...newK)
    Arr.length = max
    const prefix = Array.from(Arr)
      .map(v => (v ? v : '-'))
      .join('')

    message.push(prefix + '  ' + registries[k].registry)
  })
  console.log(message.join('\n'))
}

export async function use() {
  const key = await select({
    message: '请选择镜像',
    choices: Object.keys(registries),
  })
  const reg = registries[key].registry
  spinner.start(chalk.green('切换中...'))
  exec(`npm config set registry ${reg}`, null, (err, stdout, stderr) => {
    if (err) {
      spinner.fail(chalk.red('切换错误', err))
    } else {
      spinner.succeed(chalk.green('切换成功'))
    }
  })
}

export async function current() {
  const reg = getOrigin()
  const v = Object.keys(registries).find(k => {
    if (registries[k].registry === reg.trim()) {
      return k
    }
  })
  if (v) {
    console.log('当前源:', chalk.green(v))
    console.log('地址:', chalk.green(reg))
  } else {
    console.log('当前源地址:', chalk.green(reg))
  }
}

export async function ping() {
  const key = await select({
    message: '请选择镜像',
    choices: Object.keys(registries),
  })
  const url = registries[key].ping.trim()
  spinner.start(chalk.blue('正在ping', url))
  pingUrl(url)
    .then(time => {
      spinner.succeed(chalk.green(`响应时长: ${time}ms`))
    })
    .catch(() => spinner.fail(chalk.red('GG', 'timeout')))
}

export async function add() {
  const name = await input({
    message: '请输入镜像名称',
    validate(answer) {
      const keys = Object.keys(registries)
      if (keys.includes(answer)) {
        return `不能起名${answer}跟保留字冲突`
      }
      if (!answer.trim()) {
        return '名称不能为空'
      }
      return true
    },
  })
  const url = await input({
    message: '请输入镜像地址',
    validate(answer) {
      if (!answer.trim()) {
        return `url不能为空`
      }
      return true
    },
  })
  spinner.start(chalk.blue('开始添加...'))

  registries[name] = {
    home: url.trim(),
    registry: url.trim(),
    ping: pingFormat(url.trim()),
  }

  try {
    setRegistriesJson(JSON.stringify(registries, null, 2))
    spinner.succeed(chalk.green('添加完成'))
  } catch (e) {
    spinner.fail(chalk.red(e))
  }
}

export async function del() {
  const keys = Object.keys(registries)
  if (keys.length === whiteList.length) {
    return console.log(chalk.red('当前无自定义源可以删除'))
  } else {
    const Difference = keys.filter(key => !whiteList.includes(key))
    const key = await select({
      message: '请选择删除的镜像',
      choices: Difference,
    })
    spinner.start(chalk.blue('开始删除...'))
    const current = getOrigin()
    const selOrigin = registries[key]
    if (current.trim() == selOrigin.registry.trim()) {
      spinner.fail(chalk.red(`当前还在使用该镜像${registries[key].registry},请切换其他镜像删除`))
    } else {
      try {
        delete registries[key]
        setRegistriesJson(JSON.stringify(registries, null, 2))
        spinner.succeed(chalk.green('删除成功'))
      } catch (error) {
        spinner.fail(chalk.red(error))
      }
    }
  }
}

export async function rename() {
  const keys = Object.keys(registries)
  if (keys.length === whiteList.length) {
    spinner.fail(chalk.red('当前无自定义源可以重命名'))
    return
  } else {
    const Difference = keys.filter(key => !whiteList.includes(key))
    const key = await select({
      message: '请选择镜像',
      choices: Difference,
    })
    const newName = await input({
      message: '请输入新名称',
      validate(answer) {
        const keys = Object.keys(registries)
        if (keys.includes(answer)) {
          return `不能起名${answer}跟保留字冲突`
        }
        if (!answer.trim()) {
          return `名称不能为空`
        }
        return true
      },
    })
    registries[newName] = Object.assign({}, registries[key])
    delete registries[key]
    try {
      setRegistriesJson(JSON.stringify(registries, null, 2))
      spinner.succeed(chalk.green(`重命名完成 ${newName}`))
    } catch (e) {
      spinner.fail(chalk.red(e))
    }
  }
}

export async function edit() {
  const keys = Object.keys(registries)
  if (keys.length === whiteList.length) {
    spinner.fail(chalk.red('当前无自定义源可以编辑'))
    return
  }
  const Difference = keys.filter(key => !whiteList.includes(key))
  const key = await select({
    message: '请选择需要编辑的源',
    choices: Difference,
  })

  const registerUrl = await input({
    message: '输入修改后的镜像地址',
    default: registries[key].registry,
    validate(registerUrl) {
      if (!registerUrl.trim()) return '镜像地址不能为空'
      return true
    },
  })

  spinner.start(chalk.blue('开始修改...'))

  registries[key] = {
    home: registerUrl.trim(),
    registry: registerUrl.trim(),
    ping: pingFormat(registerUrl.trim()),
  }

  try {
    setRegistriesJson(JSON.stringify(registries, null, 2))
    spinner.succeed(chalk.green('修改完成'))
  } catch (e) {
    spinner.fail(chalk.red(e))
  }
}
