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
        },

        simpleHash: (str) => {
            return simpleHash(str);
        },

        extractText: element => extractText(element)
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

    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return hash.toString(36);
    }

    function extractText(container) {
        const rawText = getPerfectPlainText(container);

        return rawText
            .split('\n')
            .map(line => line.trim())
            .filter((line, index, arr) =>
                line !== '' || (arr[index - 1] !== '' && index > 0)
            )
            .join('\n')
            .trim();
    }

    function getPerfectPlainText(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent.replace(/\s+/g, ' ');
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return '';
        }

        const style = window.getComputedStyle(node);
        const display = style.display;

        if (display === 'none') return '';

        const tagName = node.tagName.toUpperCase();
        if (tagName === 'BR') return '\n';
        if (['SCRIPT', 'STYLE'].includes(tagName)) return '';

        const childrenText = Array.from(node.childNodes)
            .map(child => getPerfectPlainText(child))
            .join('');

        if (display === 'table-cell' || tagName === 'TD' || tagName === 'TH') {
            return childrenText.trim() + ' '; 
        }

        if (display === 'table-row' || tagName === 'TR') {
            return '\n' + childrenText.trim() + '\n';
        }

        const isBlock = !display.includes('inline') && display !== 'contents';

        if (isBlock) {
            return `\n${childrenText}\n`;
        }

        return childrenText;
    }

    global.Utils = Utils;
})(window);