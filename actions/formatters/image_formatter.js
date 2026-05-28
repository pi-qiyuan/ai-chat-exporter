(function(global) {
    const ImageFormatter = {
        init: () => {
            const container = createScreenshotContainer();
            document.body.appendChild(container);
            return container;
        },

        processItem: async (container, ctx, provider) => {
            const section = document.createElement('div');
            section.style.marginBottom = '30px';

            if (ctx.type === 'user') {
                if (provider.getTextContent(ctx) == "") {
                    return true;
                }
                appendScreenshotHeader(section, Utils.getHeaderTitle('user'));
                appendScreenshotContent(section, ctx, provider);
            } else if (ctx.type === 'model') {
                await appendScreenshotModelSection(section, ctx, provider);
            }

            const hr = document.createElement('hr');
            hr.style.border = '0';
            hr.style.borderTop = '1px solid #f0f0f0';
            hr.style.marginTop = '20px';
            section.appendChild(hr);

            container.appendChild(section);
            return true;
        },

        finalize: async (container) => {
            const footer = document.createElement('div');
            footer.style.fontSize = '12px';
            footer.style.color = '#999';
            footer.style.textAlign = 'center';
            footer.style.marginTop = '40px';
            
            footer.innerText = Utils.getExportFooter();
            container.appendChild(footer);

            try {
                const canvas = await html2canvas(container, {
                    backgroundColor: '#ffffff',
                    scale: 2
                });

                const filename = Utils.getFilename() + ".png";
                const dataUrl = canvas.toDataURL("image/png");

                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = filename;
                link.click();
            } catch (error) {
                Utils.showToast(chrome.i18n.getMessage("imageGenerateFailed"));
            } finally {
                document.body.removeChild(container);
            }
        }
    };

    function createScreenshotContainer() {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '800px';
        container.style.padding = '40px';
        container.style.backgroundColor = '#ffffff';
        container.style.boxSizing = 'border-box';
        container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
        return container;
    }

    function appendScreenshotHeader(section, text) {
        const header = document.createElement('h2');
        header.style.fontSize = '18px';
        header.style.borderBottom = '1px solid #eee';
        header.style.paddingBottom = '8px';
        header.style.color = '#1a73e8';
        header.innerText = text;
        section.appendChild(header);
    }

    function appendScreenshotContent(section, ctx, provider) {
        let target = provider && provider.getMarkdownTarget ? provider.getMarkdownTarget(ctx) : ctx.userQueryElement;
        if (!target) {
            return;
        }

        const contentDiv = document.createElement('div');
        contentDiv.style.fontSize = '15px';
        contentDiv.style.lineHeight = '1.6';
        contentDiv.innerHTML = target.innerHTML;
        section.appendChild(contentDiv);
    }

    async function appendScreenshotModelSection(section, ctx, provider) {
        let target = provider && provider.getMarkdownTarget ? provider.getMarkdownTarget(ctx) : ctx.messageContentWrapper;
        if (!target) return;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = target.innerHTML;

        let imgs = tempDiv.querySelectorAll('img');
        if (provider.name == 'ChatGPT' && target.matches('.relative.w-full.text-start')) {
            let parent = target.parentElement;
            if (parent.matches('.pb-2') && parent.nextElementSibling) {
                imgs = parent.nextElementSibling.querySelectorAll('img');
            }
        }
        imgs = Array.from(imgs);

        const modelHeaderTitle = Utils.getHeaderTitle('model');
        const contentDiv = document.createElement('div');
        contentDiv.style.fontSize = '15px';
        contentDiv.style.lineHeight = '2.5';
        contentDiv.innerHTML = tempDiv.innerHTML;

        if (imgs.length === 0) {
            appendScreenshotHeader(section, modelHeaderTitle);
            section.appendChild(contentDiv);
            return;
        }

        const userContext = Utils.findAssociatedUserQuery(ctx);
        if (userContext) {
            appendScreenshotHeader(section, Utils.getHeaderTitle('user'));
            appendScreenshotContent(section, userContext, provider);
            
            const userHr = document.createElement('hr');
            userHr.style.border = '0';
            userHr.style.borderTop = '1px solid #f0f0f0';
            section.appendChild(userHr);
        }

        appendScreenshotHeader(section, modelHeaderTitle);

        section.appendChild(contentDiv);

        const imagesContainer = document.createElement('div');

        let srcList = [];
        const imagePromises = imgs.map(async (img) => {
            if (img.src && !srcList.includes(img.src)) {
                srcList.push(img.src);
                return await downloadScreenshotImage(img.src);
            }
            return null;
        });

        const loadedImages = await Promise.all(imagePromises);
        loadedImages.forEach(imgElement => {
            if (imgElement) {
                imagesContainer.appendChild(imgElement);
            }
        });

        section.appendChild(imagesContainer);
    }

    async function downloadScreenshotImage(imgSrc) {
        try {
            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage({ action: 'downloadImage', url: imgSrc }, resolve);
            });
            if (response && response.success) {
                const newImg = document.createElement('img');
                newImg.src = `data:${response.contentType};base64,${response.data}`;
                newImg.style.maxWidth = '100%';
                newImg.style.display = 'block';
                newImg.style.margin = '10px 0';
                newImg.style.borderRadius = '4px';
                return newImg;
            }
        } catch (e) { }
        return null;
    }

    global.ImageFormatter = ImageFormatter;
})(window);