(function(global){
    const CopyActions = {
        handleExport: (format) => {
            handleExport(format);
        }
    };

    function handleExport(format) {
        const selectedCheckboxes = document.querySelectorAll('.ace-model-selector:checked');
        if (selectedCheckboxes.length === 0) {
            Utils.showToast(chrome.i18n.getMessage("noSelection"));
            AppState.inSelectMode = true;
            CheckActions.manageUserQueryCheckboxes();
            CheckActions.manageContainerCheckboxes();
            return;
        }

        if (format === 'md') {
            exportAsMarkdown(selectedCheckboxes);
        } else if (format === 'clipboard') {
            exportToClipboard(selectedCheckboxes);
        } else if (format === 'offline') {
            exportOfflineWebpage(selectedCheckboxes);
        } else if (format === 'screenshot') {
            exportAsImage(selectedCheckboxes);
        } else {
            exportAsText(selectedCheckboxes);
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
            async () => ClipboardFormatter.finalize(accumulators)
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
                await OfflineFormatter.generateAndDownloadZip(zip, fullHtmlContent);
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
            }
        );
    }

    async function runExportSequence(selectedCheckboxes, itemProcessor, postProcessor) {
        const chatIdsToSave = {};
        const provider = AppState.currentProvider;
        if (!provider) return;

        let hasContent = false;

        try {
            for (const checkbox of selectedCheckboxes) {
                const context = getExportContext(checkbox, provider);
                if (!context) continue;

                if (context.chatId) {
                    chatIdsToSave[context.chatId] = true;
                }

                const result = await itemProcessor(context);
                if (result) {
                    hasContent = true;
                }
            }

            if (Object.keys(chatIdsToSave).length > 0) {
                await StorageManager.saveChatIds(chatIdsToSave);
                updateExportStatus(selectedCheckboxes);
            }

            if (hasContent && postProcessor) {
                await postProcessor();
                selectedCheckboxes.forEach(cb => cb.checked = false);
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

        userQueryElement = labelTag.parentElement.querySelector(provider.selectors.user);
        if (labelTag.classList.contains('ace-checkbox-user')) {
             userQueryElement = labelTag.nextElementSibling;
        } else {
             messageContentWrapper = labelTag.parentElement; 
        }

        let type = "";
        if (userQueryElement) {
            type = "user";
        } else if (messageContentWrapper) {
            type = "model";
        }

        let chatId = null;
        if (type === "user") {
            chatId = StorageManager.generateChatId(userQueryElement, type);
        } else {
            chatId = StorageManager.generateChatId(messageContentWrapper, type);
        }

        return {
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
        for (const checkbox of selectedCheckboxes) {
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
                Utils.showFilenamePrompt(defaultFilename, (newFilename) => {
                    Utils.downloadText(finalContent, newFilename);
                });
            }
        );
    }

    global.CopyActions = CopyActions;
})(window);