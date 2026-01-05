(function(global){
    const ButtonCreator = {
        insertExportButton: (observer) => {
            insertExportButton(observer);
        }
    };

    function insertExportButton(observer) {
        const targetElement = document.querySelector('toolbox-drawer');
        if(!targetElement){
            return;
        }

        if (document.getElementById('exportButton')) {
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

        const exportButton = document.createElement('div');
        exportButton.className = 'ace-export-button';
        exportButton.innerHTML = `
            <div class="ace-button-group">
                <button id="main-export-btn" class="ace-my-button">
                    ${chrome.i18n.getMessage('exportBtn')}
                </button>
                <button id="menu-toggle-btn" class="ace-dropdown-toggle">
                    <span class="ace-arrow">▼</span>
                </button>
                
                <ul id="export-menu" class="ace-dropdown-menu">
                    <li class="ace-menu-item" data-format="txt">${chrome.i18n.getMessage('exportAsText')}</li>
                    <li class="ace-menu-item" data-format="md">${chrome.i18n.getMessage('exportAsMarkdown')}</li>
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
                        <a href="https://github.com/pi-qiyuan/ai-chat-exporter/blob/main/PRIVACY.md" target="_blank" class="ace-menu-link">
                            ${chrome.i18n.getMessage('privacyPolicy')}
                        </a>
                    </li>
                    <li class="ace-menu-item">
                        <a href="https://github.com/pi-qiyuan/ai-chat-exporter/issues" target="_blank" class="ace-menu-link">
                            ${chrome.i18n.getMessage('feedback')}
                        </a>
                    </li>
                    <li class="ace-menu-item">
                        <a href="https://github.com/pi-qiyuan/ai-chat-exporter" target="_blank" class="ace-menu-link">
                            ${chrome.i18n.getMessage('donate')}
                        </a>
                    </li>
                </ul>
            </div>
        `;

        if (targetElement.parentNode) {
            targetElement.parentNode.insertBefore(moreButton, targetElement.nextSibling);
            targetElement.parentNode.insertBefore(exportButton, targetElement.nextSibling);
            targetElement.parentNode.insertBefore(selectButton, targetElement.nextSibling);
            initExportModule();
            initSelectModule();
            initMoreModule();
        }

        if (observer) {
            observer.disconnect();
        }
    }

    function initExportModule() {
        const mainBtn = document.getElementById('main-export-btn');
        const toggleBtn = document.getElementById('menu-toggle-btn');
        const menu = document.getElementById('export-menu');

        if (!mainBtn || !toggleBtn || !menu) return;

        mainBtn.addEventListener('click', () => {
            CopyActions.handleExport('txt');
        });

        toggleBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            const isShowing = menu.classList.toggle('ace-show');
            toggleBtn.classList.toggle('ace-show-arrow', isShowing);
        });

        menu.addEventListener('click', (event) => {
            const target = event.target;
            if (target.classList.contains('ace-menu-item')) {
                const format = target.getAttribute('data-format');
                CopyActions.handleExport(format);
                menu.classList.remove('ace-show');
                toggleBtn.classList.remove('ace-show-arrow');
            }
        });

        window.addEventListener('click', (event) => {
            if (menu.classList.contains('ace-show') && !menu.contains(event.target)) {
                menu.classList.remove('ace-show');
                toggleBtn.classList.remove('ace-show-arrow');
            }
        });
    }

    function initSelectModule() {
        const selectBtn = document.getElementById('select-action-btn');
        const toggleBtn = document.getElementById('select-menu-toggle-btn');
        const menu = document.getElementById('select-menu');

        if (!selectBtn || !toggleBtn || !menu) return;

        selectBtn.addEventListener('click', function() {
            inSelectMode = true;
            CheckActions.manageUserQueryCheckboxes();
            CheckActions.manageContainerCheckboxes();
            Utils.showToast(chrome.i18n.getMessage('noSelection'));
        });

        toggleBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            const isShowing = menu.classList.toggle('ace-show');
            toggleBtn.classList.toggle('ace-show-arrow', isShowing);
        });

        menu.addEventListener('click', (event) => {
            const target = event.target.closest('.ace-menu-item');
            if (target) {
                const action = target.getAttribute('data-action');
                
                inSelectMode = true;
                CheckActions.manageUserQueryCheckboxes();
                CheckActions.manageContainerCheckboxes();

                setTimeout(() => {
                    const allCheckboxes = document.querySelectorAll('.ace-model-selector');
                    
                    if (action === 'all') {
                        allCheckboxes.forEach(c => c.checked = true);
                    } else if (action === 'user') {
                        allCheckboxes.forEach(c => c.checked = false);
                        document.querySelectorAll('user-query').forEach(el => {
                            const checkbox = el.previousElementSibling?.querySelector('.ace-model-selector');
                            if (checkbox) checkbox.checked = true;
                        });
                    } else if (action === 'model') {
                        allCheckboxes.forEach(c => c.checked = false);
                        document.querySelectorAll('message-content').forEach(el => {
                            const checkbox = el.querySelector('.ace-model-selector');
                            if (checkbox) checkbox.checked = true;
                        });
                    }
                }, 50);

                menu.classList.remove('ace-show');
                toggleBtn.classList.remove('ace-show-arrow');
            }
        });

        window.addEventListener('click', (event) => {
            if (menu.classList.contains('ace-show') && !menu.contains(event.target) && !toggleBtn.contains(event.target)) {
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

        moreBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            const isShowing = menu.classList.toggle('ace-show');
            moreBtn.classList.toggle('ace-show-arrow', isShowing);
        });

        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', async () => {
                await StorageManager.removeGeminiIds();

                const statusSpans = document.querySelectorAll('.ace-exported-status');
                statusSpans.forEach(span => {
                    span.innerText = '';
                });

                Utils.showToast(chrome.i18n.getMessage('historyCleared'));
                menu.classList.remove('ace-show');
                moreBtn.classList.remove('ace-show-arrow');
            });
        }

        window.addEventListener('click', (event) => {
            if (menu.classList.contains('ace-show') && !menu.contains(event.target)) {
                menu.classList.remove('ace-show');
                moreBtn.classList.remove('ace-show-arrow');
            }
        });
    }

    global.ButtonCreator = ButtonCreator;
})(window);