const isGoogleAIActive = () => {
    const isAiOverviewTitle = (text) => {
        const normalized = (text || '').replace(/\s+/g, ' ').trim().toLowerCase();
        const localizedTitle = (chrome.i18n.getMessage('aiOverview') || '').toLowerCase();
        return normalized === localizedTitle ||
            normalized === 'ai 概览' ||
            normalized === 'ai overview' ||
            normalized === 'ai overviews' ||
            normalized === 'ai 概要';
    };
    return Array.from(document.querySelectorAll('[role="heading"][aria-level="2"], [role="heading"]'))
        .some(el => isAiOverviewTitle(el.textContent)) || !!document.querySelector('[data-subtree="aimc"]');
};

const updateCurrentProvider = () => {
    if(AppState.currentProvider != null && AppState.currentProvider != GoogleSearchProvider) {
        return;
    }

    if (window.location.hostname.includes('gemini.google.com')) {
        AppState.currentProvider = GeminiProvider;
        return;
    }

    if (window.location.hostname.includes('chatgpt.com')) {
        AppState.currentProvider = ChatGPTProvider;
        return;
    }
    
    if (window.location.hostname.includes('claude.ai')) {
        AppState.currentProvider = ClaudeProvider;
        return;
    }

    if (window.location.hostname === 'www.google.com' && window.location.pathname === '/search') {
        if (document.querySelector('div[data-xid="aim-mars-input-plate"]')) {
            AppState.currentProvider = GoogleAIProvider;
            return;
        }
        if (document.querySelector('[role="heading"][aria-level="2"], [role="heading"]')) {
            AppState.currentProvider = GoogleSearchProvider;
            return;
        }
    }
};

updateCurrentProvider();

document.addEventListener('DOMContentLoaded', () => {
    updateCurrentProvider();
    ButtonCreator.insertExportButton(observer);
});

const observer = new MutationObserver((_mutationsList, obs) => {
    updateCurrentProvider();
    ButtonCreator.insertExportButton(obs);
});

const targetNode = document.documentElement;
const config = { childList: true, subtree: true };
if (targetNode) {
    observer.observe(targetNode, config);
}

let lastUrl = location.href;
let checkboxSyncTimer = null;

function scheduleCheckboxSync() {
    if (checkboxSyncTimer) return;
    checkboxSyncTimer = setTimeout(() => {
        checkboxSyncTimer = null;
        if (!AppState.inSelectMode) return;
        CheckActions.manageUserQueryCheckboxes();
        CheckActions.manageContainerCheckboxes();
    }, 100);
}

new MutationObserver((mutationsList) => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        AppState.inSelectMode = false;
        AppState.currentProvider = null;
        document.querySelectorAll('.ace-model-label-tag').forEach(label => label.remove());

        updateCurrentProvider();
        if (AppState.currentProvider && AppState.currentProvider.hasActiveSelection) {
            AppState.inSelectMode = AppState.currentProvider.hasActiveSelection();
        }
        const observer = new MutationObserver((_mutationsList, obs) => {
            updateCurrentProvider();
            ButtonCreator.insertExportButton(obs);
        });
        observer.observe(targetNode, config);
    }

    if (AppState.currentProvider && AppState.currentProvider.handleMutations) {
        AppState.currentProvider.handleMutations(mutationsList);
    }

    if (!AppState.inSelectMode) {
        return;
    }

    scheduleCheckboxSync();
}).observe(document, {subtree: true, childList: true, characterData: true});

document.addEventListener('keydown', (event) => {
    if (event.key.toUpperCase() === 'E' && event.shiftKey && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();

        const exportButton = document.getElementById('main-export-btn');
        if (exportButton) {
            exportButton.click();
        }
    }
});
