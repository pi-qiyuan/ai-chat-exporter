# AI聊天导出器

一个轻量级的浏览器插件，支持将 Gemini 的对话导出为 Markdown 或纯文本。

### 功能
- **选择性导出**: 点击“选择对话”按钮，勾选你想要的内容。
- **多语言支持**: English, 中文, 日本語, 한국어, Deutsch, Français, Español.
- **隐私安全**: 代码开源，所有处理均在本地完成。

### 安装
[从 Chrome Web Store 下载](https://chromewebstore.google.com/detail/ai-chat-exporter/gnplifnbchmpeggocmkejocgldkahgnc)

### 使用方法
1. 打开 Gemini 聊天页面。
2. 点击消息输入框下方的“选择对话”按钮。
3. 勾选需要导出的消息。
4. 直接导出为 TXT 文件，或者也可以选择“导出为 Markdown”或“导出为 TXT”。

### 技术栈
- 核心逻辑: 原生JavaScript
- 样式处理: CSS3
- 格式转换: [Turndown](https://github.com/mixmark-io/turndown) (MIT License) - 负责将 HTML 优雅地转换为 Markdown。

### 致谢
- 感谢 [Turndown](https://github.com/mixmark-io/turndown) 项目，本项目使用其提供的 MIT 协议代码实现 HTML 到 Markdown 的转换。

### 开源协议
MIT License
