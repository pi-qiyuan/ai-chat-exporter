(function(global){
    global.AppState = {
        currentProvider: null,
        inSelectMode: false
    };

    const Utils = {
        showToast: (message, duration = 3000) => {
            showToast(message, duration);
        },

        downloadText: (text, filename) => {
            downText(text, filename);
        }
    };

    function showToast(message, duration) {
        const toast = document.createElement('div');
        toast.className = 'ace-custom-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('ace-show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('ace-show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    function downText(text, filename) {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    global.Utils = Utils;
})(window);