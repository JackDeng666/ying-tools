#!/usr/bin/env node
import { program } from 'commander'
import { getPackageJson } from './get-package-json'
import { crt } from './crt'
import * as image from './image'

program.name('ying').helpOption(true)

program.command('crt').argument('[name]').description('从 github 下载开源项目并在当前文件夹重命名创建').action(crt)

const imageProgram = program.command('image').description('图片工具')
imageProgram
  .command('compress-normal')
  .alias('c-n')
  .argument('[dir]')
  .description('压缩指定文件夹的下的通常图片(png,jpg,jpeg)')
  .action(image.compressNormal)
imageProgram
  .command('compress-gif')
  .alias('c-g')
  .argument('[dir]')
  .description('压缩指定文件夹的下的gif图片')
  .action(image.compressGif)

const pkg = getPackageJson()
program.version(`${pkg.version}`, '-v --version')
program.parse(process.argv)
