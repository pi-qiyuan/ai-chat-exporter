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
        const selectedCheckboxes = document.querySelectorAll('.model-selector:checked');
        if (selectedCheckboxes.length === 0) {
            Utils.showToast(i18n.t("noSelection"));
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
            const labelTag = checkbox.closest('.model-label-tag');
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

        let finalMarkdown = "";

        try {
            for (const checkbox of selectedCheckboxes) {
                const labelTag = checkbox.closest('.model-label-tag');
                let sectionHeader = "";
                let buttonToClick = null;

                const userQueryElement = labelTag.parentElement.querySelector('user-query');
                const messageContentWrapper = labelTag.closest('message-content');

                if (userQueryElement && labelTag.parentElement.contains(userQueryElement)) {
                    sectionHeader = `## ${i18n.t("userHeader")}\n`;
                    buttonToClick = userQueryElement.parentElement.querySelector('button:has(mat-icon[fonticon="content_copy"])');
                } 
                else if (messageContentWrapper) {
                    sectionHeader = `## ${i18n.t("modelHeader")}\n`;

                    const responseContainer = labelTag.closest('response-container');
                    if (responseContainer) {
                        buttonToClick = responseContainer.querySelector('button:has(mat-icon[fonticon="content_copy"])');
                    }
                }

                if (buttonToClick) {
                    buttonToClick.click();
                    await new Promise(resolve => setTimeout(resolve, 200));
                    const clipboardText = await navigator.clipboard.readText();
                    finalMarkdown += `${sectionHeader}${clipboardText}\n\n`;
                }
            }

            if (finalMarkdown) {
                Utils.downloadText(finalMarkdown, getFilename() + ".md");
            }
        } catch (error) {
        } finally {
            if (typeof SnackbarManager !== 'undefined') SnackbarManager.enableNotifications(3000);
        }
    }

    global.CopyActions = CopyActions;
})(window);
