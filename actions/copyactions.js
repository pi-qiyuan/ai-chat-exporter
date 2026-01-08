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

        if (format == 'md') {
            exportAsMarkdown(selectedCheckboxes);
        } else {
            exportAsText(selectedCheckboxes);
        }
    }

    async function processExport(selectedCheckboxes, options) {
        const { extension, formatItem } = options;

        let finalContent = "";
        const chatIdsToSave = {};
        const provider = AppState.currentProvider;
        if (!provider) return;

        try {
            for (const checkbox of selectedCheckboxes) {
                const labelTag = checkbox.closest('.ace-model-label-tag');
                if (!labelTag) continue;

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

                if (chatId) {
                    chatIdsToSave[chatId] = true;
                }

                const context = {
                    checkbox,
                    labelTag,
                    userQueryElement,
                    messageContentWrapper,
                    type
                };

                const itemContent = formatItem(context);
                if (itemContent) {
                    finalContent += itemContent;
                }
            }

            if (Object.keys(chatIdsToSave).length > 0) {
                await StorageManager.saveChatIds(chatIdsToSave);

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

            if (finalContent) {
                Utils.downloadText(finalContent, getFilename() + "." + extension);
                selectedCheckboxes.forEach(cb => cb.checked = false);
            }
        } catch (error) {
        }
    }

    async function exportAsText(selectedCheckboxes) {
        let modelName = AppState.currentProvider ? AppState.currentProvider.name : 'AI';

        await processExport(selectedCheckboxes, {
            extension: 'txt',
            formatItem: (ctx) => {
                let typeName = "";
                let text = "";

                if (ctx.type === 'user') {
                    typeName = `${chrome.i18n.getMessage("userHeader")}:`;
                } else if (ctx.type === 'model') {
                    typeName = `${modelName}:`;
                }
                
                if (AppState.currentProvider) {
                    text = AppState.currentProvider.getTextContent(ctx);
                }

                if (typeName && text) {
                    return `${typeName}\n${text}\n\n`;
                }
                return "";
            }
        });
    }

    async function exportAsMarkdown(selectedCheckboxes) {
        const turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced'
        });

        turndownService.addRule('fencedCodeBlock', {
            filter: function (node, options) {
                return (
                    options.codeBlockStyle === 'fenced' &&
                    node.nodeName === 'PRE' &&
                    node.querySelector('code')
                );
            },
            replacement: function (_content, node, options) {
                let language = '';
                if (AppState.currentProvider && AppState.currentProvider.getCodeLanguage) {
                    language = AppState.currentProvider.getCodeLanguage(node);
                }

                const codeElement = node.querySelector('code');
                return (
                    '\n\n' + options.fence + language + '\n' +
                    codeElement.textContent +
                    '\n' + options.fence + '\n\n'
                );
            }
        });

        await processExport(selectedCheckboxes, {
            extension: 'md',
            formatItem: (ctx) => {
                let sectionHeader = "";
                let target = null;
                const provider = AppState.currentProvider;

                if (ctx.type === 'user') {
                    sectionHeader = `## ${chrome.i18n.getMessage("userHeader")}\n`;
                } else if (ctx.type === 'model') {
                    sectionHeader = `## ${provider ? provider.name : 'AI'}\n`;
                }

                if (provider && provider.getMarkdownTarget) {
                    target = provider.getMarkdownTarget(ctx);
                }

                if (target) {
                    let md = turndownService.turndown(target.innerHTML);
                    return `${sectionHeader}${md}\n\n`;
                }
                return "";
            }
        });
    }

    function getFilename() {
        if (AppState.currentProvider && AppState.currentProvider.getFilename) {
            return AppState.currentProvider.getFilename();
        }
        return "Export";
    }

    global.CopyActions = CopyActions;
})(window);
