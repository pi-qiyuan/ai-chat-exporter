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
        selectButton.className = 'export-button';
        selectButton.innerHTML = `
            <div class="button-group">
                <button id="select-action-btn" class="my-button">
                    ${i18n.t('selectBtn')}
                </button>
                <button id="select-menu-toggle-btn" class="dropdown-toggle">
                    <span class="arrow">▼</span>
                </button>
                <ul id="select-menu" class="dropdown-menu">
                    <li class="menu-item" data-action="all">${i18n.t('selectAll')}</li>
                    <li class="menu-item" data-action="user">${i18n.t('selectUser')}</li>
                    <li class="menu-item" data-action="model">${i18n.t('selectModel')}</li>
                </ul>
            </div>
        `;

        const exportButton = document.createElement('div');
        exportButton.className = 'export-button';
        exportButton.innerHTML = `
            <div class="button-group">
                <button id="main-export-btn" class="my-button">
                    ${i18n.t('exportBtn')}
                </button>
                <button id="menu-toggle-btn" class="dropdown-toggle">
                    <span class="arrow">▼</span>
                </button>
                
                <ul id="export-menu" class="dropdown-menu">
                    <li class="menu-item" data-format="txt">${i18n.t('exportAsText')}</li>
                    <li class="menu-item" data-format="md">${i18n.t('exportAsMarkdown')}</li>
                </ul>
            </div>
        `;

        if (targetElement.parentNode) {
            targetElement.parentNode.insertBefore(exportButton, targetElement.nextSibling);
            targetElement.parentNode.insertBefore(selectButton, targetElement.nextSibling);
            initExportModule();
            initSelectModule();
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
            const isShowing = menu.classList.toggle('show');
            toggleBtn.classList.toggle('show-arrow', isShowing);
        });

        menu.addEventListener('click', (event) => {
            const target = event.target;
            if (target.classList.contains('menu-item')) {
                const format = target.getAttribute('data-format');
                CopyActions.handleExport(format);
                menu.classList.remove('show');
                toggleBtn.classList.remove('show-arrow');
            }
        });

        window.addEventListener('click', (event) => {
            if (menu.classList.contains('show') && !menu.contains(event.target)) {
                menu.classList.remove('show');
                toggleBtn.classList.remove('show-arrow');
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
            Utils.showToast(i18n.t('noSelection'));
        });

        toggleBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            const isShowing = menu.classList.toggle('show');
            toggleBtn.classList.toggle('show-arrow', isShowing);
        });

        menu.addEventListener('click', (event) => {
            const target = event.target.closest('.menu-item');
            if (target) {
                const action = target.getAttribute('data-action');
                
                inSelectMode = true;
                CheckActions.manageUserQueryCheckboxes();
                CheckActions.manageContainerCheckboxes();

                setTimeout(() => {
                    const allCheckboxes = document.querySelectorAll('.model-selector');
                    
                    if (action === 'all') {
                        allCheckboxes.forEach(c => c.checked = true);
                    } else if (action === 'user') {
                        allCheckboxes.forEach(c => c.checked = false);
                        document.querySelectorAll('user-query').forEach(el => {
                            const checkbox = el.previousElementSibling?.querySelector('.model-selector');
                            if (checkbox) checkbox.checked = true;
                        });
                    } else if (action === 'model') {
                        allCheckboxes.forEach(c => c.checked = false);
                        document.querySelectorAll('message-content').forEach(el => {
                            const checkbox = el.querySelector('.model-selector');
                            if (checkbox) checkbox.checked = true;
                        });
                    }
                }, 50);

                menu.classList.remove('show');
                toggleBtn.classList.remove('show-arrow');
            }
        });

        window.addEventListener('click', (event) => {
            if (menu.classList.contains('show') && !menu.contains(event.target) && !toggleBtn.contains(event.target)) {
                menu.classList.remove('show');
                toggleBtn.classList.remove('show-arrow');
            }
        });
    }

    global.ButtonCreator = ButtonCreator;
})(window);