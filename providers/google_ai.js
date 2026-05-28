(function(global) {
    const GoogleAIProvider = {
        name: chrome.i18n.getMessage('googleAi') || "Google AI",
        selectors: {
            user: 'span[aria-level="2"][role="heading"]',
            model: 'div[data-subtree="aimc"]',
            chatTitle: '.mdc-list-item--activated',
            toolbox: 'div[data-xid="aim-mars-input-plate"]',
            queryText: '.query-text-line',
            modelResponse: 'div[id^="model-response-message-content"]',
            tableFooter: '.table-footer.hide-from-message-actions',
            codeBlock: 'code-block',
            codeDecoration: '.code-block-decoration'
        },
        getSelectors: (type) => getSelectors(type),
        insertButtons: (buttons) => insertButtonsInternal(buttons),
        generateChatId: (item, type) => generateChatIdInternal(item, type),
        getFilename: () => getFilenameInternal(),
        getTextContent: (context) => getTextContentInternal(context),
        getMarkdownTarget: (context) => getMarkdownTargetInternal(context),
        getCodeLanguage: (node) => getCodeLanguageInternal(node)
    };

    function getSelectors(type) {
        if (type == "model") {
            return document.querySelectorAll(GoogleAIProvider.selectors.model);
        }

        const elements = [];
        const items = document.querySelectorAll(GoogleAIProvider.selectors.user);
        items.forEach(item => {
            elements.push(item.parentElement.parentElement.parentElement);
        });
        return elements;
    }

    function insertButtonsInternal(buttons) {
        const toolbox = document.querySelector(GoogleAIProvider.selectors.toolbox);
        if(!toolbox){
            return false;
        }

        if (document.getElementById('main-export-btn')) {
            return true;
        }

        var div = document.createElement('div');
        div.className = 'ace-chatgpt-container google-ai-container';

        toolbox.insertAdjacentElement('afterend', div);

        const emptyDiv = document.createElement('div');
        emptyDiv.style.width = '100px';
        div.appendChild(emptyDiv);

        div.appendChild(buttons.selectButton);
        div.appendChild(buttons.exportButton);
        div.appendChild(buttons.moreButton);
        return true;
    }

    function createSelectButton() {
        const selectButton = document.createElement('div');
        selectButton.className = 'ace-export-button';
        selectButton.innerHTML = `
            <div class="ace-button-group">
                <button id="select-action-btn" class="ace-my-button">
                    ${chrome.i18n.getMessage('selectBtn')}
                </button>
                <button id="select-menu-toggle-btn" class="ace-dropdown-toggle">
                    <span class="ace-arrow">▼</span>
                </button>
                <ul id="select-menu" class="ace-dropdown-menu">
                    <li class="ace-menu-item" data-action="all">${chrome.i18n.getMessage('selectAll')}</li>
                    <li class="ace-menu-item" data-action="user">${chrome.i18n.getMessage('selectUser')}</li>
                    <li class="ace-menu-item" data-action="model">${chrome.i18n.getMessage('selectModel')}</li>
                </ul>
            </div>
        `;
        return selectButton;
    }

    function generateChatIdInternal (item, type) {
        return null;
    }

    function getFilenameInternal() {
        const query = new URLSearchParams(window.location.search).get('q');
        const providerName = chrome.i18n.getMessage('googleAiModeName') || "Google AI Mode";
        if (query) {
            return sanitizeFilename(`${providerName} - ${query}`);
        }
        return providerName;
    }

    function getTextContentInternal(ctx) {
        if (ctx.type === 'user') {
            let div = ctx.userQueryElement;
            if (div) {
                return div.textContent.replace('You said:', '').replace('您说：', '').replace('Du hast Folgendes gesagt:', '').replace('Has dicho:', '').replace('Vous avez dit', '').replace('あなたが話した内容:', '').replace('다음과 같이 말했습니다.', '').replace('Você disse:', '').trim();
            }
            return "";
        } 

        if (ctx.type !== 'model') {
            return "";
        }

        const nextDiv = ctx.labelTag.nextElementSibling;
        if (!nextDiv) {
            return "";
        }

        const footers = nextDiv.querySelectorAll(GoogleAIProvider.selectors.tableFooter);
        const hiddenElements = [];

        footers.forEach(el => {
            hiddenElements.push({ el, originalDisplay: el.style.display });
            el.style.display = 'none';
        });

        let text = "";
        try {
            text = Utils.extractText(nextDiv);
        } finally {
            hiddenElements.forEach(item => {
                item.el.style.display = item.originalDisplay;
            });
        }
        return text;
    }

    function getMarkdownTargetInternal(ctx) {
        if (ctx.type === 'user') {
            const clone = ctx.userQueryElement;
            const allSpans = clone.querySelectorAll('span');
            allSpans.forEach(span => {
                if (span.textContent.trim() === 'You said:' || span.textContent.trim() === '您说：' || span.textContent.trim() === 'Du hast Folgendes gesagt:' || span.textContent.trim() === 'Has dicho:' || span.textContent.trim() === 'Vous avez dit' || span.textContent.trim() === 'あなたが話した内容:' || span.textContent.trim() === '다음과 같이 말했습니다.' || span.textContent.trim() === 'Você disse:') {
                    span.remove();
                }
            });
            if (clone.textContent.trim() == '') {
                return null;
            }
            return clone;
        }

        if (ctx.type === 'model') {
            const clone = ctx.labelTag.nextElementSibling.cloneNode(true);
            clone.querySelector('div[jsaction^="aimRenderComplete:"]').remove();
            return clone;
        }
        return null;
    }

    function getCodeLanguageInternal(node) {
        let parent = node.closest(GoogleAIProvider.selectors.codeBlock);
        if (!parent) return '';

        let codeDecoration = parent.querySelector(GoogleAIProvider.selectors.codeDecoration);
        return codeDecoration ? codeDecoration.textContent : '';
    }

    function sanitizeFilename(filename) {
        return filename.replace(/[\\/:*?"<>|]/g, '_').slice(0, 120);
    }

    global.GoogleAIProvider = GoogleAIProvider;
})(window);
