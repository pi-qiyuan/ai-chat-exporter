(function(global) {
    const GeminiProvider = {
        name: "Gemini",
        selectors: {
            user: 'user-query',
            model: 'message-content'
        },
        insertButtons: (buttons) => insertButtonsInternal(buttons),
        generateChatId: (item, type) => generateChatIdInternal(item, type),
        getFilename: () => getFilenameInternal(),
        getTextContent: (context) => getTextContentInternal(context),
        getMarkdownTarget: (context) => getMarkdownTargetInternal(context),
        getCodeLanguage: (node) => getCodeLanguageInternal(node)
    };

    function insertButtonsInternal(buttons) {
        const targetElement = document.querySelector('toolbox-drawer');
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

        const extractId = (jslog) => {
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
        };

        const elements = [node, ...Array.from(node.querySelectorAll('[jslog]'))];
        for (const el of elements) {
            const jslog = el.getAttribute('jslog');
            if (!jslog) continue;

            const id = extractId(jslog);
            if (id) return id;
        }

        let current = node.parentElement;
        while (current) {
            const jslog = current.getAttribute('jslog');
            if (jslog) {
                const id = extractId(jslog);
                if (id) return id;
            }
            current = current.parentElement;
        }

        return null;
    }

    function getFilenameInternal() {
        let div = document.querySelector('.conversation-title');
        if (div) {
            return div.textContent;
        }
        return GeminiProvider.name;
    }

    function getTextContentInternal(ctx) {
        if (ctx.type === 'user') {
            return ctx.userQueryElement.textContent;
        } 

        if (ctx.type !== 'model') {
            return "";
        }

        const nextDiv = ctx.labelTag.nextElementSibling;
        if (!nextDiv) {
            return "";
        }

        const footers = nextDiv.querySelectorAll('.table-footer.hide-from-message-actions');
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
            return ctx.userQueryElement.querySelector('.query-text');
        } 

        if (ctx.type === 'model') {
            const target = ctx.checkbox.closest('message-content').querySelector('div[id^="model-response-message-content"]');
            if (target) {
                const clone = target.cloneNode(true);
                clone.querySelectorAll('.table-footer.hide-from-message-actions').forEach(el => el.remove());
                return clone;
            }
        }
        return null;
    }

    function getCodeLanguageInternal(node) {
        let parent = node.closest('code-block');
        if (!parent) return '';

        let codeDecoration = parent.querySelector('.code-block-decoration');
        return codeDecoration ? codeDecoration.textContent : '';
    }

    global.GeminiProvider = GeminiProvider;
})(window);