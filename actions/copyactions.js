(function(global){
    const CopyActions = {
        handleExport: (format) => {
            handleExport(format);
        }
    };

    async function handleExport(format) {
        const provider = AppState.currentProvider;
        if (provider && provider.flushPendingSnapshots) {
            provider.flushPendingSnapshots();
        }
        if (provider && provider.name !== 'ChatGPT' && provider.prepareFullExport) {
            const isReady = await provider.prepareFullExport();
            if (!isReady) return;
        }
        const selectedItems = getSelectedExportItems(provider);
        if (selectedItems.length === 0) {
            const defaultContexts = provider && provider.getDefaultExportContexts
                ? provider.getDefaultExportContexts()
                : [];

            if (defaultContexts.length > 0) {
                handleExportWithContexts(format, defaultContexts);
                return;
            }

            Utils.showToast(chrome.i18n.getMessage("noSelection"));
            AppState.inSelectMode = true;
            CheckActions.manageUserQueryCheckboxes();
            CheckActions.manageContainerCheckboxes();
            return;
        }

        if (format === 'md') {
            exportAsMarkdown(selectedItems);
        } else if (format === 'clipboard') {
            exportToClipboard(selectedItems);
        } else if (format === 'offline') {
            exportOfflineWebpage(selectedItems);
        } else if (format === 'screenshot') {
            exportAsImage(selectedItems);
        } else {
            exportAsText(selectedItems);
        }
    }

    function getSelectedExportItems(provider) {
        if (!provider) return [];

        const itemsById = new Map();
        const cachedContexts = provider && provider.getSelectedExportContexts
            ? provider.getSelectedExportContexts()
            : [];

        // ChatGPT uses DOM-independent snapshots. Export only messages that were
        // already captured in the cache; do not fall back to live DOM content.
        if (provider.name === 'ChatGPT') {
            for (const context of cachedContexts) {
                if (context && context.chatId) itemsById.set(context.chatId, context);
            }

            for (const checkbox of document.querySelectorAll('.ace-model-selector:checked')) {
                const context = getExportContext(checkbox, provider);
                if (!context || !context.chatId) continue;
                const cachedContext = itemsById.get(context.chatId);
                if (cachedContext) {
                    itemsById.set(context.chatId, { ...cachedContext, checkbox });
                }
            }

            return Array.from(itemsById.values());
        }

        for (const context of cachedContexts) {
            if (context && context.chatId) itemsById.set(context.chatId, context);
        }

        for (const checkbox of document.querySelectorAll('.ace-model-selector:checked')) {
            const context = getExportContext(checkbox, provider);
            if (!context) continue;
            // Cached snapshots are DOM-independent and retain the reconstructed order.
            const key = context.chatId || checkbox;
            const cachedContext = itemsById.get(key);
            if (cachedContext) {
                // Keep the cached content, but attach the currently visible control only
                // for this export's status update and checkbox reset.
                itemsById.set(key, { ...cachedContext, checkbox });
            } else {
                itemsById.set(key, context);
            }
        }

        return Array.from(itemsById.values());
    }

    function handleExportWithContexts(format, contexts) {
        if (format === 'md') {
            exportAsMarkdown(contexts);
        } else if (format === 'clipboard') {
            exportToClipboard(contexts);
        } else if (format === 'offline') {
            exportOfflineWebpage(contexts);
        } else if (format === 'screenshot') {
            exportAsImage(contexts);
        } else {
            exportAsText(contexts);
        }
    }

    async function exportAsText(selectedCheckboxes) {
        await processExport(selectedCheckboxes, {
            extension: 'txt',
            formatItem: (ctx) => TextFormatter.formatItem(ctx)
        });
    }

    async function exportAsMarkdown(selectedCheckboxes) {
        const turndownService = Utils.createTurndownService();

        await processExport(selectedCheckboxes, {
            extension: 'md',
            formatItem: (ctx) => MarkdownFormatter.formatItem(ctx, turndownService)
        });
    }

    async function exportToClipboard(selectedCheckboxes) {
        const turndownService = Utils.createTurndownService();
        const accumulators = {
            html: "",
            markdown: ""
        };

        await runExportSequence(
            selectedCheckboxes,
            async (context) => ClipboardFormatter.processItem(context, turndownService, accumulators),
            async () => {
                await ClipboardFormatter.finalize(accumulators);
                return true;
            }
        );
    }

    async function exportOfflineWebpage(selectedCheckboxes) {
        Utils.showToast(chrome.i18n.getMessage("exporting"));

        const zip = new JSZip();
        const imgFolder = zip.folder("images");
        const provider = AppState.currentProvider;
        let fullHtmlContent = "";
        let imageCounter = { count: 0 };

        await runExportSequence(
            selectedCheckboxes,
            async (ctx) => {
                const itemHtml = await OfflineFormatter.processItem(ctx, provider, imgFolder, imageCounter);
                if (itemHtml) {
                    fullHtmlContent += itemHtml;
                    return true;
                }
                return false;
            },
            async () => {
                return await OfflineFormatter.generateAndDownloadZip(zip, fullHtmlContent);
            }
        );
    }

    async function exportAsImage(selectedCheckboxes) {
        Utils.showToast(chrome.i18n.getMessage("exporting"));

        const container = ImageFormatter.init();
        const provider = AppState.currentProvider;

        await runExportSequence(
            selectedCheckboxes,
            async (ctx) => {
                return await ImageFormatter.processItem(container, ctx, provider);
            },
            async () => {
                await ImageFormatter.finalize(container);
                return true;
            }
        );
    }

    async function runExportSequence(selectedItems, itemProcessor, postProcessor) {
        const chatIdsToSave = {};
        const provider = AppState.currentProvider;
        if (!provider) return;

        let hasContent = false;

        try {
            for (const selectedItem of selectedItems) {
                const context = selectedItem && selectedItem.__aceExportContext
                    ? selectedItem
                    : getExportContext(selectedItem, provider);
                if (!context) continue;

                const result = await itemProcessor(context);
                if (result) {
                    hasContent = true;
                    if (context.chatId) {
                        chatIdsToSave[context.chatId] = true;
                    }
                }
            }

            if (hasContent && postProcessor) {
                const postResult = await postProcessor();
                if (postResult === false) {
                    return; 
                }
            }

            if (hasContent && Object.keys(chatIdsToSave).length > 0) {
                await StorageManager.saveChatIds(chatIdsToSave);
                updateExportStatus(selectedItems);
            }

            if (hasContent) {
                if (provider.clearSelectedExportContexts) {
                    provider.clearSelectedExportContexts(selectedItems);
                }
                selectedItems.forEach(item => {
                    const checkbox = item && item.__aceExportContext ? item.checkbox : item;
                    if (checkbox && typeof checkbox.checked === 'boolean') {
                        checkbox.checked = false;
                    }
                });
            }
        } catch (error) {
            Utils.showToast("Export failed: " + error.message);
        }
    }

    function getExportContext(checkbox, provider) {
        const labelTag = checkbox.closest('.ace-model-label-tag');
        if (!labelTag) return null;

        let userQueryElement = null;
        let messageContentWrapper = null;

        let type = "";
        if (provider.name === 'ChatGPT') {
            if (labelTag.classList.contains('ace-checkbox-user')) {
                type = 'user';
                userQueryElement = labelTag.nextElementSibling;
            } else {
                type = 'model';
                messageContentWrapper = labelTag.parentElement;
            }
        } else {
            userQueryElement = labelTag.parentElement.querySelector(provider.selectors.user);
            if (labelTag.classList.contains('ace-checkbox-user')) {
                 userQueryElement = labelTag.nextElementSibling;
            } else {
                 messageContentWrapper = labelTag.parentElement;
            }

            if (userQueryElement) {
                type = "user";
            } else if (messageContentWrapper) {
                type = "model";
            }
        }

        let chatId = null;
        if (type === "user") {
            chatId = StorageManager.generateChatId(userQueryElement, type);
        } else {
            chatId = StorageManager.generateChatId(messageContentWrapper, type);
        }

        return {
            __aceExportContext: true,
            checkbox,
            labelTag,
            userQueryElement,
            messageContentWrapper,
            type,
            chatId
        };
    }

    function updateExportStatus(selectedCheckboxes) {
        const exportedText = chrome.i18n.getMessage("exportedTag");
        for (const item of selectedCheckboxes) {
            const checkbox = item && item.__aceExportContext ? item.checkbox : item;
            if (!checkbox || !checkbox.closest) continue;

            const labelTag = checkbox.closest('.ace-model-label-tag');
            if (labelTag) {
                const statusSpan = labelTag.querySelector('.ace-exported-status');
                if (statusSpan && statusSpan.innerText !== exportedText) {
                    statusSpan.innerText = exportedText;
                }
            }
        }
    }

    async function processExport(selectedCheckboxes, options) {
        const { extension, formatItem } = options;
        let finalContent = "";

        await runExportSequence(
            selectedCheckboxes,
            async (context) => {
                const itemContent = formatItem(context);
                if (itemContent) {
                    finalContent += itemContent;
                    return true;
                }
                return false;
            },
            async () => {
                const footerText = Utils.getExportFooter();

                finalContent += footerText + '\n';

                const defaultFilename = Utils.getFilename() + "." + extension;
                const newFilename = await Utils.showFilenamePrompt(defaultFilename);
                if (newFilename) {
                    Utils.downloadText(finalContent, newFilename);
                    return true;
                }
                return false;
            }
        );
    }

    global.CopyActions = CopyActions;
})(window);
