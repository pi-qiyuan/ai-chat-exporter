document.addEventListener('DOMContentLoaded', () => {
    ButtonCreator.insertExportButton(observer);
});

const observer = new MutationObserver((mutationsList, obs) => {
    ButtonCreator.insertExportButton(obs);
});

const targetNode = document.documentElement;
const config = { childList: true, subtree: true };
if (targetNode) {
    observer.observe(targetNode, config);
}

let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        AppState.inSelectMode = false;
        document.querySelectorAll('.ace-custom-checkbox-container').forEach(container => container.remove());

        const observer = new MutationObserver((_mutationsList, obs) => {
            ButtonCreator.insertExportButton(obs);
        });
        observer.observe(targetNode, config);
    }

    if (!AppState.inSelectMode) {
        return;
    }
    CheckActions.manageUserQueryCheckboxes();
    CheckActions.manageContainerCheckboxes();
}).observe(document, {subtree: true, childList: true});

document.addEventListener('keydown', (event) => {
    if (event.key.toUpperCase() === 'E' && event.shiftKey && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();

        const exportButton = document.getElementById('main-export-btn');
        if (exportButton) {
            exportButton.click();
        }
    }
});