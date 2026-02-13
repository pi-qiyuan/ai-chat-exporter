(function(global) {
    const MarkdownFormatter = {
        formatItem: (ctx, turndownService) => {
            const headerText = Utils.getHeaderTitle(ctx.type);
            const sectionHeader = `## ${headerText}\n`;
            
            const provider = AppState.currentProvider;
            let target = null;

            if (provider && provider.getMarkdownTarget) {
                target = provider.getMarkdownTarget(ctx);
            }

            if (target) {
                let md = turndownService.turndown(target.innerHTML);
                return `${sectionHeader}${md}\n\n---\n`;
            }
            return "";
        }
    };

    global.MarkdownFormatter = MarkdownFormatter;
})(window);