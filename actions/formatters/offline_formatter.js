(function(global) {
    const OfflineFormatter = {
        processItem: async (ctx, provider, imgFolder, imageCounter) => {
            if (ctx.type === 'user') {
                return getOfflineUserHtml(ctx, provider);
            } else if (ctx.type === 'model') {
                return await getOfflineModelHtml(ctx, provider, imgFolder, imageCounter);
            }
            return "";
        },

        generateAndDownloadZip: async (zip, fullHtmlContent) => {
            const footerText = Utils.getExportFooter();

            const finalHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${Utils.getFilename()}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
        img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h2 { border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 40px; color: #1a73e8; }
        hr { border: 0; border-top: 1px solid #eee; margin: 40px 0; }
        .footer { font-size: 12px; color: #888; text-align: center; margin-top: 60px; }
    </style>
</head>
<body>
    ${fullHtmlContent}
    <div class="footer">${footerText}</div>
</body>
</html>`;

            zip.file("index.html", finalHtml);
            const defaultFilename = Utils.getFilename() + ".zip";
            const newFilename = await Utils.showFilenamePrompt(defaultFilename);
            if (newFilename) {
                const content = await zip.generateAsync({ type: "blob" });
                const url = URL.createObjectURL(content);
                const a = document.createElement("a");
                a.href = url;
                a.download = newFilename;
                a.click();
                URL.revokeObjectURL(url);
                return true;
            }
            return false;
        }
    };

    function getOfflineUserHtml(ctx, provider) {
        const headerTitle = Utils.getHeaderTitle('user');
        const sectionHeader = `<h2>${headerTitle}</h2>\n`;
        let target = provider && provider.getMarkdownTarget ? provider.getMarkdownTarget(ctx) : null;
        if (target) {
            return `${sectionHeader}${target.innerHTML}\n<hr>\n`;
        }
        return "";
    }

    async function getOfflineModelHtml(ctx, provider, imgFolder, imageCounter) {
        let target = provider && provider.getMarkdownTarget ? provider.getMarkdownTarget(ctx) : ctx.messageContentWrapper;
        if (!target) return "";

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = target.innerHTML;

        tempDiv.querySelectorAll('div.opacity-0').forEach(el => el.remove());

        let imgs = tempDiv.querySelectorAll('img');
        if (provider.name == 'ChatGPT' && target.matches('.relative.w-full.text-start')) {
            let parent = target.parentElement;
            if (parent.matches('.pb-2') && parent.nextElementSibling) {
                imgs = parent.nextElementSibling.querySelectorAll('img');
            }
        }

        const headerTitle = Utils.getHeaderTitle('model');
        const sectionHeader = `<h2>${headerTitle}</h2>\n`;

        if (imgs.length === 0) {
            return `${sectionHeader}${tempDiv.innerHTML}\n<hr>\n`;
        }

        let htmlAccumulator = "";
        const userContext = Utils.findAssociatedUserQuery(ctx);
        if (userContext) {
            htmlAccumulator += getOfflineUserHtml(userContext, provider);
        }

        let onlyImagesHtml = "";
        let srcList = [];
        for (const img of imgs) {
            if (img.src && !srcList.includes(img.src)) {
                srcList.push(img.src);
                const imgHtml = await downloadAndProcessOfflineImage(img.src, imgFolder, imageCounter);
                if (imgHtml) onlyImagesHtml += imgHtml;
            }
        }

        if (provider.name == 'ChatGPT') {
            htmlAccumulator += `${sectionHeader}${tempDiv.innerHTML}\n<hr>\n${onlyImagesHtml}\n<hr>\n`;
        } else {
            htmlAccumulator += `${sectionHeader}${onlyImagesHtml}\n<hr>\n`;
        }

        return htmlAccumulator;
    }

    async function downloadAndProcessOfflineImage(imgSrc, imgFolder, imageCounter) {
        try {
            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage({ action: 'downloadImage', url: imgSrc }, resolve);
            });

            if (response && response.success) {
                imageCounter.count++;
                const ext = response.contentType.split('/')[1] || 'png';
                const imgName = `image_${imageCounter.count}.${ext}`;
                imgFolder.file(imgName, response.data, { base64: true });
                return `<img src="./images/${imgName}" style="max-width: 100%; height: auto; display: block; margin: 10px 0;">\n`;
            }
        } catch (e) {
            console.error("Image download failed:", imgSrc, e);
        }
        return "";
    }

    global.OfflineFormatter = OfflineFormatter;
})(window);