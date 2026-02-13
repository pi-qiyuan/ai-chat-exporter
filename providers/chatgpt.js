(function(global) {
    const ChatGPTProvider = {
        name: "ChatGPT",
        selectors: {
            user: 'div[data-message-author-role="user"]',
            model: 'div.flex.max-w-full.flex-col.grow',
            chatForm: 'form.group\\/composer.w-full',
            chatTitle: 'a[data-active]',
            markdownContent: 'div[class^="markdown"],div.relative.w-full.text-start',
            codeBlock: 'code[class*="whitespace-pre!"][class*="language-"]'
        },
        insertButtons: (buttons) => insertButtonsInternal(buttons),
        generateChatId: (item, type) => generateChatIdInternal(item, type),
        getFilename: () => getFilenameInternal(),
        getTextContent: (context) => getTextContentInternal(context),
        getMarkdownTarget: (context) => getMarkdownTargetInternal(context),
        getCodeLanguage: (node) => getCodeLanguageInternal(node)
    };

    function insertButtonsInternal(buttons) {
        const chatgptForm = document.querySelector(ChatGPTProvider.selectors.chatForm);
        if (!chatgptForm) {
            return false;
        }
        chatgptForm.classList.add('ace-chatgpt-chatform');

        const container = document.createElement('div');
        container.className = 'ace-chatgpt-container'; 

        chatgptForm.appendChild(container);
        container.appendChild(buttons.selectButton);
        container.appendChild(buttons.exportButton);
        container.appendChild(buttons.moreButton);

        return true;
    }

    function generateChatIdInternal(item, type) {
        const key = 'data-turn-id';
        const el = item.closest(`[${key}]`);
        if (!el) {
            return null;
        }

        const data_message_id = el.getAttribute(key);
        return `${type}_${data_message_id}`;
    }

    function getFilenameInternal() {
        return Utils.getProviderFilename(ChatGPTProvider.selectors.chatTitle, ChatGPTProvider.name);
    }

    function getTextContentInternal(ctx) {
        if (ctx.type === 'user') {
            return ctx.userQueryElement.textContent;
        } 

        if (ctx.type === 'model') {
            const nextDiv = ctx.labelTag.nextElementSibling;
            return nextDiv ? nextDiv.textContent : "";
        }

        return "";
    }

    function getMarkdownTargetInternal(ctx) {
        if (ctx.type === 'user') {
            return ctx.userQueryElement;
        } else if (ctx.type === 'model') {
            return ctx.checkbox.closest(ChatGPTProvider.selectors.model).querySelector(ChatGPTProvider.selectors.markdownContent);
        }
        return null;
    }

    function getCodeLanguageInternal(node) {
        const codeDiv = node.querySelector(ChatGPTProvider.selectors.codeBlock);
        if (!codeDiv) return '';

        const langClass = Array.from(codeDiv.classList).find(c => c.startsWith('language-'));
        return langClass ? langClass.replace('language-', '') : '';
    }

    global.ChatGPTProvider = ChatGPTProvider;
})(window);
