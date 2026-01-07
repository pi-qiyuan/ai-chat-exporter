(function(global) {
    const STORAGE_KEY = 'exported_ids';

    const StorageManager = {
        generateChatId: (item, type) => generateChatIdInternal(item, type),
        isIdExported: (chatId) => isIdExportedInternal(chatId),
        saveChatIds: (newIdsMap) => saveChatIdsInternal(newIdsMap),
        getSavedIds: () => getSavedIdsInternal(),
        removeChatIds: (idsToRemove) => removeChatIdsInternal(idsToRemove)
    };

    function generateChatIdInternal(item, type) {
        if (GeminiProvider.isApplicable()) {
            return GeminiProvider.generateChatId(item, type);
        }

        if (ChatGPTProvider.isApplicable()) {
            return ChatGPTProvider.generateChatId(item, type);
        }
    }

    async function isIdExportedInternal(chatId) {
        if (!chatId) return false;
        try {
            const result = await chrome.storage.local.get(STORAGE_KEY);
            const existingIds = result[STORAGE_KEY] || {};
            return !!existingIds[chatId];
        } catch (error) {
            return false;
        }
    }

    async function saveChatIdsInternal(newIdsMap) {
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

    async function removeChatIdsInternal(idsToRemove) {
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