(function(global) {
    const STORAGE_KEY = 'exported_ids';

    const StorageManager = {
        generateGeminiId: (node, type) => generateGeminiIdInternal(node, type),
        isIdExported: (geminiId) => isIdExportedInternal(geminiId),
        saveGeminiIds: (newIdsMap) => saveGeminiIdsInternal(newIdsMap),
        getSavedIds: () => getSavedIdsInternal(),
        removeGeminiIds: (idsToRemove) => removeGeminiIdsInternal(idsToRemove)
    };

    function generateGeminiIdInternal(node, type) {
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

    async function isIdExportedInternal(geminiId) {
        if (!geminiId) return false;
        try {
            const result = await chrome.storage.local.get(STORAGE_KEY);
            const existingIds = result[STORAGE_KEY] || {};
            return !!existingIds[geminiId];
        } catch (error) {
            return false;
        }
    }

    async function saveGeminiIdsInternal(newIdsMap) {
        if (!newIdsMap || Object.keys(newIdsMap).length === 0) return;
        try {
            const result = await chrome.storage.local.get(STORAGE_KEY);
            const existingIds = result[STORAGE_KEY] || {};
            const updatedIds = { ...existingIds, ...newIdsMap };
            await chrome.storage.local.set({ [STORAGE_KEY]: updatedIds });
        } catch (error) {
        }
    }

    async function getSavedIdsInternal() {
        try {
            const result = await chrome.storage.local.get(STORAGE_KEY);
            return result[STORAGE_KEY] || {};
        } catch (error) {
            return {};
        }
    }

    async function removeGeminiIdsInternal(idsToRemove) {
        try {
            if (!idsToRemove) {
                await chrome.storage.local.remove(STORAGE_KEY);
            } else {
                const result = await chrome.storage.local.get(STORAGE_KEY);
                const existingIds = result[STORAGE_KEY] || {};
                
                let hasChanges = false;
                for (const id of idsToRemove) {
                    if (existingIds[id]) {
                        delete existingIds[id];
                        hasChanges = true;
                    }
                }

                if (hasChanges) {
                    await chrome.storage.local.set({ [STORAGE_KEY]: existingIds });
                }
            }
        } catch (error) {
        }
    }

    global.StorageManager = StorageManager;
})(window);