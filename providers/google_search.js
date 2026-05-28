(function(global) {
    const GoogleSearchProvider = {
        name: chrome.i18n.getMessage('googleAiOverviewName') || "Google AI Overview",
        isActive: () => isActiveInternal(),
        selectors: {
            user: null,
            model: null,
            aiOverviewHeading: '[role="heading"][aria-level="2"], [role="heading"]',
            aiOverviewContent: '[data-container-id="main-col"], [data-subtree="aimc"]'
        },
        insertButtons: (buttons) => insertButtonsInternal(buttons),
        generateChatId: () => generateChatIdInternal(),
        getFilename: () => getFilenameInternal(),
        getTextContent: (context) => getTextContentInternal(context),
        getMarkdownTarget: (context) => getMarkdownTargetInternal(context),
        getDefaultExportContexts: () => getDefaultExportContextsInternal()
    };

    function isActiveInternal() {
        return !!findAiOverviewHeading() || !!document.querySelector('[data-subtree="aimc"]');
    }

    function insertButtonsInternal(buttons) {
        const heading = findAiOverviewHeading();
        if (!heading || heading.parentElement.querySelector('.ace-google-ai-overview-export')) {
            return !!heading;
        }

        const exportButton = buttons.exportButton;
        exportButton.classList.add('ace-google-ai-overview-export');

        const mainButton = exportButton.querySelector('#main-export-btn');
        if (mainButton) {
            mainButton.textContent = chrome.i18n.getMessage('googleAiOverviewExportBtn') || '导出';
            mainButton.title = chrome.i18n.getMessage('googleAiOverviewExportBtnTitle') || '导出 AI 概览';
            mainButton.classList.add('ace-google-ai-overview-main-btn');
        }

        const menu = exportButton.querySelector('#export-menu');
        if (menu && !menu.querySelector('.ace-google-more-tools-link')) {
            const moreToolsItem = document.createElement('li');
            moreToolsItem.className = 'ace-google-more-tools-item';
            moreToolsItem.innerHTML = `
                <a href="https://hugbear.ai" target="_blank" class="ace-menu-link ace-google-more-tools-link">
                    🚀 ${chrome.i18n.getMessage('moreTools')}
                </a>
            `;
            menu.appendChild(moreToolsItem);
        }

        heading.insertAdjacentElement('afterend', exportButton);
        return true;
    }

    function getDefaultExportContextsInternal() {
        const content = findExportContent();
        if (!content) return [];

        return [{
            type: 'model',
            labelTag: null,
            checkbox: null,
            userQueryElement: null,
            messageContentWrapper: content,
            chatId: generateChatIdInternal()
        }];
    }

    function getTextContentInternal(context) {
        const target = context.messageContentWrapper || findExportContent();
        if (!target) return "";

        return Utils.extractText(getCleanContentClone(target));
    }

    function getMarkdownTargetInternal(context) {
        const target = context.messageContentWrapper || findExportContent();
        if (!target) return null;

        return getCleanContentClone(target);
    }

    function getFilenameInternal() {
        const query = new URLSearchParams(window.location.search).get('q');
        const aiOverviewTitle = chrome.i18n.getMessage('aiOverview') || "AI Overview";
        const providerName = chrome.i18n.getMessage('googleAiOverviewName') || "Google AI Overview";
        if (query) {
            return sanitizeFilename(`${providerName} - ${query}`);
        }
        return providerName;
    }

    function generateChatIdInternal() {
        const query = new URLSearchParams(window.location.search).get('q') || window.location.href;
        return `model_google_ai_overview_${Utils.simpleHash(query)}`;
    }

    function findAiOverviewHeading() {
        return Array.from(document.querySelectorAll(GoogleSearchProvider.selectors.aiOverviewHeading))
            .find(el => isAiOverviewTitle(el.textContent));
    }

    function findAiOverviewRoot() {
        const heading = findAiOverviewHeading();
        if (!heading) return null;

        return heading.closest('[jsname="V3qe9d"]') ||
            heading.closest('[data-ve-view]') ||
            heading.parentElement;
    }

    function findAiOverviewContent() {
        const root = findAiOverviewRoot();
        if (!root) return null;

        return root.querySelector('[data-container-id="main-col"]') ||
            root.querySelector('[data-subtree="aimc"]') ||
            root;
    }

    function findExportContent() {
        const content = findAiOverviewContent();
        if (!content) return null;

        const shareButton = findShareButton(content);
        if (!shareButton) return content;

        return cloneBeforeNode(content, shareButton);
    }

    function getCleanContentClone(target) {
        const clone = target.cloneNode(true);
        clone.querySelectorAll('script, style, button, svg, .ace-export-button, [style*="display: none"], [style*="display:none"]').forEach(el => el.remove());
        return clone;
    }

    function findShareButton(root) {
        const localizedShare = (chrome.i18n.getMessage('share') || '').toLowerCase();
        return Array.from(root.querySelectorAll('[role="button"], button, [aria-label]'))
            .find(el => {
                const label = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
                return label === localizedShare || label === 'share' || label === '分享';
            });
    }

    function cloneBeforeNode(root, stopNode) {
        const clone = root.cloneNode(true);
        const path = getNodePath(root, stopNode);
        const clonedStopNode = getNodeByPath(clone, path);

        if (!clonedStopNode) return clone;

        removeFromNodeForward(clonedStopNode, clone);
        return clone;
    }

    function getNodePath(root, node) {
        const path = [];
        let current = node;

        while (current && current !== root) {
            const parent = current.parentNode;
            if (!parent) break;

            path.unshift(Array.prototype.indexOf.call(parent.childNodes, current));
            current = parent;
        }

        return path;
    }

    function getNodeByPath(root, path) {
        return path.reduce((node, index) => {
            return node && node.childNodes ? node.childNodes[index] : null;
        }, root);
    }

    function removeFromNodeForward(node, boundary) {
        let current = node;

        while (current && current !== boundary) {
            removeFollowingSiblings(current);

            const parent = current.parentNode;
            if (current === node) {
                current.remove();
            }
            current = parent;
        }
    }

    function removeFollowingSiblings(node) {
        let sibling = node.nextSibling;
        while (sibling) {
            const next = sibling.nextSibling;
            sibling.remove();
            sibling = next;
        }
    }

    function isAiOverviewTitle(text) {
        const normalized = (text || '').replace(/\s+/g, ' ').trim().toLowerCase();
        const localizedTitle = (chrome.i18n.getMessage('aiOverview') || '').toLowerCase();
        return normalized === localizedTitle ||
            normalized === 'ai 概览' ||
            normalized === 'ai overview' ||
            normalized === 'ai overviews' ||
            normalized === 'ai 概要';
    }

    function sanitizeFilename(filename) {
        return filename.replace(/[\\/:*?"<>|]/g, '_').slice(0, 120);
    }

    global.GoogleSearchProvider = GoogleSearchProvider;
})(window);
