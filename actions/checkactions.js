(function(global){
    const CheckActions = {
        manageUserQueryCheckboxes: () => {
            manageCheckboxes('user');
        },

        manageContainerCheckboxes: () => {
            manageCheckboxes('model');
        }
    };

    function manageCheckboxes(type) {
        let selector = null;
        if (GeminiProvider.isApplicable()) {
            selector = type === 'user' 
                ? 'user-query'
                : 'message-content';
        } else if (ChatGPTProvider.isApplicable()) {
            selector = type === 'user' 
                ? 'div[data-message-author-role="user"]'
                : 'div[data-message-author-role="assistant"]';
        }

        const elements = document.querySelectorAll(selector);

        elements.forEach(item => {
            const alreadyExists = type === 'user' 
                ? (item.previousElementSibling && item.previousElementSibling.classList.contains('ace-model-label-tag'))
                : item.querySelector('.ace-model-label-tag');

            if (alreadyExists) {
                return;
            }

            const label = document.createElement('label');
            label.className = type == 'user' 
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
            type === 'user' 
                ? item.before(label)
                : item.prepend(label);

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
        });
    }

    global.CheckActions = CheckActions;
})(window);