(function(global) {
    const ChatGPTProvider = {
        name: "ChatGPT",
        selectors: {
            user: 'div[data-message-author-role="user"]',
            model: 'div[data-message-author-role="assistant"]'
        },
        insertButtons: (buttons) => insertButtonsInternal(buttons),
        generateChatId: (item, type) => generateChatIdInternal(item, type),
        getFilename: () => getFilenameInternal(),
        getTextContent: (context) => getTextContentInternal(context),
        getMarkdownTarget: (context) => getMarkdownTargetInternal(context),
        getCodeLanguage: (node) => getCodeLanguageInternal(node)
    };

    function insertButtonsInternal(buttons) {
        const chatgptForm = document.querySelector('form.group\\/composer.w-full');
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
        let data_message_id = item.getAttribute('data-message-id');
        if (!data_message_id) {
            return null;
        }

        return `${type}_${data_message_id}`;
    }

    function getFilenameInternal() {
        let div = document.querySelector('a[data-active]');
        if (div) {
            return div.textContent;
        }
        return ChatGPTProvider.name;
    }

    function getTextContentInternal(ctx) {
        if (ctx.type === 'user') {
            return ctx.userQueryElement.textContent;
        } else if (ctx.type === 'model') {
            const nextDiv = ctx.labelTag.nextElementSibling;
            return nextDiv ? nextDiv.textContent : "";
        }
        return "";
    }

    function getMarkdownTargetInternal(ctx) {
        if (ctx.type === 'user') {
            return ctx.userQueryElement;
        } else if (ctx.type === 'model') {
            return ctx.checkbox.closest('div[data-message-author-role="assistant"]').querySelector('div[class^="markdown"]');
        }
        return null;
    }

    function getCodeLanguageInternal(node) {
        const codeDiv = node.querySelector('code[class*="whitespace-pre!"][class*="language-"]');
        if (codeDiv) {
            const langClass = Array.from(codeDiv.classList).find(c => c.startsWith('language-'));
            if (langClass) {
                return langClass.replace('language-', '');
            }
        }
        return '';
    }

    global.ChatGPTProvider = ChatGPTProvider;
})(window);
