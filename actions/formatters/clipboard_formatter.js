(function(global) {
    const ClipboardFormatter = {
        processItem: (context, turndownService, accumulators) => {
            const provider = AppState.currentProvider;
            let target = null;
            if (provider.getMarkdownTarget) {
                target = provider.getMarkdownTarget(context);
            }

            if (!target) {
                return false;
            }

            const headerText = Utils.getHeaderTitle(context.type);
            const mdHeader = `## ${headerText}\n`;
            const htmlHeader = `<h2>${headerText}</h2>`;

            accumulators.html += `${htmlHeader}\n${target.innerHTML}\n<hr>\n`;
            const md = turndownService.turndown(target.innerHTML);
            accumulators.markdown += `${mdHeader}${md}\n\n---\n`;
            return true;
        },

        finalize: async (accumulators) => {
            let { html, markdown } = accumulators;
            const footerText = Utils.getExportFooter();

            if (footerText) {
                html += `<br><hr><p>${footerText}</p>`;
                markdown += `${footerText}\n`;
            }

            const blobHtml = new Blob([html], { type: "text/html" });
            const blobText = new Blob([markdown], { type: "text/plain" });
            
            const data = [new ClipboardItem({
                ["text/html"]: blobHtml,
                ["text/plain"]: blobText,
            })];

            await navigator.clipboard.write(data);
            window.dispatchEvent(new CustomEvent('ace-copy-success'));
            Utils.showToast(chrome.i18n.getMessage("copySuccess"), 5000);
        }
    };

    global.ClipboardFormatter = ClipboardFormatter;
})(window);