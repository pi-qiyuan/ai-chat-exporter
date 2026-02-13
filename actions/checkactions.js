(function(global){
    const CheckActions = {
        manageUserQueryCheckboxes: () => {
            manageCheckboxes('user');
        },

        manageContainerCheckboxes: () => {
            manageCheckboxes('model');
        },

        toggleSelection: (action) => {
            toggleSelectionInternal(action);
        }
    };

    function manageCheckboxes(type) {
        if (!AppState.currentProvider) return;

        const selector = AppState.currentProvider.selectors[type];
        if (!selector) return;

        const elements = document.querySelectorAll(selector);

        elements.forEach(item => {
            if (hasCheckbox(item, type)) {
                return;
            }

            const label = createCheckboxLabel(type);
            insertCheckbox(item, label, type);
            checkExportStatus(item, label, type);
        });
    }

    function hasCheckbox(item, type) {
        return type === 'user' 
            ? (item.previousElementSibling && item.previousElementSibling.classList.contains('ace-model-label-tag'))
            : item.querySelector('.ace-model-label-tag');
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
        const allCheckboxes = document.querySelectorAll('.ace-model-selector');

        if (action === 'all') {
            allCheckboxes.forEach(c => c.checked = true);
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