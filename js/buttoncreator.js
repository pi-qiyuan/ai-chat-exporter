(function(global){
    const ButtonCreator = {
        insertExportButton: (observer) => {
            insertExportButton(observer);
        },
        insertButton: (observer) => {
            insertExportButton(observer);
        },
        createSelectButton,
        createExportButton,
        createMoreButton,
        createSelectMenu,
        createExportMenu,
        createMoreMenu,
        setupDropdown,
        initExportMenu
    };

    function removeMenusFromBody() {
        document.getElementById('select-menu')?.remove();
        document.getElementById('export-menu')?.remove();
        document.getElementById('more-menu')?.remove();
    }

    function attachMenusToBody() {
        if (!document.body) return;

        removeMenusFromBody();

        const selectMenu = createSelectMenu();
        const exportMenu = createExportMenu();
        const moreMenu = createMoreMenu();

        if (window.location.hostname === 'www.google.com') {
            const moreToolsItem = document.createElement('li');
            moreToolsItem.className = 'ace-google-more-tools-item';
            moreToolsItem.innerHTML = `
                <a href="https://hugbear.ai" target="_blank" class="ace-menu-link ace-google-more-tools-link">
                    🚀 ${chrome.i18n.getMessage('moreTools')}
                </a>
            `;
            exportMenu.appendChild(moreToolsItem);
        }

        document.body.appendChild(selectMenu);
        document.body.appendChild(exportMenu);
        document.body.appendChild(moreMenu);
    }

    function insertExportButton(observer) {
        if (!document.body) return;

        if (document.getElementById('main-export-btn')) {
            if (observer) observer.disconnect();
            return;
        }

        const selectButton = createSelectButton();
        const exportButton = createExportButton();
        const moreButton = createMoreButton();

        const buttons = { selectButton, exportButton, moreButton };

        if (AppState.currentProvider && AppState.currentProvider.insertButtons(buttons)) {
            if (observer) observer.disconnect();
            attachMenusToBody();
            initExportModule();
            initSelectModule();
            initMoreModule();
        }
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
            </div>
        `;
        return selectButton;
    }

    function createSelectMenu() {
        const selectMenu = document.createElement('ul');
        selectMenu.id = 'select-menu';
        selectMenu.className = 'ace-dropdown-menu';
        selectMenu.innerHTML = `
            <li class="ace-menu-item" data-action="all">${chrome.i18n.getMessage('selectAll')}</li>
            <li class="ace-menu-item" data-action="user">${chrome.i18n.getMessage('selectUser')}</li>
            <li class="ace-menu-item" data-action="model">${chrome.i18n.getMessage('selectModel')}</li>
            <li class="ace-menu-item" data-action="cancel">${chrome.i18n.getMessage('cancelSelect')}</li>
        `;
        return selectMenu;
    }

    function createExportButton() {
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
            </div>
        `;
        return exportButton;
    }

    function createExportMenu() {
        const exportMenu = document.createElement('ul');
        exportMenu.id = 'export-menu';
        exportMenu.className = 'ace-dropdown-menu';
        exportMenu.innerHTML = `
            <li class="ace-menu-item" data-format="txt">${chrome.i18n.getMessage('exportAsText')}</li>
            <li class="ace-menu-item" data-format="md">${chrome.i18n.getMessage('exportAsMarkdown')}</li>
            <li class="ace-menu-item" data-format="clipboard">${chrome.i18n.getMessage('smartCopy')}</li>
            <li class="ace-menu-item" data-format="offline">${chrome.i18n.getMessage('exportOffline')}</li>
            <li class="ace-menu-item" data-format="screenshot">${chrome.i18n.getMessage('exportScreenshot')}</li>
        `;
        return exportMenu;
    }

    function createMoreButton() {
        const moreButton = document.createElement('div');
        moreButton.className = 'ace-export-button';
        moreButton.innerHTML = `
            <div class="ace-button-group">
                <button id="more-menu-btn" class="ace-my-button ace-more-menu-btn">
                    ${chrome.i18n.getMessage('moreBtn')}
                    <span class="ace-arrow ace-margin-left-arrow">▼</span>
                </button>
            </div>
        `;
        return moreButton;
    }

    function createMoreMenu() {
        const moreMenu = document.createElement('ul');
        moreMenu.id = 'more-menu';
        moreMenu.className = 'ace-dropdown-menu';
        moreMenu.innerHTML = '';

        const showClearHistoryMenu = AppState.currentProvider.showClearHistoryMenu ?? true;
        if (showClearHistoryMenu) {
            moreMenu.innerHTML += `
                <li class="ace-menu-item" id="clear-history-btn">
                    <span class="ace-menu-link" style="cursor: pointer;">
                        ${chrome.i18n.getMessage('clearHistory')}
                    </span>
                </li>
            `;
        }
        moreMenu.innerHTML += `
            <li class="ace-menu-item">
                <a href="https://hugbear.ai" target="_blank" class="ace-menu-link">
                    🚀 ${chrome.i18n.getMessage('moreTools')}
                </a>
            </li>
            <li class="ace-menu-item">
                <a href="https://ko-fi.com/qiyuanyang" target="_blank" class="ace-menu-link">
                    ❤️ ${chrome.i18n.getMessage('sponsor')}
                </a>
            </li>
        `;
        return moreMenu;
    }

    function updateMenuPosition(toggleBtn, menu) {
        if (!toggleBtn || !menu) return;
        const buttonGroup = toggleBtn.closest('.ace-button-group') || toggleBtn;
        const rect = buttonGroup.getBoundingClientRect();

        const isGoogleOverview = !!buttonGroup.closest('.ace-google-ai-overview-export, .ace-google-ai-overview-export-foot');
        if (isGoogleOverview) {
            menu.style.top = `${rect.bottom + 5}px`;
            menu.style.bottom = 'auto';
            menu.style.left = `${rect.left}px`;
            menu.style.right = 'auto';
            menu.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
        } else {
            const bottom = window.innerHeight - rect.top + 5;
            const right = Math.max(0, window.innerWidth - rect.right);
            menu.style.bottom = `${bottom}px`;
            menu.style.top = 'auto';
            menu.style.right = `${right}px`;
            menu.style.left = 'auto';
            menu.style.boxShadow = '';
        }
    }

    function setupDropdown(toggleBtn, menu) {
        if (!toggleBtn || !menu) return;

        toggleBtn.addEventListener('click', (event) => {
            event.stopPropagation();

            const allDropdowns = [
                { menuId: 'export-menu', toggleId: 'menu-toggle-btn' },
                { menuId: 'select-menu', toggleId: 'select-menu-toggle-btn' },
                { menuId: 'more-menu', toggleId: 'more-menu-btn' },
                { menuId: 'footer-export-menu', toggleId: 'footer-export-btn' }
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

            const willShow = !menu.classList.contains('ace-show');
            if (willShow) {
                updateMenuPosition(toggleBtn, menu);
                menu.classList.add('ace-show');
                toggleBtn.classList.add('ace-show-arrow');
            } else {
                menu.classList.remove('ace-show');
                toggleBtn.classList.remove('ace-show-arrow');
            }
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

        initExportMenu(menu, toggleBtn);
    }

    function initExportMenu(menu, toggleBtn) {
        if (!menu || !toggleBtn) return;

        menu.addEventListener('click', (event) => {
            const target = event.target.closest('.ace-menu-item');
            if (target) {
                const format = target.getAttribute('data-format');
                if (!format) return;
                
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
    }

    window.addEventListener('ace-copy-success', () => {
        const menu = document.getElementById('export-menu');
        if (!menu) return;

        const copyBtn = menu.querySelector('[data-format="clipboard"]');
        if (copyBtn) {
            const originalText = copyBtn.innerText;
            copyBtn.innerText = "✅ " + chrome.i18n.getMessage('copied');
            setTimeout(() => {
                copyBtn.innerText = originalText;
            }, 2000);
        }
    });

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

        menu.addEventListener('click', (event) => {
            if (event.target.closest('a')) {
                menu.classList.remove('ace-show');
                moreBtn.classList.remove('ace-show-arrow');
            }
        });

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

    function closeAllDropdowns() {
        const dropdowns = [
            { menuId: 'export-menu', toggleId: 'menu-toggle-btn' },
            { menuId: 'select-menu', toggleId: 'select-menu-toggle-btn' },
            { menuId: 'more-menu', toggleId: 'more-menu-btn' },
            { menuId: 'footer-export-menu', toggleId: 'footer-export-btn' }
        ];

        dropdowns.forEach(({ menuId, toggleId }) => {
            const menu = document.getElementById(menuId);
            const toggleBtn = document.getElementById(toggleId);
            if (menu && menu.classList.contains('ace-show')) {
                menu.classList.remove('ace-show');
                if (toggleBtn) {
                    toggleBtn.classList.remove('ace-show-arrow');
                }
            }
        });
    }

    window.addEventListener('click', (event) => {
        const dropdowns = [
            { menuId: 'export-menu', toggleId: 'menu-toggle-btn' },
            { menuId: 'select-menu', toggleId: 'select-menu-toggle-btn' },
            { menuId: 'more-menu', toggleId: 'more-menu-btn' },
            { menuId: 'footer-export-menu', toggleId: 'footer-export-btn' }
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

    window.addEventListener('scroll', (event) => {
        const dropdowns = [
            { menuId: 'export-menu', toggleId: 'menu-toggle-btn' },
            { menuId: 'select-menu', toggleId: 'select-menu-toggle-btn' },
            { menuId: 'more-menu', toggleId: 'more-menu-btn' },
            { menuId: 'footer-export-menu', toggleId: 'footer-export-btn' }
        ];

        dropdowns.forEach(({ menuId, toggleId }) => {
            const menu = document.getElementById(menuId);
            const toggleBtn = document.getElementById(toggleId);
            if (menu && menu.classList.contains('ace-show')) {
                if (event.target && menu.contains(event.target)) return;
                menu.classList.remove('ace-show');
                if (toggleBtn) {
                    toggleBtn.classList.remove('ace-show-arrow');
                }
            }
        });
    }, { passive: true, capture: true });

    window.addEventListener('resize', () => {
        closeAllDropdowns();
    }, { passive: true });

    global.ButtonCreator = ButtonCreator;
})(window);
