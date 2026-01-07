(function(global) {
    const ChatGPTProvider = {
        name: "ChatGPT",
        isApplicable: () => isApplicableInternal(),
        insertButtons: (buttons) => insertButtonsInternal(buttons),
        generateChatId: (item, type) => generateChatIdInternal(item, type)
    };

    function isApplicableInternal() {
        return window.location.hostname.includes('chatgpt.com');
    }

    function insertButtonsInternal(buttons) {
        const chatgptForm = document.querySelector('form.group\\/composer.w-full');
        if (!chatgptForm) {
            return false;
        }
        chatgptForm.style = 'border: 1px solid #ddd; border-radius: 28px;';

        const container = document.createElement('div');
        container.className = 'ace-chatgpt-container'; 
        
        chatgptForm.appendChild(container);
        container.appendChild(buttons.selectButton);
        container.appendChild(buttons.exportButton);
        container.appendChild(buttons.moreButton);

        return true;
    }

    function generateChatIdInternal(item, type) {
        let data_message_id = item.getAttribute('data-message-id');
        if (!data_message_id) {
            return null;
        }

        return `${type}_${data_message_id}`;
    }

    global.ChatGPTProvider = ChatGPTProvider;
})(window);
