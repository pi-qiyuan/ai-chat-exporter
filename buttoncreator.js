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

        const selectButton = document.createElement('button');
        selectButton.className = 'export-button';
        selectButton.innerHTML = `
            <div class="button-container">
                <button id="select-action-btn" class="single-button">
                    ${i18n.t('selectBtn')}
                </button>
            </div>
        `;

        const exportButton = document.createElement('button');
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
            initSelectButton();
        }

        if (observer) {
            observer.disconnect();
        }
    }

    function initExportModule() {
        const mainBtn = document.getElementById('main-export-btn');
        const toggleBtn = document.getElementById('menu-toggle-btn');
        const menu = document.getElementById('export-menu');
        const menuItems = document.querySelectorAll('.menu-item');

        if (!mainBtn || !toggleBtn || !menu) return;

        mainBtn.addEventListener('click', () => {
            CopyActions.handleExport('txt');
        });

        toggleBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            const isShowing = menu.classList.toggle('show');
            toggleBtn.classList.toggle('show-arrow', isShowing);
        });

        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const format = item.getAttribute('data-format');
                CopyActions.handleExport(format);
                menu.classList.remove('show');
                toggleBtn.classList.remove('show-arrow');
            });
        });

        window.addEventListener('click', (event) => {
            if (menu.classList.contains('show') && !menu.contains(event.target)) {
                menu.classList.remove('show');
                toggleBtn.classList.remove('show-arrow');
            }
        });
    }

    function initSelectButton() {
        const selectBtn = document.getElementById('select-action-btn');
        
        if (selectBtn) {
            selectBtn.addEventListener('click', function() {
                inSelectMode = true;
                CheckActions.manageUserQueryCheckboxes();
                CheckActions.manageContainerCheckboxes();
                Utils.showToast(i18n.t('noSelection'));
            });
        }
    }

    global.ButtonCreator = ButtonCreator;
})(window);
