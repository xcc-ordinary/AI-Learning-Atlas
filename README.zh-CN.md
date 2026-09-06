# AI Learning Atlas

面向 Microsoft [AI for Beginners](https://github.com/microsoft/AI-For-Beginners) 的 Obsidian 原生可视化自主学习插件。

## 功能

- 学习总览、12 周路线和 24 课进度追踪
- 从真实 Markdown 标题自动生成每课分目录
- 点击目录直接跳到教材对应位置
- 教材与个人笔记并排学习
- 原子概念双链和逐步点亮的知识图谱
- 在界面中直接翻译选区或整篇课程
- 支持 DeepSeek、Kimi 和 OpenAI 兼容接口，密钥保存在 Obsidian 安全凭据中

## 使用 BRAT 安装（推荐）

使用 BRAT 后只需添加一次仓库；以后本插件发布新版本时，BRAT 可以检查并安装更新。

1. 在 Obsidian 的“第三方插件市场”安装并启用 **BRAT**。
2. 打开 BRAT 设置，点击 **Add Beta plugin**。
3. 输入仓库地址：

   ```text
   https://github.com/xcc-ordinary/AI-Learning-Atlas
   ```

4. 选择不锁定版本的安装方式，并启用 **AI Learning Atlas**。
5. 后续在 BRAT 中执行 **Check for updates**，即可获取最新 Release；也可以在 BRAT 设置中开启启动时检查更新。

> 不要选择 frozen version，否则 BRAT 会固定在指定版本，不会跟随更新。

## 手动安装

1. 从[最新 Release](https://github.com/xcc-ordinary/AI-Learning-Atlas/releases/latest) 下载 `main.js`、`manifest.json`、`styles.css`。
2. 在 Vault 中创建 `.obsidian/plugins/ai-learning-atlas/`。
3. 将三个文件放入该目录。
4. 完全重启 Obsidian，在“第三方插件”中启用 **AI Learning Atlas**。

为了获得完整课程体验，请克隆 AI for Beginners，并将仓库根目录作为 Obsidian Vault 打开：

```bash
git clone https://github.com/microsoft/AI-For-Beginners.git
```

## 隐私

AI 翻译默认关闭。插件只会把你主动要求翻译的内容发送给所配置的服务商，API Key 通过 Obsidian 安全凭据保存。

## 开发

```bash
npm install
npm test
npm run build
npm run check:release
```

## 许可

MIT
