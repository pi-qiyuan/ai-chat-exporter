# AI Chat Exporter

A lightweight browser extension to export AI conversations to Markdown or Text.

### Features
- **Selective Export**: Click the "Select Messages" button and check the items you want.
- **Multi-language**: English, 中文, 日本語, 한국어, Deutsch, Français, Español.
- **Privacy**: The code is open source, and all processing is done locally.

### Installation
[Download on Chrome Web Store](https://chromewebstore.google.com/detail/ai-chat-exporter/gnplifnbchmpeggocmkejocgldkahgnc)

### Usage
1. Open the AI chat web page.
2. Click the "Select Messages" button below the message input box.
3. Select the messages you want to export.
4. You can export directly as a TXT file, or you can choose "Export as Markdown" or "Export as TXT".

### Tech Stack
- Core Logic: Vanilla JavaScript
- Styling: CSS3
- Format Conversion: [Turndown](https://github.com/mixmark-io/turndown) (MIT License) — used for elegantly converting HTML to Markdown.

### Changelog
#### 🚀 v2.0.0: The Major Leap!
* **ChatGPT Support**: Full compatibility with `chatgpt.com`. Export your conversations with zero formatting loss.
* **Claude Support**: Seamlessly export chats from `claude.ai`, preserving code blocks and artifacts.

#### v1.1.0
- Added: Remember exported messages with visual indicators.
#### v1.0.0
- Initial release with Gemini support.

### Acknowledgments
- Special thanks to the [Turndown](https://github.com/mixmark-io/turndown) project. This project utilizes its MIT-licensed source code to implement the HTML-to-Markdown conversion functionality.

### License
MIT License
