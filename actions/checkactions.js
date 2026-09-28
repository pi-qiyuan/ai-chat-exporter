(function(global){
    const CheckActions = {
        manageUserQueryCheckboxes: () => {
            if (AppState.currentProvider === global.GoogleAIProvider) return;
            manageCheckboxes('user');
        },

        manageContainerCheckboxes: () => {
            manageCheckboxes('model');
            if (AppState.currentProvider === global.GoogleAIProvider) {
                manageGoogleAIUserCheckboxes();
            }
        },

        toggleSelection: (action) => {
            toggleSelectionInternal(action);
        }
    };

    function manageCheckboxes(type) {
        if (!AppState.currentProvider) return;

        let elements = [];

        if (AppState.currentProvider.getSelectors) {
            elements = AppState.currentProvider.getSelectors(type);
        } else {
            const selector = AppState.currentProvider.selectors[type];
            if (!selector) return;
            elements = document.querySelectorAll(selector);
        }

        elements.forEach(item => {
            addCheckboxIfMissing(item, type);
        });
    }

    function manageGoogleAIUserCheckboxes() {
        const modelElements = AppState.currentProvider.getSelectors('model');
        const userElements = new Set();

        modelElements.forEach(modelItem => {
            const userContainer = modelItem.parentElement && modelItem.parentElement.firstElementChild;
            let userItem = userContainer && userContainer.firstElementChild;
            if (userItem && userItem.classList.contains('ace-checkbox-user')) {
                userItem = userItem.nextElementSibling;
            }
            userItem = userItem && userItem.firstElementChild;
            if (userItem && userItem.classList.contains('ace-checkbox-user')) {
                userItem = userItem.nextElementSibling;
            }
            if (userItem) userElements.add(userItem);
        });

        userElements.forEach(userItem => addCheckboxIfMissing(userItem, 'user'));
    }

    function addCheckboxIfMissing(item, type) {
        if (hasCheckbox(item, type)) return;

        const label = createCheckboxLabel(type);
        insertCheckbox(item, label, type);
        const checkbox = label.querySelector('.ace-model-selector');
        if (AppState.currentProvider.restoreCheckboxState) {
            AppState.currentProvider.restoreCheckboxState(item, type, checkbox);
        }
        checkExportStatus(item, label, type);
    }

    function hasCheckbox(item, type) {
        return type === 'user' 
            ? (item.previousElementSibling && item.previousElementSibling.classList.contains('ace-model-label-tag') && item.previousElementSibling.textContent.trim() != "")
            : (item.querySelector('.ace-model-label-tag') && item.querySelector('.ace-model-label-tag').textContent.trim() != "");
    }

    function createCheckboxLabel(type) {
        const label = document.createElement('label');
        label.className = type === 'user' 
            ? 'ace-model-label-tag ace-checkbox-user'
            : 'ace-model-label-tag ace-model-label-left ace-checkbox-model';

        label.innerHTML = `
            <div class="ace-custom-checkbox-container">
                <input type="checkbox" class="ace-hidden-checkpoint ace-model-selector">
                <span class="ace-checkmark"></span>
                <span class="ace-label-text">
                    ${chrome.i18n.getMessage("exportPrompt")}
                    <span class="ace-exported-status"></span>
                </span>
            </div>
        `;
        return label;
    }

    function insertCheckbox(item, label, type) {
        if (type === 'user') {
            item.before(label);
        } else {
            item.prepend(label);
        }
    }

    function checkExportStatus(item, label, type) {
        let chatId = StorageManager.generateChatId(item, type);
        if (chatId) {
            StorageManager.isIdExported(chatId).then(isExported => {
                if (isExported) {
                    const statusSpan = label.querySelector('.ace-exported-status');
                    if (statusSpan) {
                        statusSpan.innerText = chrome.i18n.getMessage("exportedTag");
                    }
                }
            });
        }
    }

    function toggleSelectionInternal(action) {
        const provider = AppState.currentProvider;
        if (provider && provider.setSelectionMode && provider.setSelectionMode(action)) {
            return;
        }

        const allCheckboxes = document.querySelectorAll('.ace-model-selector');

        if (action === 'all') {
            allCheckboxes.forEach(c => c.checked = true);
        } else if (action === 'cancel') {
            allCheckboxes.forEach(c => c.checked = false);
        } else {
            allCheckboxes.forEach(c => c.checked = false);

            if (action === 'user') {
                document.querySelectorAll('.ace-checkbox-user .ace-model-selector').forEach(c => c.checked = true);
            } else if (action === 'model') {
                document.querySelectorAll('.ace-checkbox-model .ace-model-selector').forEach(c => c.checked = true);
            }
        }
    }

    global.CheckActions = CheckActions;
})(window);
