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

        try {
            for (const checkbox of selectedCheckboxes) {
                const labelTag = checkbox.closest('.ace-model-label-tag');
                if (!labelTag) continue;

                let userQueryElement = null;
                let messageContentWrapper = null;

                if (GeminiProvider.isApplicable()) {
                    userQueryElement = labelTag.parentElement.querySelector('user-query');
                    messageContentWrapper = labelTag.closest('message-content');
                } else if (ChatGPTProvider.isApplicable()) {
                    userQueryElement = labelTag.parentElement.querySelector('div[data-message-author-role="user"]');
                    messageContentWrapper = labelTag.parentElement.querySelector('div');
                }

                let type = "";
                if (userQueryElement && labelTag.parentElement.contains(userQueryElement)) {
                    type = "user";
                } else if (messageContentWrapper) {
                    type = "model";
                }

                let chatId = null;
                if (GeminiProvider.isApplicable()) {
                    chatId = StorageManager.generateChatId(labelTag, type);
                } else if (ChatGPTProvider.isApplicable()) {
                    chatId = StorageManager.generateChatId(type == "user" ? userQueryElement : labelTag.parentElement, type);
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
        let modelName = '';
        if (GeminiProvider.isApplicable()) {
            modelName = GeminiProvider.name;
        } else if (ChatGPTProvider.isApplicable()) {
            modelName = ChatGPTProvider.name;
        }

        await processExport(selectedCheckboxes, {
            extension: 'txt',
            formatItem: (ctx) => {
                let typeName = "";
                let text = "";

                if (ctx.type === 'user') {
                    typeName = `${chrome.i18n.getMessage("userHeader")}:`;
                    text = ctx.userQueryElement.textContent;
                } else if (ctx.type === 'model') {
                    typeName = `${modelName}:`;
                    const nextDiv = ctx.labelTag.nextElementSibling;
                    text = nextDiv ? nextDiv.textContent : "";
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

                if (GeminiProvider.isApplicable()) {
                    let parent = node.closest('code-block');
                    let codeDecoration = parent.querySelector('.code-block-decoration');
                    if (codeDecoration) {
                        language = codeDecoration.textContent;
                    }
                } else if (ChatGPTProvider.isApplicable()) {
                    const codeDiv = node.querySelector('code[class*="whitespace-pre!"][class*="language-"]');
                    if (codeDiv) {
                        const langClass = Array.from(codeDiv.classList).find(c => c.startsWith('language-'));
                        if (langClass) {
                            language = langClass.replace('language-', '');
                        }
                    }
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

                if (ctx.type === 'user') {
                    sectionHeader = `## ${chrome.i18n.getMessage("userHeader")}\n`;
                    if (GeminiProvider.isApplicable()) {
                        target = ctx.userQueryElement.querySelector('.query-text');
                    } else if (ChatGPTProvider.isApplicable()) {
                        target = ctx.userQueryElement;
                    }
                } else if (ctx.type === 'model') {
                    if (GeminiProvider.isApplicable()) {
                        sectionHeader = `## ${GeminiProvider.name}\n`;
                        target = ctx.checkbox.closest('message-content').querySelector('div[id^="model-response-message-content"]');
                    } else if (ChatGPTProvider.isApplicable()) {
                        sectionHeader = `## ${ChatGPTProvider.name}\n`;
                        target = ctx.checkbox.closest('div[data-message-author-role="assistant"]').querySelector('div[class^="markdown"]');
                    }
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
        if (GeminiProvider.isApplicable()) {
            let div = document.querySelector('.conversation-title');
            if (div) {
                return div.textContent;
            }
            return GeminiProvider.name;
        } else if (ChatGPTProvider.isApplicable()) {
            let div = document.querySelector('a[data-active]');
            if (div) {
                return div.textContent;
            }
            return ChatGPTProvider.name;
        }

        return "";
    }

    global.CopyActions = CopyActions;
})(window);
