# 🌟 知网吸星大法 - CNKI全自动批量下载 🔥

<p align="center">
  <a href="https://github.com/rinrin583/cnki-xixingdafa/stargazers"><img src="https://img.shields.io/github/stars/rinrin583/cnki-xixingdafa?style=social" alt="Stars"></a>
  <a href="https://github.com/rinrin583/cnki-xixingdafa/network/members"><img src="https://img.shields.io/github/forks/rinrin583/cnki-xixingdafa?style=social" alt="Forks"></a>
  <a href="https://greasyfork.org/zh-CN/scripts/574473"><img src="https://img.shields.io/badge/Greasy%20Fork-安装脚本-green" alt="Greasy Fork"></a>
  <a href="https://github.com/rinrin583/cnki-xixingdafa/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
</p>

<p align="center">
  <b>如果觉得好用，请点一个 ⭐ Star 支持一下！你的 Star 是我持续更新的最大动力！</b>
</p>

> 试了网上好几个知网批量下载工具，要么停更了，要么触发安全验证就中断，要么下一半没法继续...忍不了了，自己重新写了一个。

一个 Tampermonkey 油猴脚本，在知网搜索结果页 **一键全自动批量下载PDF文献**。

---

## 🎯 为什么用这个？

现有工具的常见问题：
- ❌ 很多工具已经停更，装上去根本不能用
- ❌ 跑着跑着触发知网验证码，直接中断，进度全丢
- ❌ 中断后没法继续，只能从头再来
- ❌ 下载太快IP被封

**知网吸星大法** 专门解决这些问题 👇

## ✨ 功能特点

| 功能 | 说明 |
|------|------|
| 🤖 **全自动下载** | 自动打开文献 → 找PDF按钮 → 点击下载 → 关闭 → 下一篇 |
| 📄 **自动翻页** | 一页下完自动翻到下一页继续，真正全自动 |
| 💾 **断点续传** | 下载记录自动保存，刷新/关浏览器都不丢，已下载的自动跳过 |
| 🛡️ **验证码不怕** | 弹出验证码自动暂停，你手动拖一下滑块，它自动继续 |
| 🎭 **防反爬** | 随机延迟 + 模拟人类浏览行为，降低触发验证码概率 |
| ⏸️ **随时可控** | 暂停 / 继续 / 终止，随时掌控 |
| 🟢 **已下载标绿** | 页面上已下载的文献自动标绿，一目了然 |
| 📥 **自动IP登录** | 遇到登录弹窗自动点击IP登录 |

---

## 📦 安装教程（3步搞定）

### 第1步：安装 Tampermonkey

> 如果已经装了油猴，跳过这步

- Chrome：[Tampermonkey - Chrome 应用商店](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- Edge：[Tampermonkey - Edge 插件商店](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
- Firefox：[Tampermonkey - Firefox 附加组件](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)

### 第2步：安装脚本

**方式一（推荐）：** 点击下面的链接，Tampermonkey 会自动弹出安装页面

👉 [**Greasy Fork 一键安装**](https://greasyfork.org/zh-CN/scripts/574473-%E7%9F%A5%E7%BD%91%E5%90%B8%E6%98%9F%E5%A4%A7%E6%B3%95-cnki%E5%85%A8%E8%87%AA%E5%8A%A8%E4%B8%8B%E8%BD%BD)

👉 [**GitHub Raw 安装**](https://raw.githubusercontent.com/rinrin583/cnki-xixingdafa/main/cnki_batch_download.user.js)

**方式二（手动）：**
1. 点击浏览器右上角 Tampermonkey 图标 → 「管理面板」
2. 点左上角 **「+」** 新建脚本
3. 删掉默认内容，把 [`cnki_batch_download.user.js`](cnki_batch_download.user.js) 的全部内容粘贴进去
4. **Ctrl + S** 保存

### 第3步：开始使用

1. 打开知网 → 搜索你要下载的文献
2. 搜索结果页 **右下角** 会出现 **「🌟 知网吸星大法」** 面板
3. 点击 **「开始全自动下载」** 🎉

---

## 🚀 使用说明

### 基本操作

```
打开知网 → 搜索文献 → 看到右下角面板 → 点「开始」→ 坐等下载完成
```

### 面板按钮说明

| 按钮 | 颜色 | 功能 |
|------|------|------|
| 开始全自动下载 | 🔵 蓝色 | 开始批量下载 |
| 暂停 / 继续 | 🟠 橙色 / 🟢 绿色 | 暂停或恢复下载 |
| 终止 | 🔴 红色 | 完全停止下载 |
| 导入已下载记录 | 🟣 紫色 | 手动导入已有的下载记录 |
| 清空下载记录 | ⚫ 灰色 | 清除所有记录（不删文件） |
| 最小化 | ⬜ 浅灰 | 把面板缩成小圆点 |

### 面板挡住内容？

面板可以 **拖动**！按住面板空白处拖到任意位置。

### 弹窗被拦截？

首次运行时浏览器可能拦截弹出窗口：
1. 点击地址栏右侧的 **弹窗拦截图标**
2. 选择 **「始终允许」**
3. 刷新页面，重新点击「开始」

### 遇到验证码？

不用慌！脚本会自动暂停，面板显示黄色提示。你手动完成滑块验证后，脚本自动继续下载。

### 断点续传

- 下载过的文献标题自动记录在浏览器里
- 刷新页面、关掉浏览器、换电脑打开都不影响
- 已下载的文献在页面上 **自动标绿**
- 再次点击「开始」会自动跳过已下载的

---

## ⚠️ 使用前提

1. **需要知网下载权限** — 通过学校VPN、图书馆入口等方式访问知网
2. **仅限个人学术研究使用**，请遵守知网使用条款
3. 建议不要把下载速度调得太快，避免触发反爬

---

## ⚙️ 配置说明

打开脚本编辑页面，可以修改 `CONFIG` 对象调整参数：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `delayMin` | 3秒 | 每篇最少等待时间 |
| `delayMax` | 8秒 | 每篇最多等待时间 |
| `restEvery` | 20篇 | 每下载多少篇休息一次 |
| `restMin` | 15秒 | 休息最短时间 |
| `restMax` | 30秒 | 休息最长时间 |
| `maxPerSession` | 100篇 | 单次最多下载数量 |
| `autoNextPage` | true | 是否自动翻页 |

> 💡 如果频繁触发验证码，把 `delayMin` 和 `delayMax` 调大一点

---

## 🤝 贡献 & 反馈

- 遇到问题？[提交 Issue](https://github.com/rinrin583/cnki-xixingdafa/issues)
- 有改进想法？欢迎 PR
- 觉得好用？帮忙 **转发分享** 给同学朋友！

---

## ⭐ 支持项目

如果这个工具帮到了你，请花 1 秒钟点一个 **Star** ⭐ ！

- GitHub **Star** = 最好的鼓励 🌟
- **Fork** 收藏 = 以后随时找得到 🔖
- **分享给同学** = 帮助更多人 💪
- Greasy Fork **好评** = 让更多人发现 ✨

> 每一个 Star 都是作者继续更新维护的动力，感谢你的支持！

---

## 📄 License

MIT License — 免费使用，随便改
