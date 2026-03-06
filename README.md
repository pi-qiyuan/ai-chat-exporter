# AI Chat Exporter

A lightweight browser extension to export AI conversations to Markdown or Text.

Stop copy-pasting your AI conversations manually! AI Chat Exporter is a lightweight, privacy-focused tool designed to help you save and organize your AI chats with one click.

Whether you are a developer building a knowledge base, a student organizing study notes, or a writer collecting inspiration, this extension makes exporting effortless.

### Features
- **ALL-IN-ONE SUPPORT**: Works on ChatGPT (chatgpt.com), Claude (claude.ai), and Gemini (gemini.google.com).
- **SMART FILENAMES**: Automatically uses chat titles as filenames and allows custom naming before download.
- **SMART COPY**: The fastest way to move chats. Optimizes clipboard content for Notion, Obsidian, Word, Google Docs, and more.
- **SELECTIVE EXPORT**: Toggle "Select Mode" to check only specific messages you want to save.
- **HIGH-FIDELITY**: Perfect conversion of code blocks (with language tags), bold text, lists, and tables. Includes clear separators (---) for readability.
- **PRIVACY FIRST**: Everything happens locally in your browser. We never collect or upload your chat history.
- **MULTILINGUAL**: Interface available in English, 中文, 日本語, 한국어, Deutsch, Français, and Español.

### Installation
[Download on Chrome Web Store](https://chromewebstore.google.com/detail/ai-chat-exporter/gnplifnbchmpeggocmkejocgldkahgnc)

### Usage
1. Open any chat on ChatGPT, Claude, or Gemini.
2. Click the "Select Messages" button below the message input box.
3. Select the messages you want to export.
4. You can export directly as a TXT file, or you can choose "Export as Markdown" or "Export as TXT".
5. Use "Smart Copy" to paste into Notion/Word, or click "Export" to download files instantly.

### Tech Stack
- Core Logic: Vanilla JavaScript
- Styling: CSS3
- Format Conversion: [Turndown](https://github.com/mixmark-io/turndown) (MIT License) — used for elegantly converting HTML to Markdown.
- Zip: [JSZip](https://stuk.github.io/jszip/) (MIT License) — used for export Image Archive.
- Capture Screenshot: [html2canvas](https://html2canvas.hertzen.com/) (MIT License) — used for export shareable image.

### Changelog
🎉 NEW IN v2.3.0: IMAGE ARCHIVE & SHAREABLE LONG IMAGES
-----------------------------------
Save more than just text! Our latest update focuses on visual preservation:
  - ✨ **EXPORT IMAGE ARCHIVE**: The best way to save AI-generated images. Downloads selected content into a complete offline package, ensuring your visuals are preserved forever.
  - ✨ **SHAREABLE LONG IMAGES**: Generate a high-quality long image of your conversation, perfectly formatted for sharing on social media or with colleagues.

#### v2.2.0: SMART FILENAME & CUSTOMIZATION
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
