## 嘤之工具库

```bash
npm i ying-tool -g
ying -v
```

### 用法

```bash
Usage: ying [options] [command]

Options:
  -v --version    output the version number

Commands:
  crt [name]      从github下载开源项目并在当前文件夹重命名创建
  src             管理切换npm源
```

### crt 示例

crt 主要用于不想 clone 整个 git，而是下载托管于 github 上的模板仓库，用于快速创建模板项目。

```bash
ying crt test-project
```

### src 示例

```bash
ying src ls
```

### src 详细

```bash
Usage: ying src [command]

管理切换npm镜像源

Commands:
  ls              查看镜像
  use             使用镜像
  current|c       查看当前镜像
  ping            测试镜像地址速度
  add             自定义镜像
  delete|d        删除自定义镜像
  rename          重命名自定义镜像
  edit            编辑自定义镜像
```
