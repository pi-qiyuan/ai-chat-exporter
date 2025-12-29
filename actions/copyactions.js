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
            Utils.showToast(i18n.t("noSelection"));
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

    async function exportAsText(selectedCheckboxes) {
        let combinedResults = "";

        selectedCheckboxes.forEach((checkbox, index) => {
            const labelTag = checkbox.closest('.ace-model-label-tag');
            if (!labelTag) return;

            let type = "";
            let text = "";

            const userQueryElement = labelTag.parentElement.querySelector('user-query');
            const messageContentWrapper = labelTag.closest('message-content');

            if (userQueryElement && labelTag.parentElement.contains(userQueryElement)) {
                type = `${i18n.t("userHeader")}:`;
                text = userQueryElement.innerText;
            } 
            else if (messageContentWrapper) {
                type = `${i18n.t("modelHeader")}:`;
                const nextDiv = labelTag.nextElementSibling;
                text = nextDiv ? nextDiv.innerText : "";
            }

            if (type && text) {
                combinedResults += `${type}\n${text}\n\n`;
            }
        });

        Utils.downloadText(combinedResults, getFilename() + ".txt");
    }

    function getFilename() {
        let div = document.querySelector('.conversation-title');
        if (div) {
            return div.innerText;
        }
        return "gemini";
    }

    async function exportAsMarkdown(selectedCheckboxes) {
        if (typeof SnackbarManager !== 'undefined') SnackbarManager.disableNotifications();

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

        let finalMarkdown = "";

        try {
            for (const checkbox of selectedCheckboxes) {
                const labelTag = checkbox.closest('.ace-model-label-tag');
                let sectionHeader = "";
                let target = null;

                const userQueryElement = labelTag.parentElement.querySelector('user-query');
                const messageContentWrapper = labelTag.closest('message-content');

                if (userQueryElement && labelTag.parentElement.contains(userQueryElement)) {
                    sectionHeader = `## ${i18n.t("userHeader")}\n`;
                    target = userQueryElement.querySelector('.query-text');
                } 
                else if (messageContentWrapper) {
                    sectionHeader = `## ${i18n.t("modelHeader")}\n`;
                    target = checkbox.closest('message-content').querySelector('div[id^="model-response-message-content"]');
                }

                if (target) {
                    let md = turndownService.turndown(target.innerHTML)
                    finalMarkdown += `${sectionHeader}${md}\n\n`;
                }
            }

            if (finalMarkdown) {
                Utils.downloadText(finalMarkdown, getFilename() + ".md");
            }
        } catch (error) {
            Utils.showToast("Error during markdown export.");
        } finally {
            if (typeof SnackbarManager !== 'undefined') SnackbarManager.enableNotifications(3000);
        }
    }

    global.CopyActions = CopyActions;
})(window);