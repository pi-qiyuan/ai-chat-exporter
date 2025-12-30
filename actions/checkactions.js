(function(global){
    const CheckActions = {
        manageUserQueryCheckboxes: () => {
            manageCheckboxes('user-query', 'ace-model-label-tag', (item, label) => item.before(label));
        },

        manageContainerCheckboxes: () => {
            manageCheckboxes('message-content', 'ace-model-label-tag ace-model-label-left', (item, label) => item.prepend(label));
        }
    };

    function manageCheckboxes(selector, labelClass, insertionLogic) {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
            return;
        }

        elements.forEach(item => {
            const alreadyExists = selector === 'user-query' 
                ? (item.previousElementSibling && item.previousElementSibling.classList.contains('ace-model-label-tag'))
                : item.querySelector('.ace-model-label-tag');

            if (alreadyExists) {
                return;
            }

            const label = document.createElement('label');
            label.className = labelClass;

            label.innerHTML = `
                <div class="ace-custom-checkbox-container">
                    <input type="checkbox" class="ace-hidden-checkpoint ace-model-selector">
                    <span class="ace-checkmark"></span>
                    <span class="ace-label-text">${chrome.i18n.getMessage("exportPrompt")}</span>
                </div>
            `;
            insertionLogic(item, label);
        });
    }

    global.CheckActions = CheckActions;
})(window);