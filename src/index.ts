import { program } from 'commander'
import { getPackageJsonObject } from './files'
import { crt } from './crt'
import * as source from './source'
import { compressImage } from './compress-img'

const pkg = getPackageJsonObject()

program.name('ying').helpOption(true)

program.command('crt').argument('[name]').description('从 github 下载开源项目并在当前文件夹重命名创建').action(crt)

program
  .command('compress-img')
  .alias('ci')
  .argument('[imagesDir]')
  .description('压缩指定文件夹的下的图片文件，目前仅支持[png,jpg,jpeg]')
  .action(compressImage)

const sourceProgram = program.command('src').description('管理切换npm镜像源')
sourceProgram.command('ls').description('查看镜像').action(source.ls)
sourceProgram.command('use').description('使用镜像').action(source.use)
sourceProgram.command('current').alias('c').description('查看当前镜像').action(source.current)
sourceProgram.command('ping').description('测试镜像地址速度').action(source.ping)
sourceProgram.command('add').description('自定义镜像').action(source.add)
sourceProgram.command('delete').alias('d').description('删除自定义镜像').action(source.del)
sourceProgram.command('rename').description('重命名自定义镜像').action(source.rename)
sourceProgram.command('edit').description('编辑自定义镜像').action(source.edit)

program.version(`${pkg.version}`, '-v --version')
program.parse(process.argv)
