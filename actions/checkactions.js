(function(global){
    const CheckActions = {
        manageUserQueryCheckboxes: () => {
            manageUserQueryCheckboxes();
        },

        manageContainerCheckboxes: () => {
            manageContainerCheckboxes();
        }
    };

    function manageUserQueryCheckboxes() {
        const userQueryElements = document.querySelectorAll('user-query');
        if (userQueryElements.length === 0) {
            return;
        }

        userQueryElements.forEach((item, index) => {
            if (item.previousElementSibling && item.previousElementSibling.classList.contains('model-label-tag')) {
                return;
            }

            const label = document.createElement('label');
            label.className = 'model-label-tag';

            label.innerHTML = `
                <div class="custom-checkbox-container">
                    <input type="checkbox" class="hidden-checkpoint model-selector">
                    <span class="checkmark"></span>
                    <span class="label-text">${i18n.t("exportPrompt")}</span>
                </div>
            `;
            item.before(label);
        });
    }

    function manageContainerCheckboxes() {
        const containerElements = document.querySelectorAll('message-content');
        if (containerElements.length === 0) {
            return;
        }

        containerElements.forEach((item, index) => {
            if (item.querySelector('.model-label-tag')) return;

            const label = document.createElement('label');
            label.className = 'model-label-tag model-label-left';

            label.innerHTML = `
                <div class="custom-checkbox-container">
                    <input type="checkbox" class="hidden-checkpoint model-selector">
                    <span class="checkmark"></span>
                    <span class="label-text">${i18n.t("exportPrompt")}</span>
                </div>
            `;
            item.prepend(label);
        });
    }

    global.CheckActions = CheckActions;
})(window);
