(function(global) {
    const GeminiProvider = {
        name: "Gemini",
        isApplicable: () => isApplicableInternal(),
        insertButtons: (buttons) => insertButtonsInternal(buttons),
        generateChatId: (item, type) => generateChatIdInternal(item, type)
    };

    function isApplicableInternal() {
        return window.location.hostname.includes('gemini.google.com');
    }

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

    global.GeminiProvider = GeminiProvider;
})(window);