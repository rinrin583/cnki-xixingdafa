# 🌟 知网吸星大法 - CNKI全自动批量下载 v8.3 🔥

<p align="center">
  <img src="https://img.shields.io/badge/version-v8.3-brightgreen?style=for-the-badge" alt="Version">
  <a href="https://github.com/rinrin583/cnki-xixingdafa/stargazers"><img src="https://img.shields.io/github/stars/rinrin583/cnki-xixingdafa?style=for-the-badge&color=gold" alt="Stars"></a>
  <a href="https://github.com/rinrin583/cnki-xixingdafa/network/members"><img src="https://img.shields.io/github/forks/rinrin583/cnki-xixingdafa?style=for-the-badge&color=blue" alt="Forks"></a>
  <a href="https://greasyfork.org/zh-CN/scripts/574473"><img src="https://img.shields.io/badge/Greasy%20Fork-安装脚本-green?style=for-the-badge" alt="Greasy Fork"></a>
  <a href="https://github.com/rinrin583/cnki-xixingdafa/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge" alt="License"></a>
</p>

<p align="center">
  <b>⭐ 如果觉得好用，请点一个 Star 支持一下！你的 Star 是我持续更新的最大动力！</b>
</p>

> 试了网上好几个知网批量下载工具，要么停更了，要么触发安全验证就中断，要么下一半没法继续...忍不了了，从零重写了整个架构，从 v5 迭代到 v8.3，经历了 **8个大版本、数十次优化**，终于打磨成现在这个稳定好用的版本。

一个 Tampermonkey 油猴脚本，在知网搜索结果页 **一键全自动批量下载文献**。

> 💡 **关于下载格式：** 当前版本（v8.3）主打 **极速下载**，默认下载 **CAJ 格式**。CAJ 文件可使用 [CAJViewer](https://cajviewer.cnki.net/) 或第三方工具转换为 PDF。仓库中同时保留了支持 PDF 下载的旧版本（v5），但速度较慢。两个版本各有优势，大家可以根据自己的需求选择使用！

---

## 📦 两个版本对比

| 对比项 | v8.3（推荐·当前版） | v5（旧版） |
|--------|---------------------|-----------|
| **下载速度** | ⚡ **极快** — 直接触发下载链接，不操作子窗口 | 🐢 较慢 — 需要逐个打开详情页 |
| **下载格式** | 📦 CAJ 格式 | 📄 PDF 格式 |
| **稳定性** | ✅ 非常稳定 | ⚠️ 跨窗口操作偶尔失败 |
| **下载模式** | 顺序下载 + 勾选下载 | 仅顺序下载 |
| **自动翻页** | ✅ 支持 | ❌ 翻页后中断 |
| **中场休息** | ✅ 可配置、可跳过 | ❌ 不支持 |
| **文件夹导入** | ✅ 支持 | ❌ 不支持 |

- 👉 **追求效率**：用 v8.3（`cnki_batch_download_v8.user.js`），下完用 CAJViewer 查看或批量转 PDF
- 👉 **必须PDF**：用 v5（`cnki_batch_download.user.js`），速度慢一些但直接得到 PDF

---

## 🔥 v8.3 更新亮点

> 相比初始版本，v8.3 是一次 **从底层架构到用户体验的全面重构**

### 🏗️ 架构革新
| 对比项 | v5（旧版） | v8.3（当前版） |
|--------|-----------|---------------|
| 下载方式 | 打开文献详情页 → 跨窗口操作DOM点击下载 | **直接从搜索页触发下载链接**，不操作子窗口 |
| 稳定性 | 跨域/时序问题导致频繁失败 | 彻底消除跨窗口不稳定因素 |
| 下载格式 | 支持PDF，但速度慢 | CAJ格式，**极速下载** |
| 翻页处理 | 翻页后DOM失效，脚本中断 | **动态重查询DOM，翻页无缝衔接** |
| 下载模式 | 仅顺序全部下载 | **顺序下载 + 勾选下载** 双模式 |

### ✨ 新功能一览

| 功能 | 说明 |
|------|------|
| 🔀 **双模式下载** | 顺序下载（全部）+ 勾选下载（读取CNKI原生勾选框，选哪些下哪些） |
| 📖 **全自动翻页** | 一页下完自动翻下一页继续，两种模式均支持跨页下载 |
| ⏱️ **可跳过的中场休息** | 每N篇自动休息，醒目倒计时显示，着急可一键跳过立即继续 |
| ⚙️ **休息参数可配置** | 面板内直接设置：每几篇休息、休息时长范围，实时保存 |
| 📂 **文件夹导入记录** | 选择本地下载文件夹，自动扫描PDF/CAJ文件生成已下载记录 |
| 📊 **自动切换每页50条** | 自动将知网默认20条/页调整为50条，减少翻页次数 |
| 🎉 **趣味完成提示** | 下载完成随机显示俏皮话："累死我了，老板加鸡腿🍗" |
| 🖱️ **面板可拖动** | 按住面板空白处自由拖动到任意位置 |
| 📌 **面板可最小化** | 一键缩成悬浮小圆点，不遮挡页面内容 |
| 💾 **断点续传** | 下载记录持久化，刷新/关闭浏览器不丢失，已下载自动跳过 |
| 🟢 **已下载标绿** | 已下载文献标题自动标绿，进度一目了然 |
| 🛡️ **验证码暂停** | 弹出验证码自动暂停等待，验证后继续下载 |
| ⏸️ **随时可控** | 暂停 / 继续 / 终止，完全掌控下载节奏 |
| 🎭 **防反爬策略** | 篇间随机延迟 + 定期中场休息，降低触发风控概率 |

---

## 🎯 为什么用这个？

现有工具的常见问题：
- ❌ 很多工具已经停更，装上去根本不能用
- ❌ 跑着跑着触发知网验证码，直接中断，进度全丢
- ❌ 中断后没法继续，只能从头再来
- ❌ 只能下CAJ格式，还得额外装阅读器
- ❌ 需要Python环境，配置半天跑不起来
- ❌ 跨窗口操作不稳定，"打开就关闭，一篇都下不了"

**知网吸星大法 v8.3** 用全新架构逐一解决 👆

---

## 📦 安装教程（3步搞定）

### 第1步：安装 Tampermonkey

> 如果已经装了油猴，跳过这步

- Chrome：[Tampermonkey - Chrome 应用商店](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- Edge：[Tampermonkey - Edge 插件商店](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
- Firefox：[Tampermonkey - Firefox 附加组件](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)

### 第2步：安装脚本

**⚡ v8.3 极速版（推荐）** — CAJ格式，速度快，功能全

👉 [**GitHub Raw 安装 v8.3**](https://raw.githubusercontent.com/rinrin583/cnki-xixingdafa/main/cnki_batch_download_v8.user.js)

**📄 v5 PDF版** — PDF格式，速度较慢

👉 [**GitHub Raw 安装 v5**](https://raw.githubusercontent.com/rinrin583/cnki-xixingdafa/main/cnki_batch_download.user.js)

👉 [**Greasy Fork 一键安装**](https://greasyfork.org/zh-CN/scripts/574473-%E7%9F%A5%E7%BD%91%E5%90%B8%E6%98%9F%E5%A4%A7%E6%B3%95-cnki%E5%85%A8%E8%87%AA%E5%8A%A8%E4%B8%8B%E8%BD%BD)

**方式二（手动）：**
1. 点击浏览器右上角 Tampermonkey 图标 → 「管理面板」
2. 点左上角 **「+」** 新建脚本
3. 删掉默认内容，粘贴对应版本的脚本内容：
   - 极速版：[`cnki_batch_download_v8.user.js`](cnki_batch_download_v8.user.js)
   - PDF版：[`cnki_batch_download.user.js`](cnki_batch_download.user.js)
4. **Ctrl + S** 保存

### 第3步：开始使用

1. 打开知网 → 搜索你要下载的文献
2. 搜索结果页 **右下角** 会出现 **「🌟 知网吸星大法」** 面板
3. 选择下载模式（v8.3 支持顺序 / 勾选两种模式）
4. 点击 **「开始批量下载」** → 去喝杯咖啡 ☕

---

## 🚀 使用说明

### 基本操作

```
打开知网 → 搜索文献 → 看到右下角面板 → 选模式 → 点「开始」→ 坐等下载完成
```

### 下载模式

| 模式 | 适用场景 | 说明 |
|------|----------|------|
| 🔹 **顺序下载** | 全部都要 | 从第一条开始，逐条下载，自动翻页 |
| 🔹 **勾选下载** | 精选下载 | 使用知网原生勾选框，只下载你打勾的文献 |

### 面板按钮说明

| 按钮 | 颜色 | 功能 |
|------|------|------|
| 开始批量下载 | 🔵 蓝色 | 开始批量下载 |
| 暂停 / 继续 | 🟠 橙色 / 🟢 绿色 | 暂停或恢复下载 |
| ⚡ 跳过休息 | 🟢 绿色 | 中场休息时出现，一键跳过立即继续 |
| 终止 | 🔴 红色 | 完全停止下载 |
| ⚙️ 中场休息设置 | 🔵 靛蓝 | 设置每几篇休息、休息时长 |
| 导入已下载记录 | 🟣 紫色 | 选择文件夹，扫描PDF/CAJ生成记录 |
| 清空下载记录 | ⚫ 灰色 | 清除所有记录（不删文件） |
| 最小化 | ⬜ 浅灰 | 把面板缩成悬浮小圆点 |

### 常见问题

<details>
<summary><b>面板挡住内容？</b></summary>
面板可以 <b>拖动</b>！按住面板空白处拖到任意位置。也可以点「最小化」缩成小圆点。
</details>

<details>
<summary><b>弹窗被拦截？</b></summary>
首次运行时浏览器可能拦截弹出窗口：<br>
1. 点击地址栏右侧的弹窗拦截图标<br>
2. 选择「始终允许」<br>
3. 刷新页面，重新点击「开始」
</details>

<details>
<summary><b>遇到验证码？</b></summary>
不用慌！脚本会自动暂停，面板显示黄色提示。你手动完成滑块验证后，脚本自动继续下载。
</details>

<details>
<summary><b>为什么下载的是CAJ不是PDF？</b></summary>
v8.3 版本为了追求极速下载，直接从搜索页触发下载链接，默认为 CAJ 格式。CAJ 文件可以用 <a href="https://cajviewer.cnki.net/">CAJViewer</a> 打开，也可以用第三方工具批量转 PDF。如果你必须直接下载 PDF，可以使用仓库中的 v5 旧版脚本（<code>cnki_batch_download.user.js</code>），速度会慢一些。
</details>

<details>
<summary><b>换电脑了记录丢了？</b></summary>
使用「导入已下载记录」功能，选择你的下载文件夹，自动扫描其中的 PDF/CAJ 文件名生成记录，不会重复下载。
</details>

<details>
<summary><b>中场休息不想等？</b></summary>
休息倒计时期间会出现「跳过休息，立即继续」按钮，点击即可跳过。
</details>

---

## ⚙️ 配置说明

点击面板上的 **「⚙️ 中场休息设置」** 按钮即可在面板内直接调整，无需编辑代码：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| 每N篇休息 | 50篇 | 连续下载多少篇后自动中场休息 |
| 休息最短时间 | 15秒 | 休息时长下限 |
| 休息最长时间 | 30秒 | 休息时长上限（实际随机取值） |

> 💡 如果频繁触发验证码，可以减小每N篇休息的数值，增大休息时长

---

## 📋 更新日志

### v8.3（2026-04-19）🆕
- ✅ 下载完成自动终止，随机显示趣味完成提示

### v8.2
- ✅ 中场休息可跳过：一键跳过，立即继续下载

### v8.1
- ✅ 导入已下载记录：选择本地文件夹，自动扫描生成下载记录
- ✅ 自动切换每页50条显示

### v8.0 — 架构重构
- 🏗️ **彻底重构下载架构**：放弃跨窗口DOM操作，改为直接从搜索页触发下载链接
- ✅ 新增双模式下载：顺序下载 + 勾选下载（CNKI原生勾选框）
- ✅ 自动翻页：下完一页自动翻下一页，跨页保持下载模式
- ✅ 翻页后自动重建面板（动态DOM重查询）
- ✅ 中场休息倒计时显示 + 参数面板内可配置
- ✅ 面板可拖动 + 可最小化

### v5.0（旧版，仍可用）
- 🎉 初始版本发布
- 支持 PDF 格式下载（通过打开详情页方式，速度较慢）
- 基础批量下载、断点续传、验证码暂停、已下载标绿

---

## ⚠️ 使用前提

1. **需要知网下载权限** — 通过学校VPN、图书馆入口等方式访问知网
2. **仅限个人学术研究使用**，请遵守知网使用条款
3. 建议合理设置休息间隔，避免触发反爬机制

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

> 从 v5 到 v8.3，每一次更新都来自真实使用中的痛点打磨。你的 Star 和反馈是我继续优化的动力！

---

## 📄 License

MIT License — 免费使用，随便改
