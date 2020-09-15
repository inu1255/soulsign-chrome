## Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.2.0] - 2020-09-15

### 🛠 修复

- 修复 `manifest` 获取版本错误

### 🎉 增加

- 增加自动发布和镜像同步的 `workflows`
- 增加 `CHANGELOG.md`
- 添加忽略发布文件（`./build` 和 `build.zip`）
- 增加新的分支 `gh-pages`

### 🚀 改变

- 删除仓库中的生产文件，并发布到 `release`
- 将 `./build` 发布到 `gh-pages` 分支

[Unreleased]: https://github.com/olivierlacan/keep-a-changelog/compare/v2.1.2...HEAD
[2.1.2]: https://github.com/mindsers/changelog-reader-action/compare/v2.1.2
