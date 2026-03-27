(function(global) {
    const STORAGE_KEY = 'exported_ids';
    let exportedIdsCache = null;

    const StorageManager = {
        generateChatId: (item, type) => generateChatIdInternal(item, type),
        isIdExported: (chatId) => isIdExportedInternal(chatId),
        saveChatIds: (newIdsMap) => saveChatIdsInternal(newIdsMap),
        getSavedIds: () => getSavedIdsInternal(),
        removeChatIds: (idsToRemove) => removeChatIdsInternal(idsToRemove)
    };

    function generateChatIdInternal(item, type) {
        if (AppState.currentProvider && AppState.currentProvider.generateChatId) {
            return AppState.currentProvider.generateChatId(item, type);
        }
        return null;
    }

    async function ensureCache() {
        if (exportedIdsCache === null) {
            try {
                const result = await chrome.storage.local.get(STORAGE_KEY);
                exportedIdsCache = result[STORAGE_KEY] || {};
            } catch (error) {
                exportedIdsCache = {};
            }
        }
        return exportedIdsCache;
    }

    async function isIdExportedInternal(chatId) {
        if (!chatId) return false;
        const cache = await ensureCache();
        return !!cache[chatId];
    }

    async function saveChatIdsInternal(newIdsMap) {
        if (!newIdsMap || Object.keys(newIdsMap).length === 0) return;
        const cache = await ensureCache();
        Object.assign(cache, newIdsMap);
        try {
            await chrome.storage.local.set({ [STORAGE_KEY]: cache });
        } catch (error) {
        }
    }

    async function getSavedIdsInternal() {
        return await ensureCache();
    }

    async function removeChatIdsInternal(idsToRemove) {
        try {
            if (!idsToRemove) {
                exportedIdsCache = {};
                await chrome.storage.local.remove(STORAGE_KEY);
            } else {
                const cache = await ensureCache();
                let hasChanges = false;
                for (const id of idsToRemove) {
                    if (cache[id]) {
                        delete cache[id];
                        hasChanges = true;
                    }
                }

                if (hasChanges) {
                    await chrome.storage.local.set({ [STORAGE_KEY]: cache });
                }
            }
        } catch (error) {
        }
    }

    global.StorageManager = StorageManager;
})(window);