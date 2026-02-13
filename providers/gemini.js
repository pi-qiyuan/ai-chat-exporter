(function(global) {
    const GeminiProvider = {
        name: "Gemini",
        selectors: {
            user: 'user-query',
            model: 'message-content',
            chatTitle: '.conversation-title',
            toolbox: 'toolbox-drawer',
            queryText: '.query-text-line',
            modelResponse: 'div[id^="model-response-message-content"]',
            tableFooter: '.table-footer.hide-from-message-actions',
            codeBlock: 'code-block',
            codeDecoration: '.code-block-decoration'
        },
        insertButtons: (buttons) => insertButtonsInternal(buttons),
        generateChatId: (item, type) => generateChatIdInternal(item, type),
        getFilename: () => getFilenameInternal(),
        getTextContent: (context) => getTextContentInternal(context),
        getMarkdownTarget: (context) => getMarkdownTargetInternal(context),
        getCodeLanguage: (node) => getCodeLanguageInternal(node)
    };

    function insertButtonsInternal(buttons) {
        const targetElement = document.querySelector(GeminiProvider.selectors.toolbox);
        if(!targetElement){
            return false;
        }

        if (targetElement.parentNode) {
            targetElement.parentNode.insertBefore(buttons.moreButton, targetElement.nextSibling);
            targetElement.parentNode.insertBefore(buttons.exportButton, targetElement.nextSibling);
            targetElement.parentNode.insertBefore(buttons.selectButton, targetElement.nextSibling);

            return true;
        }

        return false;
    }

    function generateChatIdInternal (item, type) {
        const node = type === 'user' ? item.parentElement : item;

        if (!node || typeof node.querySelectorAll !== 'function' || !type) return null;

        const elements = [node, ...Array.from(node.querySelectorAll('[jslog]'))];
        for (const el of elements) {
            const jslog = el.getAttribute('jslog');
            if (!jslog) continue;

            const id = extractGeminiIdFromJsLog(jslog, type);
            if (id) return id;
        }

        let current = node.parentElement;
        while (current) {
            const jslog = current.getAttribute('jslog');
            if (jslog) {
                const id = extractGeminiIdFromJsLog(jslog, type);
                if (id) return id;
            }
            current = current.parentElement;
        }

        return null;
    }

    function extractGeminiIdFromJsLog(jslog, type) {
        const allMatches = jslog.match(/[rc]_[a-zA-Z0-9_]+/g);
        if (allMatches && allMatches.length > 0) {
            const firstMatch = allMatches[0];
            const isInternalTrackWord = /^(c_click|c_impression|c_attention)$/.test(firstMatch);
            if (!isInternalTrackWord && (firstMatch.startsWith('r_') || firstMatch.startsWith('c_'))) {
                const r_id = allMatches.find(id => id.startsWith('r_')) || null;
                const c_id = allMatches.find(id => id.startsWith('c_')) || null;
                if (c_id && r_id) {
                    return `${type}_${c_id}_${r_id}`;
                }
            }
        }
        return null;
    }

    function getFilenameInternal() {
        return Utils.getProviderFilename(GeminiProvider.selectors.chatTitle, GeminiProvider.name);
    }

    function getTextContentInternal(ctx) {
        if (ctx.type === 'user') {
            let div = ctx.userQueryElement;
            if (div) {
                let child = div.querySelector(GeminiProvider.selectors.queryText);
                if (child) {
                    return child.textContent.trim();
                }
                return div.textContent.trim();
            }
            return "";
        } 

        if (ctx.type !== 'model') {
            return "";
        }

        const nextDiv = ctx.labelTag.nextElementSibling;
        if (!nextDiv) {
            return "";
        }

        const footers = nextDiv.querySelectorAll(GeminiProvider.selectors.tableFooter);
        const hiddenElements = [];

        footers.forEach(el => {
            hiddenElements.push({ el, originalDisplay: el.style.display });
            el.style.display = 'none';
        });

        let text = "";
        try {
            text = Utils.extractText(nextDiv);
        } finally {
            hiddenElements.forEach(item => {
                item.el.style.display = item.originalDisplay;
            });
        }
        return text;
    }

    function getMarkdownTargetInternal(ctx) {
        if (ctx.type === 'user') {
            return ctx.userQueryElement.querySelector(GeminiProvider.selectors.queryText);
        } 

        if (ctx.type === 'model') {
            const target = ctx.checkbox.closest(GeminiProvider.selectors.model).querySelector(GeminiProvider.selectors.modelResponse);
            if (target) {
                const clone = target.cloneNode(true);
                clone.querySelectorAll(GeminiProvider.selectors.tableFooter).forEach(el => el.remove());
                return clone;
            }
        }
        return null;
    }

    function getCodeLanguageInternal(node) {
        let parent = node.closest(GeminiProvider.selectors.codeBlock);
        if (!parent) return '';

        let codeDecoration = parent.querySelector(GeminiProvider.selectors.codeDecoration);
        return codeDecoration ? codeDecoration.textContent : '';
    }

    global.GeminiProvider = GeminiProvider;
})(window);