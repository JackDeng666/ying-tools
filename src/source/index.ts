import { exec, execSync } from 'child_process';
import * as inquirer from 'inquirer';
import * as chalk from 'chalk';
import spinner from '../ora';
import { pingUrl } from '../utils';
import { getRegistriesJsonObject, setRegistriesJson } from '../files';

const registries = getRegistriesJsonObject();
const whiteList = ['npm', 'yarn', 'tencent', 'cnpm', 'taobao', 'npmMirror'];

const getOrigin = () => {
  return execSync('npm get registry', { encoding: 'utf-8' });
};

const pingFormat = (url: string) => {
  const arr = url.split('');
  return arr[arr.length - 1] == '/' ? arr.pop() && arr.join('') : arr.join('');
};

export function ls() {
  const res = getOrigin();

  const keys = Object.keys(registries);

  const message = [];

  const max = Math.max(...keys.map((v) => v.length)) + 3;
  keys.forEach((k) => {
    const newK = registries[k].registry == res.trim() ? '* ' + k : '  ' + k;
    const Arr = new Array(...newK);
    Arr.length = max;
    const prefix = Array.from(Arr)
      .map((v) => (v ? v : '-'))
      .join('');

    message.push(prefix + '  ' + registries[k].registry);
  });
  console.log(message.join('\n'));
}

export function use() {
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'sel',
        message: '请选择镜像',
        choices: Object.keys(registries),
      },
    ])
    .then((result) => {
      const reg = registries[result.sel].registry;
      spinner.start(chalk.green('切换中...'));
      exec(`npm config set registry ${reg}`, null, (err, stdout, stderr) => {
        if (err) {
          spinner.fail(chalk.red('切换错误', err));
        } else {
          spinner.succeed(chalk.green('切换成功'));
        }
      });
    });
}

export async function current() {
  const reg = getOrigin();
  const v = Object.keys(registries).find((k) => {
    if (registries[k].registry === reg.trim()) {
      return k;
    }
  });
  if (v) {
    console.log('当前源:', chalk.green(v));
    console.log('地址:', chalk.green(reg));
  } else {
    console.log('当前源地址:', chalk.green(reg));
  }
}

export async function ping() {
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'sel',
        message: '请选择镜像',
        choices: Object.keys(registries),
      },
    ])
    .then((result) => {
      const url = registries[result.sel].ping.trim();
      spinner.start(chalk.blue('正在ping', url));

      pingUrl(url)
        .then((time) => {
          spinner.succeed(chalk.green(`响应时长: ${time}ms`));
        })
        .catch(() => spinner.fail(chalk.red('GG', 'timeout')));
    });
}

export function add() {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'name',
        message: '请输入镜像名称',
        validate(answer) {
          const keys = Object.keys(registries);
          if (keys.includes(answer)) {
            return `不能起名${answer}跟保留字冲突`;
          }
          if (!answer.trim()) {
            return '名称不能为空';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'url',
        message: '请输入镜像地址',
        validate(answer) {
          if (!answer.trim()) {
            return `url不能为空`;
          }
          return true;
        },
      },
    ])
    .then((result) => {
      spinner.start(chalk.blue('开始添加...'));

      registries[result.name] = {
        home: result.url.trim(),
        registry: result.url.trim(),
        ping: pingFormat(result.url.trim()),
      };

      try {
        setRegistriesJson(JSON.stringify(registries, null, 2));
        spinner.succeed(chalk.green('添加完成'));
      } catch (e) {
        spinner.fail(chalk.red(e));
      }
    });
}

export function del() {
  const keys = Object.keys(registries);
  if (keys.length === whiteList.length) {
    return console.log(chalk.red('当前无自定义源可以删除'));
  } else {
    const Difference = keys.filter((key) => !whiteList.includes(key));
    inquirer
      .prompt([
        {
          type: 'list',
          name: 'sel',
          message: '请选择删除的镜像',
          choices: Difference,
        },
      ])
      .then(async (result) => {
        spinner.start(chalk.blue('开始删除...'));
        const current = getOrigin();
        const selOrigin = registries[result.sel];
        if (current.trim() == selOrigin.registry.trim()) {
          spinner.fail(chalk.red(`当前还在使用该镜像${registries[result.sel].registry},请切换其他镜像删除`));
        } else {
          try {
            delete registries[result.sel];
            setRegistriesJson(JSON.stringify(registries, null, 2));
            spinner.succeed(chalk.green('删除成功'));
          } catch (error) {
            spinner.fail(chalk.red(error));
          }
        }
      });
  }
}

export function rename() {
  const keys = Object.keys(registries);
  if (keys.length === whiteList.length) {
    spinner.fail(chalk.red('当前无自定义源可以重命名'));
    return;
  } else {
    const Difference = keys.filter((key) => !whiteList.includes(key));
    inquirer
      .prompt([
        {
          type: 'list',
          name: 'sel',
          message: '请选择名称',
          choices: Difference,
        },
        {
          type: 'input',
          name: 'rename',
          message: '请输入新名称',
          validate(answer) {
            const keys = Object.keys(registries);
            if (keys.includes(answer)) {
              return `不能起名${answer}跟保留字冲突`;
            }
            if (!answer.trim()) {
              return `名称不能为空`;
            }
            return true;
          },
        },
      ])
      .then(async (result) => {
        registries[result.rename] = Object.assign({}, registries[result.sel]);
        delete registries[result.sel];

        try {
          setRegistriesJson(JSON.stringify(registries, null, 2));
          spinner.succeed(chalk.green(`重命名完成 ${result.rename}`));
        } catch (e) {
          spinner.fail(chalk.red(e));
        }
      });
  }
}

export async function edit() {
  const keys = Object.keys(registries);
  if (keys.length === whiteList.length) {
    spinner.fail(chalk.red('当前无自定义源可以编辑'));
    return;
  }
  const Difference = keys.filter((key) => !whiteList.includes(key));
  const { sel } = await inquirer.prompt([
    {
      type: 'list',
      name: 'sel',
      message: '请选择需要编辑的源',
      choices: Difference,
    },
  ]);
  const { registerUrl } = await inquirer.prompt([
    {
      type: 'input',
      name: 'registerUrl',
      message: '输入修改后的镜像地址',
      default: () => registries[sel].registry,
      validate(registerUrl) {
        if (!registerUrl.trim()) return '镜像地址不能为空';
        return true;
      },
    },
  ]);

  spinner.start(chalk.blue('开始修改...'));

  registries[sel] = {
    home: registerUrl.trim(),
    registry: registerUrl.trim(),
    ping: pingFormat(registerUrl.trim()),
  };

  try {
    setRegistriesJson(JSON.stringify(registries, null, 2));
    spinner.succeed(chalk.green('修改完成'));
  } catch (e) {
    spinner.fail(chalk.red(e));
  }
}
