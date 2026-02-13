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
- Zip: [JSZip](https://stuk.github.io/jszip/) (MIT License) — used for export Image Archive.
- Capture Screenshot: [html2canvas](https://html2canvas.hertzen.com/) (MIT License) — used for export shareable image.

### Changelog
🎉 NEW IN v2.2.0: SMART FILENAME & CUSTOMIZATION
-----------------------------------
We've made organizing your exports even easier with our latest update:
  - **✨ SMART TOPIC DETECTION**: Automatically uses the chat conversation title as the default filename, saving you from renaming files manually.
  - **✨ CUSTOM FILENAMES**: A new prompt allows you to review and modify the filename before downloading, ensuring your files are named exactly how you want.

#### v2.1.0 Update: Features the new Smart Copy (Markdown & Rich Text)
  - **✨ New Feature**: Smart Copy (supports Markdown for Notion/Obsidian & Rich Text for Word/Google Docs).
  - **✨ Improvement**: Added `---` separators between messages for better readability.

#### v2.0.0: The Major Leap!
* **ChatGPT Support**: Full compatibility with `chatgpt.com`. Export your conversations with zero formatting loss.
* **Claude Support**: Seamlessly export chats from `claude.ai`, preserving code blocks and artifacts.

#### v1.1.0
- Added: Remember exported messages with visual indicators.
#### v1.0.0
- Initial release with Gemini support.

### License
MIT License
