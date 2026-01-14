(function(global){
    const ButtonCreator = {
        insertExportButton: (observer) => {
            insertExportButton(observer);
        }
    };

    function insertExportButton(observer) {
        if (document.getElementById('main-export-btn')) {
            if (observer) observer.disconnect();
            return;
        }

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

        const platform = navigator.userAgentData?.platform || navigator.platform;
        const isMac = /Mac/i.test(platform);
        const shortcutHint = isMac ? 'Cmd + Shift + E' : 'Ctrl + Shift + E';

        const exportButton = document.createElement('div');
        exportButton.className = 'ace-export-button';
        exportButton.innerHTML = `
            <div class="ace-button-group">
                <button id="main-export-btn" class="ace-my-button" title="${shortcutHint}">
                    ${chrome.i18n.getMessage('exportBtn')}
                </button>
                <button id="menu-toggle-btn" class="ace-dropdown-toggle">
                    <span class="ace-arrow">▼</span>
                </button>
                
                <ul id="export-menu" class="ace-dropdown-menu">
                    <li class="ace-menu-item" data-format="txt">${chrome.i18n.getMessage('exportAsText')}</li>
                    <li class="ace-menu-item" data-format="md">${chrome.i18n.getMessage('exportAsMarkdown')}</li>
                    <li class="ace-menu-item" data-format="clipboard">${chrome.i18n.getMessage('smartCopy')}</li>
                </ul>
            </div>
        `;

        const moreButton = document.createElement('div');
        moreButton.className = 'ace-export-button';
        moreButton.innerHTML = `
            <div class="ace-button-group">
                <button id="more-menu-btn" class="ace-my-button ace-more-menu-btn">
                    ${chrome.i18n.getMessage('moreBtn')}
                    <span class="ace-arrow ace-margin-left-arrow">▼</span>
                </button>
                <ul id="more-menu" class="ace-dropdown-menu">
                    <li class="ace-menu-item" id="clear-history-btn">
                         <span class="ace-menu-link" style="cursor: pointer;">
                            ${chrome.i18n.getMessage('clearHistory')}
                        </span>
                    </li>
                    <li class="ace-menu-item">
                        <a href="https://ko-fi.com/qiyuanyang" target="_blank" class="ace-menu-link">
                            ❤️ ${chrome.i18n.getMessage('sponsor')}
                        </a>
                    </li>
                    <li class="ace-menu-item">
                        <a href="https://github.com/pi-qiyuan/ai-chat-exporter/issues/new" target="_blank" class="ace-menu-link">
                            ${chrome.i18n.getMessage('feedback')}
                        </a>
                    </li>
                    <li class="ace-menu-item">
                        <a href="https://github.com/pi-qiyuan/ai-chat-exporter" target="_blank" class="ace-menu-link">
                            ${chrome.i18n.getMessage('contact')}
                        </a>
                    </li>
                    <li class="ace-menu-item">
                        <a href="https://github.com/pi-qiyuan/ai-chat-exporter/blob/main/PRIVACY.md" target="_blank" class="ace-menu-link">
                            ${chrome.i18n.getMessage('privacyPolicy')}
                        </a>
                    </li>
                </ul>
            </div>
        `;

        const buttons = { selectButton, exportButton, moreButton };
        
        if (AppState.currentProvider && AppState.currentProvider.insertButtons(buttons)) {
            if (observer) observer.disconnect();
            initExportModule();
            initSelectModule();
            initMoreModule();
        }
    }

    function setupDropdown(toggleBtn, menu) {
        if (!toggleBtn || !menu) return;

        toggleBtn.addEventListener('click', (event) => {
            event.stopPropagation();

            const allDropdowns = [
                { menuId: 'export-menu', toggleId: 'menu-toggle-btn' },
                { menuId: 'select-menu', toggleId: 'select-menu-toggle-btn' },
                { menuId: 'more-menu', toggleId: 'more-menu-btn' }
            ];

            allDropdowns.forEach(({ menuId, toggleId }) => {
                const otherMenu = document.getElementById(menuId);
                const otherToggle = document.getElementById(toggleId);
                
                if (otherMenu && otherMenu !== menu) {
                    otherMenu.classList.remove('ace-show');
                }
                if (otherToggle && otherToggle !== toggleBtn) {
                    otherToggle.classList.remove('ace-show-arrow');
                }
            });

            const isShowing = menu.classList.toggle('ace-show');
            toggleBtn.classList.toggle('ace-show-arrow', isShowing);
        });
    }

    function initExportModule() {
        const mainBtn = document.getElementById('main-export-btn');
        const toggleBtn = document.getElementById('menu-toggle-btn');
        const menu = document.getElementById('export-menu');

        if (!mainBtn || !toggleBtn || !menu) return;

        mainBtn.addEventListener('click', () => {
            CopyActions.handleExport('txt');
        });

        setupDropdown(toggleBtn, menu);

        menu.addEventListener('click', (event) => {
            const target = event.target;
            if (target.classList.contains('ace-menu-item')) {
                const format = target.getAttribute('data-format');
                CopyActions.handleExport(format);
                if (format === 'clipboard') {
                    setTimeout(() => {
                        menu.classList.remove('ace-show');
                        toggleBtn.classList.remove('ace-show-arrow');
                    }, 2000);
                } else {
                    menu.classList.remove('ace-show');
                    toggleBtn.classList.remove('ace-show-arrow');
                }
            }
        });

        window.addEventListener('ace-copy-success', () => {
            const copyBtn = menu.querySelector('[data-format="clipboard"]');
            if (copyBtn) {
                const originalText = copyBtn.innerText;
                copyBtn.innerText = "✅ " + chrome.i18n.getMessage('copied');
                setTimeout(() => {
                    copyBtn.innerText = originalText;
                }, 2000);
            }
        });
    }

    function initSelectModule() {
        const selectBtn = document.getElementById('select-action-btn');
        const toggleBtn = document.getElementById('select-menu-toggle-btn');
        const menu = document.getElementById('select-menu');

        if (!selectBtn || !toggleBtn || !menu) return;

        selectBtn.addEventListener('click', function() {
            AppState.inSelectMode = true;
            CheckActions.manageUserQueryCheckboxes();
            CheckActions.manageContainerCheckboxes();
            Utils.showToast(chrome.i18n.getMessage('noSelection'));
        });

        setupDropdown(toggleBtn, menu);

        menu.addEventListener('click', (event) => {
            const target = event.target.closest('.ace-menu-item');
            if (target) {
                const action = target.getAttribute('data-action');
                
                AppState.inSelectMode = true;
                CheckActions.manageUserQueryCheckboxes();
                CheckActions.manageContainerCheckboxes();

                setTimeout(() => {
                    CheckActions.toggleSelection(action);
                }, 50);

                menu.classList.remove('ace-show');
                toggleBtn.classList.remove('ace-show-arrow');
            }
        });
    }

    function initMoreModule() {
        const moreBtn = document.getElementById('more-menu-btn');
        const menu = document.getElementById('more-menu');
        const clearHistoryBtn = document.getElementById('clear-history-btn');

        if (!moreBtn || !menu) return;

        setupDropdown(moreBtn, menu);

        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', async () => {
                await StorageManager.removeChatIds();

                const statusSpans = document.querySelectorAll('.ace-exported-status');
                statusSpans.forEach(span => {
                    span.innerText = '';
                });

                Utils.showToast(chrome.i18n.getMessage('historyCleared'));
                menu.classList.remove('ace-show');
                moreBtn.classList.remove('ace-show-arrow');
            });
        }
    }

    window.addEventListener('click', (event) => {
        const dropdowns = [
            { menuId: 'export-menu', toggleId: 'menu-toggle-btn' },
            { menuId: 'select-menu', toggleId: 'select-menu-toggle-btn' },
            { menuId: 'more-menu', toggleId: 'more-menu-btn' }
        ];

        dropdowns.forEach(({ menuId, toggleId }) => {
            const menu = document.getElementById(menuId);
            const toggleBtn = document.getElementById(toggleId);
            if (menu && menu.classList.contains('ace-show')) {
                if (!menu.contains(event.target) && !toggleBtn.contains(event.target)) {
                    menu.classList.remove('ace-show');
                    toggleBtn.classList.remove('ace-show-arrow');
                }
            }
        });
    });

    global.ButtonCreator = ButtonCreator;
})(window);