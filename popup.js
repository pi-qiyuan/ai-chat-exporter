document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const message = chrome.i18n.getMessage(key);
        if (message) {
            element.textContent = message;
        }
    });

    const manifestData = chrome.runtime.getManifest();
    document.getElementById('version').textContent = `v${manifestData.version}`;

    const supportedPatterns = [
        'gemini.google.com',
        'chatgpt.com',
        'claude.ai'
    ];

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        const tipTextElement = document.getElementById('tip-text');
        const smartTipElement = document.getElementById('smart-tip');
        const shortcutTipElement = document.getElementById('shortcut-tip');
        const shortcutTextElement = document.getElementById('shortcut-text');

        if (currentTab && currentTab.url) {
            const isSupported = supportedPatterns.some(pattern => currentTab.url.includes(pattern));

            if (isSupported) {
                if (tipTextElement) tipTextElement.textContent = chrome.i18n.getMessage('supportedTip');
                if (smartTipElement) {
                    smartTipElement.classList.remove('warning');
                    smartTipElement.classList.add('info');
                }

                if (shortcutTextElement && shortcutTipElement) {
                    shortcutTextElement.textContent = chrome.i18n.getMessage('shortcutTip');
                    shortcutTipElement.style.display = 'flex';
                }
            } else {
                if (tipTextElement) tipTextElement.textContent = chrome.i18n.getMessage('unsupportedTip');
                if (smartTipElement) {
                    smartTipElement.classList.remove('info');
                    smartTipElement.classList.add('warning');
                }

                if (shortcutTipElement) {
                    shortcutTipElement.style.display = 'none';
                }
            }
        }
    });
});