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

        if (format === 'clipboard') {
            exportToClipboard(selectedCheckboxes);
        } else if (format === 'md') {
            exportAsMarkdown(selectedCheckboxes);
        } else {
            exportAsText(selectedCheckboxes);
        }
    }

    async function runExportSequence(selectedCheckboxes, itemProcessor, postProcessor) {
        const chatIdsToSave = {};
        const provider = AppState.currentProvider;
        if (!provider) return;

        let hasContent = false;

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

                const result = await itemProcessor(context);
                if (result) {
                    hasContent = true;
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

            if (hasContent && postProcessor) {
                await postProcessor();
                selectedCheckboxes.forEach(cb => cb.checked = false);
            }
        } catch (error) {
            console.error("Export sequence failed:", error);
            Utils.showToast("Export failed: " + error.message);
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
                const timestamp = new Date().toLocaleString();
                const appName = chrome.i18n.getMessage("extensionName");
                const modelName = AppState.currentProvider ? AppState.currentProvider.name : 'AI';
                const footerText = chrome.i18n.getMessage("exportFooter", [appName, timestamp, modelName]);

                finalContent += '\n\n---\n' + footerText + '\n';

                Utils.downloadText(finalContent, getFilename() + "." + extension);
            }
        );
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
                    return `${typeName}\n${text}\n\n---------------------------------------------\n\n`;
                }
                return "";
            }
        });
    }

    function createTurndownService() {
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

        turndownService.addRule('table-cell', {
            filter: ['th', 'td'],
            replacement: function (content) {
                return ' ' + content.replace(/\n/g, '<br>').trim() + ' |';
            }
        });

        turndownService.addRule('table-row', {
            filter: ['tr'],
            replacement: function (content) {
                return '|' + content.trim() + '\n';
            }
        });

        turndownService.addRule('table-custom', {
            filter: 'table',
            replacement: function (content, node) {
                const rows = Array.from(node.rows);
                if (rows.length === 0) return '';

                const columnCount = rows[0].cells.length;
                let delimiterRow = '|';
                for (let i = 0; i < columnCount; i++) {
                    delimiterRow += ' --- |';
                }

                const lines = content.trim().split('\n').filter(l => l.trim() !== '');

                const header = lines[0];
                const body = lines.slice(1).join('\n');

                return '\n\n' + 
                    header + '\n' + 
                    delimiterRow + 
                    (body ? '\n' + body : '') + 
                    '\n\n';
            }
        });

        return turndownService;
    }

    async function exportAsMarkdown(selectedCheckboxes) {
        const turndownService = createTurndownService();

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
                    return `${sectionHeader}${md}\n\n---\n`;
                }
                return "";
            }
        });
    }

    async function exportToClipboard(selectedCheckboxes) {
        const turndownService = createTurndownService();
        const provider = AppState.currentProvider;
        
        let fullHtml = "";
        let fullMarkdown = "";

        await runExportSequence(
            selectedCheckboxes,
            async (context) => {
                let target = null;
                if (provider.getMarkdownTarget) {
                    target = provider.getMarkdownTarget(context);
                }

                if (target) {
                    let mdHeader = "";
                    let htmlHeader = "";
                    
                    if (context.type === 'user') {
                        const headerText = chrome.i18n.getMessage("userHeader");
                        mdHeader = `## ${headerText}\n`;
                        htmlHeader = `<h2>${headerText}</h2>`;
                    } else if (context.type === 'model') {
                        const headerText = provider.name || 'AI';
                        mdHeader = `## ${headerText}\n`;
                        htmlHeader = `<h2>${headerText}</h2>`;
                    }

                    fullHtml += `${htmlHeader}\n${target.innerHTML}\n<hr>\n`;
                    
                    const md = turndownService.turndown(target.innerHTML);
                    fullMarkdown += `${mdHeader}${md}\n\n---\n`;
                    return true;
                }
                return false;
            },
            async () => {
                const timestamp = new Date().toLocaleString();
                const appName = chrome.i18n.getMessage("extensionName");
                const modelName = AppState.currentProvider ? AppState.currentProvider.name : 'AI';
                const footerText = chrome.i18n.getMessage("exportFooter", [appName, timestamp, modelName]);

                if (footerText) {
                    fullHtml += `<br><hr><p>${footerText}</p>`;
                    fullMarkdown += `\n\n---\n${footerText}\n`;
                }

                const blobHtml = new Blob([fullHtml], { type: "text/html" });
                const blobText = new Blob([fullMarkdown], { type: "text/plain" });
                
                const data = [new ClipboardItem({
                    ["text/html"]: blobHtml,
                    ["text/plain"]: blobText,
                })];

                await navigator.clipboard.write(data);
                window.dispatchEvent(new CustomEvent('ace-copy-success'));
                Utils.showToast(chrome.i18n.getMessage("copySuccess"), 5000);
            }
        );
    }

    function getFilename() {
        if (AppState.currentProvider && AppState.currentProvider.getFilename) {
            return AppState.currentProvider.getFilename();
        }
        return "Export";
    }

    global.CopyActions = CopyActions;
})(window);
