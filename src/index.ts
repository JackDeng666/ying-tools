import { program } from 'commander';
import { crt } from './crt';
import * as source from './source';

program.name('ying').helpOption(false);

program.command('crt').argument('[name]').description('从github下载开源项目并在当前文件夹重命名创建').action(crt);

const sourceProgram = program.command('src').description('管理切换npm镜像源');
sourceProgram.command('ls').description('查看镜像').action(source.ls);
sourceProgram.command('use').description('使用镜像').action(source.use);
sourceProgram.command('current').alias('c').description('查看当前镜像').action(source.current);
sourceProgram.command('ping').description('测试镜像地址速度').action(source.ping);
sourceProgram.command('add').description('自定义镜像').action(source.add);
sourceProgram.command('delete').alias('d').description('删除自定义镜像').action(source.del);
sourceProgram.command('rename').description('重命名自定义镜像').action(source.rename);
sourceProgram.command('edit').description('编辑自定义镜像').action(source.edit);

program.version(`${require('../package.json').version}`, '-v --version');
program.parse(process.argv);
