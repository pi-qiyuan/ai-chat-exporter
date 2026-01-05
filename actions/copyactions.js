(function(global){
    const CopyActions = {
        handleExport: (format) => {
            handleExport(format);
        }
    };

    const SnackbarManager = {
        styleId: 'silent-copy-style',

        disableNotifications: function() {
            if (document.getElementById(this.styleId)) return;

            const style = document.createElement('style');
            style.id = this.styleId;
            style.innerHTML = `
                .cdk-overlay-container,
                .cdk-global-overlay-wrapper,
                .mat-mdc-snack-bar-container {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                }
            `;
            document.head.appendChild(style);
        },

        enableNotifications: function(delay = 3000) {
            setTimeout(() => {
                const style = document.getElementById(this.styleId);
                if (style) {
                    style.remove();
                }
            }, delay);
        }
    };

    function handleExport(format) {
        const selectedCheckboxes = document.querySelectorAll('.ace-model-selector:checked');
        if (selectedCheckboxes.length === 0) {
            Utils.showToast(chrome.i18n.getMessage("noSelection"));
            inSelectMode = true;
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
        const { extension, formatItem, onStart, onEnd } = options;
        if (onStart) onStart();

        let finalContent = "";
        const geminiIdsToSave = {};

        try {
            for (const checkbox of selectedCheckboxes) {
                const labelTag = checkbox.closest('.ace-model-label-tag');
                if (!labelTag) continue;

                const userQueryElement = labelTag.parentElement.querySelector('user-query');
                const messageContentWrapper = labelTag.closest('message-content');
                
                let type = "";
                if (userQueryElement && labelTag.parentElement.contains(userQueryElement)) {
                    type = "user";
                } else if (messageContentWrapper) {
                    type = "model";
                }

                const geminiId = StorageManager.generateGeminiId(labelTag.parentElement, type);
                if (geminiId) {
                    geminiIdsToSave[geminiId] = true;
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

            if (Object.keys(geminiIdsToSave).length > 0) {
                await StorageManager.saveGeminiIds(geminiIdsToSave);

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
        } finally {
            if (onEnd) onEnd();
        }
    }

    async function exportAsText(selectedCheckboxes) {
        await processExport(selectedCheckboxes, {
            extension: 'txt',
            formatItem: (ctx) => {
                let typeName = "";
                let text = "";

                if (ctx.type === 'user') {
                    typeName = `${chrome.i18n.getMessage("userHeader")}:`;
                    text = ctx.userQueryElement.innerText;
                } else if (ctx.type === 'model') {
                    typeName = `${chrome.i18n.getMessage("modelHeader")}:`;
                    const nextDiv = ctx.labelTag.nextElementSibling;
                    text = nextDiv ? nextDiv.innerText : "";
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
                let parent = node.closest('code-block');
                if (parent) {
                    let codeDecoration = parent.querySelector('.code-block-decoration');
                    if (codeDecoration) {
                        language = codeDecoration.innerText;
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
            onStart: () => {
                if (typeof SnackbarManager !== 'undefined') SnackbarManager.disableNotifications();
            },
            onEnd: () => {
                if (typeof SnackbarManager !== 'undefined') SnackbarManager.enableNotifications(3000);
            },
            formatItem: (ctx) => {
                let sectionHeader = "";
                let target = null;

                if (ctx.type === 'user') {
                    sectionHeader = `## ${chrome.i18n.getMessage("userHeader")}\n`;
                    target = ctx.userQueryElement.querySelector('.query-text');
                } else if (ctx.type === 'model') {
                    sectionHeader = `## ${chrome.i18n.getMessage("modelHeader")}\n`;
                    target = ctx.checkbox.closest('message-content').querySelector('div[id^="model-response-message-content"]');
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
        let div = document.querySelector('.conversation-title');
        if (div) {
            return div.innerText;
        }
        return "gemini";
    }

    global.CopyActions = CopyActions;
})(window);
