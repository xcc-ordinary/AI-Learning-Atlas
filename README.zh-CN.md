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

## 安装

1. 从最新 Release 下载 `main.js`、`manifest.json`、`styles.css`。
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
