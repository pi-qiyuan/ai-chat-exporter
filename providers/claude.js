(function(global) {
    const ClaudeProvider = {
        name: "Claude",
        selectors: {
            user: '[data-testid="user-message"]',
            model: '.font-claude-response'
        },
        insertButtons: (buttons) => insertButtonsInternal(buttons),
        generateChatId: (item, type) => generateChatIdInternal(item, type),
        getFilename: () => getFilenameInternal(),
        getTextContent: (context) => getTextContentInternal(context),
        getMarkdownTarget: (context) => getMarkdownTargetInternal(context),
        getCodeLanguage: (node) => getCodeLanguageInternal(node)
    };

    function insertButtonsInternal(buttons) {
        const extendedThinkingBtn = document.querySelector('button[aria-label="Extended thinking"]');
        if (!extendedThinkingBtn) {
            return false;
        }

        const container = extendedThinkingBtn.parentElement;
        if (container && container.parentNode) {
            if (container.nextSibling === buttons.selectButton) {
                return true;
            }

            container.parentNode.insertBefore(buttons.selectButton, container.nextSibling);
            container.parentNode.insertBefore(buttons.exportButton, buttons.selectButton.nextSibling);
            container.parentNode.insertBefore(buttons.moreButton, buttons.exportButton.nextSibling);
            return true;
        }

        return false;
    }

    function generateChatIdInternal (item, type) {
        const text = item.textContent ? item.textContent.trim() : "";

        if (!text) {
             const allMessages = document.querySelectorAll(type === 'user' ? ClaudeProvider.selectors.user : ClaudeProvider.selectors.model);
             const index = Array.from(allMessages).indexOf(item);
             return `claude_${type}_idx_${index}`;
        }

        const hash = Utils.simpleHash(text);
        return `claude_${type}_${hash}`;
    }

    function getFilenameInternal() {
        const titleBtn = document.querySelector('[data-testid="chat-title-button"]');
        if (titleBtn) {
            return titleBtn.textContent.trim();
        }
        return "Claude Chat";
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
            return ctx.messageContentWrapper.querySelector(".standard-markdown");
        }
        return null;
    }

    function getCodeLanguageInternal(node) {
        const pre = node.closest('pre');
        if (!pre) return '';

        const preContainer = pre.parentElement;
        if (!preContainer) return '';

        const langLabel = preContainer.previousElementSibling;
        if (langLabel && langLabel.classList.contains('text-text-500')) {
            return langLabel.textContent.trim();
        }

        return '';
    }

    global.ClaudeProvider = ClaudeProvider;
})(window);
