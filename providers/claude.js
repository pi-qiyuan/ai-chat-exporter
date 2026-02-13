(function(global) {
    const ClaudeProvider = {
        name: "Claude",
        selectors: {
            user: '[data-testid="user-message"]',
            model: '.font-claude-response',
            chatTitle: '[data-testid="chat-title-button"]',
            extendedThinking: 'button[aria-label="Toggle menu"]',
            markdownContent: '.standard-markdown',
            codeLangLabel: '.text-text-500'
        },
        insertButtons: (buttons) => insertButtonsInternal(buttons),
        generateChatId: (item, type) => generateChatIdInternal(item, type),
        getFilename: () => getFilenameInternal(),
        getTextContent: (context) => getTextContentInternal(context),
        getMarkdownTarget: (context) => getMarkdownTargetInternal(context),
        getCodeLanguage: (node) => getCodeLanguageInternal(node)
    };

    function insertButtonsInternal(buttons) {
        const extendedThinkingBtn = document.querySelector(ClaudeProvider.selectors.extendedThinking);
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

    function generateChatIdInternal(item, type) {
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
        return Utils.getProviderFilename(ClaudeProvider.selectors.chatTitle, ClaudeProvider.name);
    }

    function getTextContentInternal(ctx) {
        if (ctx.type === 'user') {
            return ctx.userQueryElement.textContent;
        } 

        if (ctx.type === 'model') {
            const children = Array.from(ctx.labelTag.parentElement.children);
            return children
                .slice(1) 
                .map(child => child.textContent.trim())
                .join('\n\n');
        }

        return "";
    }

    function getMarkdownTargetInternal(ctx) {
        if (ctx.type === 'user') {
            return ctx.userQueryElement;
        } else if (ctx.type === 'model') {
            const markdowns = ctx.messageContentWrapper.querySelectorAll(ClaudeProvider.selectors.markdownContent);
            if (markdowns.length === 0) return null;

            const container = document.createElement("div");
            container.className = "markdown-wrapper-container";

            markdowns.forEach(el => {
                container.appendChild(el.cloneNode(true));
            });

            return container;
        }
        return null;
    }

    function getCodeLanguageInternal(node) {
        const pre = node.closest('pre');
        if (!pre) return '';

        const preContainer = pre.parentElement;
        if (!preContainer) return '';

        const langLabel = preContainer.previousElementSibling;
        if (langLabel && langLabel.classList.contains(ClaudeProvider.selectors.codeLangLabel.replace('.', ''))) {
            return langLabel.textContent.trim();
        }

        return '';
    }

    global.ClaudeProvider = ClaudeProvider;
})(window);
