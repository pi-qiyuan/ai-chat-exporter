(function(global){
    global.AppState = {
        currentProvider: null,
        inSelectMode: false,
        isDev: false
    };

    const Utils = {
        log: (msg, data = null, level = 'log') => {
            if (!global.AppState.isDev) return;

            const prefix = '[AI-Chat-Exporter]';
            const content = data ? [msg, data] : [msg];

            switch (level) {
                case 'warn': console.warn(prefix, ...content); break;
                case 'error': console.error(prefix, ...content); break;
                case 'info': console.info(prefix, ...content); break;
                default: console.log(prefix, ...content); break;
            }
        },

        showToast: (message, duration = 3000) => {
            showToast(message, duration);
        },

        downloadText: (text, filename) => {
            downText(text, filename);
        },

        simpleHash: (str) => {
            return simpleHash(str);
        },

        extractText: element => extractText(element),

        showFilenamePrompt: (defaultName) => {
            return new Promise((resolve) => {
                showFilenamePrompt(defaultName, (newFilename) => {
                    resolve(newFilename);
                }, () => {
                    resolve(null);
                });
            });
        },

        findAssociatedUserQuery: (ctx) => {
            return findAssociatedUserQuery(ctx);
        },

        getFilename: () => {
            return getFilename();
        },

        getProviderFilename: (selector, fallback) => {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
            return fallback;
        },

        getHeaderTitle: (type) => {
            if (type === 'user') {
                return chrome.i18n.getMessage("userHeader");
            } else if (type === 'model') {
                return AppState.currentProvider ? AppState.currentProvider.name : 'AI';
            }
            return '';
        },

        getExportFooter: () => {
            const timestamp = new Date().toLocaleString();
            const appName = chrome.i18n.getMessage("extensionName");
            const modelName = AppState.currentProvider ? AppState.currentProvider.name : 'AI';
            return chrome.i18n.getMessage("exportFooter", [appName, timestamp, modelName]);
        },

        createTurndownService: () => {
            return createTurndownService();
        }
    };

    function findAssociatedUserQuery(ctx) {
        const allUserLabels = Array.from(document.querySelectorAll('.ace-checkbox-user'));
        const currentModelLabel = ctx.labelTag;
        let lastUserLabel = null;

        for (const userLabel of allUserLabels) {
            if (userLabel.compareDocumentPosition(currentModelLabel) & Node.DOCUMENT_POSITION_FOLLOWING) {
                lastUserLabel = userLabel;
            } else {
                break;
            }
        }

        if (lastUserLabel) {
            const checkbox = lastUserLabel.querySelector('.ace-model-selector');
            if (checkbox && !checkbox.checked) {
                const userQueryElement = lastUserLabel.nextElementSibling;
                if (userQueryElement) {
                    return { type: 'user', userQueryElement, labelTag: lastUserLabel };
                }
            }
        }
        return null;
    }

    function getFilename() {
        if (AppState.currentProvider && AppState.currentProvider.getFilename) {
            return AppState.currentProvider.getFilename();
        }
        return "Export";
    }

    function createTurndownService() {
        const turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced'
        });

        turndownService.addRule('ignore-math-internals', {
            filter: function (node) {
                return (
                    node.classList.contains('katex-html') || 
                    node.classList.contains('katex-mathml') ||
                    node.classList.contains('katex-svg') ||
                    node.nodeName === 'SVG' ||
                    (node.nodeName === 'IMG' && node.classList.contains('katex-svg'))
                );
            },
            replacement: function () {
                return '';
            }
        });

        turndownService.addRule('math-formula', {
            filter: function (node) {
                return (
                    node.classList.contains('katex') || 
                    node.classList.contains('math-inline') || 
                    node.classList.contains('math-display') ||
                    node.nodeName === 'MJX-CONTAINER' ||
                    (node.nodeName === 'SPAN' && node.getAttribute('data-latex')) ||
                    (node.nodeName === 'DIV' && node.classList.contains('math'))
                );
            },
            replacement: function (content, node) {
                const annotation = node.querySelector('annotation[encoding="application/x-tex"]');
                if (annotation) return formatMath(annotation.textContent, node);

                const ariaLabel = node.getAttribute('aria-label');
                if (ariaLabel && ariaLabel.includes('\\')) return formatMath(ariaLabel, node);

                const latexData = node.getAttribute('data-latex') || node.getAttribute('data-tex');
                if (latexData) return formatMath(latexData, node);

                const svgImg = node.querySelector('img.katex-svg');
                if (svgImg && svgImg.getAttribute('alt')) {
                    return formatMath(svgImg.getAttribute('alt'), node);
                }

                if (content.trim()) {
                    return formatMath(content, node);
                }

                return node.textContent;
            }
        });

        function formatMath(latex, node) {
            const isDisplay = node.classList.contains('katex-display') || 
                             node.classList.contains('math-display') ||
                             node.parentElement?.classList.contains('math-display') ||
                             node.getAttribute('display') === 'block';
            
            const cleanLatex = latex.trim();
            if (!cleanLatex) return '';

            return isDisplay ? `\n\n$$ ${cleanLatex} $$\n\n` : `$${cleanLatex}$`;
        }

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

    function showToast(message, duration) {
        const toast = document.createElement('div');
        toast.className = 'ace-custom-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('ace-show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('ace-show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    function showFilenamePrompt(defaultName, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.className = 'ace-modal-overlay';

        const modalBox = document.createElement('div');
        modalBox.className = 'ace-modal-box';

        const title = document.createElement('div');
        title.className = 'ace-modal-title';
        title.textContent = chrome.i18n.getMessage("enterFilename") || "Enter Filename";

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'ace-modal-input';
        input.value = defaultName;

        const btnContainer = document.createElement('div');
        btnContainer.className = 'ace-modal-buttons';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'ace-modal-btn ace-modal-btn-secondary';
        cancelBtn.textContent = chrome.i18n.getMessage("cancel") || "Cancel";

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'ace-modal-btn ace-modal-btn-primary';
        confirmBtn.textContent = chrome.i18n.getMessage("confirm") || "Download";

        btnContainer.appendChild(cancelBtn);
        btnContainer.appendChild(confirmBtn);

        modalBox.appendChild(title);
        modalBox.appendChild(input);
        modalBox.appendChild(btnContainer);

        overlay.appendChild(modalBox);
        document.body.appendChild(overlay);

        input.focus();
        input.select();

        const close = () => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        };

        const confirm = () => {
            const val = input.value.trim();
            if (val) {
                onConfirm(val);
                close();
            }
        };

        const cancel = () => {
            if (onCancel) onCancel();
            close();
        };

        cancelBtn.addEventListener('click', cancel);
        confirmBtn.addEventListener('click', confirm);

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                confirm();
            } else if (e.key === 'Escape') {
                cancel();
            }
        });

        let mousedownTargetIsOverlay = false;

        overlay.addEventListener('mousedown', (e) => {
            mousedownTargetIsOverlay = (e.target === overlay);
        });

        overlay.addEventListener('mouseup', (e) => {
            if (mousedownTargetIsOverlay && e.target === overlay) {
                cancel();
            }
        });
    }

    function downText(text, filename) {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return hash.toString(36);
    }

    function extractText(container) {
        const rawText = getPerfectPlainText(container);

        return rawText
            .split('\n')
            .map(line => line.trim())
            .filter((line, index, arr) => {
                return line !== '' || (index > 0 && arr[index - 1] !== '');
            })
            .join('\n')
            .trim();
    }

    function getPerfectPlainText(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent.replace(/\s+/g, ' ');
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return '';
        }

        const style = window.getComputedStyle(node);
        const display = style.display;

        if (display === 'none') return '';

        const tagName = node.tagName.toUpperCase();
        
        if (tagName === 'BR') return '\n';
        if (['SCRIPT', 'STYLE'].includes(tagName)) return '';

        let childrenText = Array.from(node.childNodes)
            .map(child => getPerfectPlainText(child))
            .join('');

        if (display === 'table-cell' || tagName === 'TD' || tagName === 'TH') {
            return childrenText.trim() + ' ';
        }

        const isBlock = !display.includes('inline') && display !== 'contents';
        const isActuallyBlock = isBlock && !['SPAN', 'I', 'B', 'STRONG', 'EM', 'FONT', 'A'].includes(tagName);

        if (isActuallyBlock) {
            return `\n${childrenText.trim()}\n`;
        }

        return childrenText;
    }

    global.Utils = Utils;
})(window);