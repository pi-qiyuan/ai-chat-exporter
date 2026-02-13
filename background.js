chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'downloadImage') {
        fetch(request.url)
            .then(response => response.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64Data = reader.result.split(',')[1];
                    sendResponse({ 
                        success: true, 
                        data: base64Data, 
                        contentType: blob.type 
                    });
                };
                reader.readAsDataURL(blob);
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }
});