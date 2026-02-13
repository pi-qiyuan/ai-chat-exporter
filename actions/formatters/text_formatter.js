(function(global) {
    const TextFormatter = {
        formatItem: (ctx) => {
            const headerText = Utils.getHeaderTitle(ctx.type);
            const typeName = headerText ? `${headerText}:` : "";
            
            let text = "";
            if (AppState.currentProvider) {
                text = AppState.currentProvider.getTextContent(ctx);
            }

            if (typeName && text) {
                return `${typeName}\n${text}\n\n---------------------------------------------` + `\n\n`;
            }
            return "";
        }
    };

    global.TextFormatter = TextFormatter;
})(window);