(function(global){
    const CheckActions = {
        manageUserQueryCheckboxes: () => {
            manageCheckboxes('user-query', 'model-label-tag', (item, label) => item.before(label));
        },

        manageContainerCheckboxes: () => {
            manageCheckboxes('message-content', 'model-label-tag model-label-left', (item, label) => item.prepend(label));
        }
    };

    function manageCheckboxes(selector, labelClass, insertionLogic) {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
            return;
        }

        elements.forEach(item => {
            const alreadyExists = selector === 'user-query' 
                ? (item.previousElementSibling && item.previousElementSibling.classList.contains('model-label-tag'))
                : item.querySelector('.model-label-tag');

            if (alreadyExists) {
                return;
            }

            const label = document.createElement('label');
            label.className = labelClass;

            label.innerHTML = `
                <div class="custom-checkbox-container">
                    <input type="checkbox" class="hidden-checkpoint model-selector">
                    <span class="checkmark"></span>
                    <span class="label-text">${i18n.t("exportPrompt")}</span>
                </div>
            `;
            insertionLogic(item, label);
        });
    }

    global.CheckActions = CheckActions;
})(window);
