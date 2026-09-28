(function(global) {
    // Only plain strings are retained here. Never retain recycled ChatGPT DOM nodes.
    const conversationSessions = new Map();
    const STREAM_SNAPSHOT_INTERVAL_MS = 300;
    let snapshotTimer = null;
    let domSnapshotScanPending = false;
    let fullScanPromise = null;
    let fallbackMessageSequence = 0;
    const fallbackMessageIds = new WeakMap();

    const ChatGPTProvider = {
        name: "ChatGPT",
        selectors: {
            user: 'div[data-message-author-role="user"]',
            model: 'div[data-message-author-role="assistant"]',
            chatForm: 'form.group\\/composer.w-full',
            chatTitle: 'a[data-active]',
            markdownContent: 'div[class^="markdown"],div.relative.w-full.text-start',
            codeBlock: 'code[class*="whitespace-pre!"][class*="language-"]'
        },
        insertButtons: (buttons) => insertButtonsInternal(buttons),
        generateChatId: (item, type) => generateChatIdInternal(item, type),
        getFilename: () => getFilenameInternal(),
        getTextContent: (context) => getTextContentInternal(context),
        getMarkdownTarget: (context) => getMarkdownTargetInternal(context),
        getCodeLanguage: (node) => getCodeLanguageInternal(node),
        restoreCheckboxState: (item, type, checkbox) => restoreCheckboxStateInternal(item, type, checkbox),
        setSelectionMode: (action) => setSelectionModeInternal(action),
        handleMutations: (records) => handleMutationsInternal(records),
        flushPendingSnapshots: () => flushPendingSnapshotsInternal(),
        prepareFullExport: () => prepareFullExportInternal(),
        hasActiveSelection: () => hasActiveSelectionInternal(),
        getSelectedExportContexts: () => getSelectedExportContextsInternal(),
        clearSelectedExportContexts: (contexts) => clearSelectedExportContextsInternal(contexts)
    };

    document.addEventListener('change', (event) => {
        const checkbox = event.target;
        if (!checkbox || !checkbox.matches || !checkbox.matches('.ace-model-selector')) return;
        if (AppState.currentProvider !== ChatGPTProvider) return;

        handleManualCheckboxChange(checkbox);
    });

    function insertButtonsInternal(buttons) {
        const chatgptForm = document.querySelector(ChatGPTProvider.selectors.chatForm);
        if (!chatgptForm) {
            return false;
        }
        chatgptForm.classList.add('ace-chatgpt-chatform');

        const container = document.createElement('div');
        container.className = 'ace-chatgpt-container'; 

        chatgptForm.appendChild(container);
        container.appendChild(buttons.selectButton);
        container.appendChild(buttons.exportButton);
        container.appendChild(buttons.moreButton);

        return true;
    }

    function generateChatIdInternal(item, type) {
        if (!item || !item.matches) return null;

        const selector = ChatGPTProvider.selectors[type];
        const messageNode = item.matches(selector)
            ? item
            : item.closest(selector) || item.querySelector(selector);
        if (!messageNode) return null;

        const turn = messageNode.closest('[data-turn-id]');
        if (turn) {
            const turnId = turn.getAttribute('data-turn-id');
            const roleMessages = getRoleMessagesWithin(turn, type);
            const roleIndex = roleMessages.indexOf(messageNode);
            const suffix = roleMessages.length > 1 ? `_${roleIndex}` : '';
            return `${type}_${turnId}${suffix}`;
        }

        const messageId = messageNode.getAttribute('data-message-id') ||
            messageNode.getAttribute('data-message-uuid');
        if (messageId) return `${type}_${messageId}`;

        const numberedTurn = messageNode.closest('[data-testid^="conversation-turn-"]');
        const testId = numberedTurn && numberedTurn.getAttribute('data-testid');
        if (testId) {
            const roleMessages = getRoleMessagesWithin(numberedTurn, type);
            const roleIndex = roleMessages.indexOf(messageNode);
            const suffix = roleMessages.length > 1 ? `_${roleIndex}` : '';
            return `${type}_${testId}${suffix}`;
        }

        if (!fallbackMessageIds.has(messageNode)) {
            fallbackMessageIds.set(messageNode, ++fallbackMessageSequence);
        }
        return `${type}_dom_${fallbackMessageIds.get(messageNode)}`;
    }

    function getRoleMessagesWithin(root, type) {
        const selector = ChatGPTProvider.selectors[type];
        const messages = [];
        if (root.matches && root.matches(selector)) messages.push(root);
        messages.push(...root.querySelectorAll(selector));
        return messages;
    }

    function getFilenameInternal() {
        return Utils.getProviderFilename(ChatGPTProvider.selectors.chatTitle, ChatGPTProvider.name);
    }

    function getTextContentInternal(ctx) {
        if (typeof ctx.text === 'string') {
            return ctx.text;
        }

        if (ctx.type === 'user') {
            return ctx.userQueryElement ? ctx.userQueryElement.textContent : '';
        } 

        if (ctx.type === 'model') {
            const nextDiv = ctx.labelTag ? ctx.labelTag.nextElementSibling : null;
            return nextDiv ? nextDiv.textContent : "";
        }

        return "";
    }

    function getMarkdownTargetInternal(ctx) {
        if (typeof ctx.html === 'string') {
            const target = document.createElement('div');
            target.innerHTML = ctx.html;
            return target;
        }

        if (ctx.type === 'user') {
            return ctx.userQueryElement;
        } else if (ctx.type === 'model') {
            const model = ctx.checkbox && ctx.checkbox.closest(ChatGPTProvider.selectors.model);
            return model ? model.querySelector(ChatGPTProvider.selectors.markdownContent) : null;
        }
        return null;
    }

    function getConversationKey() {
        const routeKey = `${location.origin}${location.pathname}${location.search}`;
        if (/^\/c\/[^/]+/.test(location.pathname)) return routeKey;

        const activeConversation = document.querySelector(ChatGPTProvider.selectors.chatTitle);
        return activeConversation && activeConversation.href
            ? activeConversation.href
            : routeKey;
    }

    function getCurrentSession() {
        const key = getConversationKey();
        if (!conversationSessions.has(key)) {
            conversationSessions.set(key, {
                snapshots: new Map(),
                orderedIds: [],
                orderById: new Map(),
                selection: {
                    mode: 'none',
                    forceSelected: new Set(),
                    forceDeselected: new Set()
                }
            });
        }
        const session = conversationSessions.get(key);
        session.lastAccessed = Date.now();
        return { key, snapshots: session.snapshots, session };
    }

    function getCheckboxMessage(checkbox) {
        const labelTag = checkbox && checkbox.closest('.ace-model-label-tag');
        if (!labelTag) return null;

        const type = labelTag.classList.contains('ace-checkbox-user') ? 'user' : 'model';
        const contentElement = type === 'user'
            ? labelTag.nextElementSibling
            : labelTag.parentElement;
        const chatId = contentElement ? generateChatIdInternal(contentElement, type) : null;
        if (!contentElement || !chatId) return null;

        const markdownTarget = type === 'user'
            ? contentElement
            : contentElement.querySelector(ChatGPTProvider.selectors.markdownContent);
        const textTarget = markdownTarget || (type === 'model' ? labelTag.nextElementSibling : contentElement);
        if (!textTarget) return null;

        return {
            chatId,
            type,
            turnOrder: getTurnOrderIndex(contentElement),
            markdownTarget: markdownTarget || textTarget,
            textTarget
        };
    }

    function saveCheckboxSnapshot(checkbox, shouldSynchronizeOrder = true) {
        const message = getCheckboxMessage(checkbox);
        if (!message) return false;

        const { snapshots } = getCurrentSession();
        if (snapshots.has(message.chatId)) return true;
        return saveMessageSnapshot(message, shouldSynchronizeOrder);
    }

    function saveMessageSnapshot(message, shouldSynchronizeOrder = true) {
        if (!message || !message.chatId || !message.textTarget || !message.markdownTarget) return false;

        const { key, snapshots, session } = getCurrentSession();
        if (shouldSynchronizeOrder) synchronizeMessageOrder(session);
        const textTarget = cloneWithoutExtensionControls(message.textTarget);
        const markdownTarget = cloneWithoutExtensionControls(message.markdownTarget);
        const snapshot = {
            __aceExportContext: true,
            conversationKey: key,
            chatId: message.chatId,
            type: message.type,
            turnOrder: message.turnOrder ?? null,
            text: textTarget.textContent || '',
            html: markdownTarget.innerHTML || ''
        };
        if (Number.isInteger(snapshot.turnOrder)) {
            session.orderById.set(message.chatId, snapshot.turnOrder);
        }
        snapshots.set(message.chatId, snapshot);
        return true;
    }

    function cloneWithoutExtensionControls(target) {
        const clone = target.cloneNode(true);
        const extensionControls = '.ace-model-label-tag, .ace-custom-checkbox-container, .ace-chatgpt-container';
        if (clone.matches && clone.matches(extensionControls)) {
            return document.createElement('div');
        }
        clone.querySelectorAll(extensionControls).forEach(element => element.remove());
        return clone;
    }

    function restoreCheckboxStateInternal(item, type, checkbox) {
        const chatId = generateChatIdInternal(item, type);
        if (!chatId || !checkbox) return;

        const { session } = getCurrentSession();
        checkbox.checked = isMessageSelected(session, { chatId, type });
        // Re-rendered checkboxes restore selection without replacing cached content.
        if (checkbox.checked && !saveCheckboxSnapshot(checkbox)) {
            checkbox.checked = false;
            session.selection.forceDeselected.add(chatId);
        }
    }

    function setSelectionModeInternal(action) {
        const { session } = getCurrentSession();
        const modeByAction = {
            all: 'all',
            user: 'user',
            model: 'model',
            cancel: 'none'
        };
        const mode = modeByAction[action];
        if (!mode) return false;

        session.selection.mode = mode;
        session.selection.forceSelected.clear();
        session.selection.forceDeselected.clear();

        synchronizeMessageOrder(session);
        for (const checkbox of document.querySelectorAll('.ace-model-selector')) {
            const message = getCheckboxMessage(checkbox);
            if (!message) continue;

            const selected = isMessageSelected(session, message);
            checkbox.checked = selected;
            if (selected) {
                if (!saveCheckboxSnapshot(checkbox, false)) {
                    checkbox.checked = false;
                    session.selection.forceDeselected.add(message.chatId);
                }
            }
        }
        return true;
    }

    function handleManualCheckboxChange(checkbox) {
        const message = getCheckboxMessage(checkbox);
        if (!message) return;

        const { session } = getCurrentSession();
        const selectedByMode = matchesSelectionMode(session.selection.mode, message.type);
        if (checkbox.checked) {
            if (selectedByMode) {
                session.selection.forceDeselected.delete(message.chatId);
            } else {
                session.selection.forceSelected.add(message.chatId);
            }
            if (!saveCheckboxSnapshot(checkbox)) {
                checkbox.checked = false;
                session.selection.forceSelected.delete(message.chatId);
                session.selection.forceDeselected.add(message.chatId);
            }
        } else {
            if (selectedByMode) {
                session.selection.forceDeselected.add(message.chatId);
            } else {
                session.selection.forceSelected.delete(message.chatId);
            }
        }
    }

    function isMessageSelected(session, message) {
        if (session.selection.forceDeselected.has(message.chatId)) return false;
        if (session.selection.forceSelected.has(message.chatId)) return true;
        return matchesSelectionMode(session.selection.mode, message.type);
    }

    function matchesSelectionMode(mode, type) {
        return mode === 'all' || mode === type;
    }

    function getSelectedExportContextsInternal() {
        const { session, snapshots } = getCurrentSession();
        const contexts = [];
        const includedIds = new Set();

        for (const chatId of session.orderedIds) {
            const context = snapshots.get(chatId);
            if (context && isMessageSelected(session, context)) {
                contexts.push(context);
                includedIds.add(chatId);
            }
        }

        // A message can be selected before its virtual-list position is observable.
        for (const [chatId, context] of snapshots) {
            if (!includedIds.has(chatId) && isMessageSelected(session, context)) contexts.push(context);
        }
        return contexts;
    }

    function hasActiveSelectionInternal() {
        const { session } = getCurrentSession();
        return session.selection.mode !== 'none' || session.selection.forceSelected.size > 0;
    }

    function clearSelectedExportContextsInternal(contexts) {
        const current = getCurrentSession();
        let clearsCurrentSession = false;
        for (const context of contexts || []) {
            if (!context || !context.chatId) continue;
            const conversationKey = context.conversationKey || current.key;
            const session = conversationSessions.get(conversationKey);
            if (session && session.snapshots.has(context.chatId) && conversationKey === current.key) {
                clearsCurrentSession = true;
            }
        }

        // Export has historically finished a selection session. Keep that behaviour
        // even when the selection was supplied by a persistent all/user/model rule.
        if (clearsCurrentSession) {
            current.session.selection.mode = 'none';
            current.session.selection.forceSelected.clear();
            current.session.selection.forceDeselected.clear();
        }
    }

    function getTurnOrderIndex(node) {
        const turn = node && node.closest('[data-testid^="conversation-turn-"]');
        const testId = turn && turn.getAttribute('data-testid');
        const match = testId && /^conversation-turn-(\d+)$/.exec(testId);
        return match ? Number(match[1]) : null;
    }

    function handleMutationsInternal(records) {
        let foundPageMutation = false;
        for (const record of records) {
            if (isExtensionMutation(record)) continue;
            foundPageMutation = true;

            if (record.type === 'childList') {
                for (const node of record.removedNodes) {
                    snapshotRemovedNode(node);
                }
            }
        }
        if (foundPageMutation) {
            domSnapshotScanPending = true;
            scheduleSnapshotFlush();
        }
    }

    function isExtensionMutation(record) {
        const target = record.target.nodeType === Node.ELEMENT_NODE
            ? record.target
            : record.target.parentElement;
        return !!(target && target.closest('.ace-model-label-tag, .ace-chatgpt-container'));
    }

    function snapshotRemovedNode(node) {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        for (const message of getVisibleMessages(node)) {
            // Cache every rendered message before its DOM subtree is detached.
            saveMessageSnapshot(message, false);
        }
    }

    function scheduleSnapshotFlush() {
        if (snapshotTimer || !domSnapshotScanPending) return;
        snapshotTimer = setTimeout(() => {
            snapshotTimer = null;
            flushPendingSnapshotsInternal();
        }, STREAM_SNAPSHOT_INTERVAL_MS);
    }

    function flushPendingSnapshotsInternal() {
        if (snapshotTimer) {
            clearTimeout(snapshotTimer);
            snapshotTimer = null;
        }
        domSnapshotScanPending = false;
        const { session } = getCurrentSession();
        const visibleMessages = getVisibleMessages();
        synchronizeMessageOrder(session);
        for (const message of visibleMessages) saveMessageSnapshot(message, false);
    }

    function prepareFullExportInternal() {
        const { session } = getCurrentSession();
        if (session.selection.mode === 'none') return Promise.resolve(true);
        if (fullScanPromise) return fullScanPromise;

        fullScanPromise = scanVirtualConversation(session)
            .catch((error) => {
                Utils.showToast(`Unable to collect the complete conversation: ${error.message}`);
                return false;
            })
            .finally(() => {
                fullScanPromise = null;
            });
        return fullScanPromise;
    }

    async function scanVirtualConversation(session) {
        const scrollContainer = findConversationScrollContainer();
        if (!scrollContainer) {
            throw new Error('conversation scroll container was not found');
        }

        const initialScrollTop = scrollContainer.scrollTop;
        const step = Math.max(400, Math.floor(scrollContainer.clientHeight * 0.8));
        const maximumSteps = 1000;
        Utils.showToast('Collecting the complete conversation…');

        try {
            scrollContainer.scrollTop = 0;
            await waitForVirtualListRender();

            for (let stepIndex = 0; stepIndex < maximumSteps; stepIndex++) {
                if (!captureVisibleSelectedMessages(session)) {
                    throw new Error('selected export cache limit reached');
                }

                const currentTop = scrollContainer.scrollTop;
                const maximumTop = Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight);
                if (currentTop >= maximumTop) {
                    if (!captureVisibleSelectedMessages(session)) {
                        throw new Error('selected export cache limit reached');
                    }
                    return true;
                }

                scrollContainer.scrollTop = Math.min(maximumTop, currentTop + step);
                await waitForVirtualListRender();
            }
            throw new Error('scan step limit reached');
        } finally {
            scrollContainer.scrollTop = initialScrollTop;
            await waitForVirtualListRender();
        }
    }

    function captureVisibleSelectedMessages(session) {
        synchronizeMessageOrder(session);
        for (const message of getVisibleMessages()) {
            if (session.snapshots.has(message.chatId)) continue;
            if (!saveMessageSnapshot(message, false)) return false;
        }
        return true;
    }

    function findConversationScrollContainer() {
        const firstMessage = getVisibleMessages()[0];
        let node = firstMessage && firstMessage.node;
        while (node && node !== document.body) {
            const style = getComputedStyle(node);
            if (node.scrollHeight > node.clientHeight + 1 && /auto|scroll/.test(style.overflowY)) {
                return node;
            }
            node = node.parentElement;
        }
        return document.scrollingElement && document.scrollingElement.scrollHeight > document.scrollingElement.clientHeight
            ? document.scrollingElement
            : null;
    }

    function waitForVirtualListRender() {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setTimeout(resolve, 80));
            });
        });
    }

    function synchronizeMessageOrder(session) {
        const visibleMessages = getVisibleMessages();
        const visibleIds = visibleMessages.map(message => message.chatId);
        const unanchoredIds = [];

        for (const message of visibleMessages) {
            if (Number.isInteger(message.turnOrder)) {
                session.orderById.set(message.chatId, message.turnOrder);
            }
        }

        for (let index = 0; index < visibleIds.length; index++) {
            const chatId = visibleIds[index];
            if (session.orderedIds.includes(chatId)) continue;

            const turnOrder = session.orderById.get(chatId);
            const numberedIndexes = [];
            for (let orderedIndex = 0; orderedIndex < session.orderedIds.length; orderedIndex++) {
                if (Number.isInteger(session.orderById.get(session.orderedIds[orderedIndex]))) {
                    numberedIndexes.push(orderedIndex);
                }
            }

            if (Number.isInteger(turnOrder) && numberedIndexes.length > 0) {
                const nextNumberedIndex = numberedIndexes.find(orderedIndex =>
                    session.orderById.get(session.orderedIds[orderedIndex]) > turnOrder
                );
                if (nextNumberedIndex !== undefined) {
                    session.orderedIds.splice(nextNumberedIndex, 0, chatId);
                } else {
                    const lastNumberedIndex = numberedIndexes[numberedIndexes.length - 1];
                    session.orderedIds.splice(lastNumberedIndex + 1, 0, chatId);
                }
                continue;
            }

            let previousIndex = -1;
            for (let previous = index - 1; previous >= 0; previous--) {
                previousIndex = session.orderedIds.indexOf(visibleIds[previous]);
                if (previousIndex !== -1) break;
            }

            let nextIndex = -1;
            for (let next = index + 1; next < visibleIds.length; next++) {
                nextIndex = session.orderedIds.indexOf(visibleIds[next]);
                if (nextIndex !== -1) break;
            }

            if (previousIndex !== -1 && nextIndex !== -1 && previousIndex < nextIndex) {
                session.orderedIds.splice(previousIndex + 1, 0, chatId);
            } else if (previousIndex !== -1 && nextIndex === -1) {
                session.orderedIds.splice(previousIndex + 1, 0, chatId);
            } else if (nextIndex !== -1 && previousIndex === -1) {
                session.orderedIds.splice(nextIndex, 0, chatId);
            } else if (nextIndex !== -1) {
                session.orderedIds.splice(nextIndex, 0, chatId);
            } else {
                unanchoredIds.push(chatId);
            }
        }

        // Resolve unanchored IDs against other IDs from this same DOM batch first.
        // A fully unanchored batch is inserted at the front in its original DOM order.
        for (const chatId of unanchoredIds) {
            const visibleIndex = visibleIds.indexOf(chatId);
            let previousIndex = -1;
            for (let previous = visibleIndex - 1; previous >= 0; previous--) {
                previousIndex = session.orderedIds.indexOf(visibleIds[previous]);
                if (previousIndex !== -1) break;
            }

            let nextIndex = -1;
            for (let next = visibleIndex + 1; next < visibleIds.length; next++) {
                nextIndex = session.orderedIds.indexOf(visibleIds[next]);
                if (nextIndex !== -1) break;
            }

            if (previousIndex !== -1) {
                session.orderedIds.splice(previousIndex + 1, 0, chatId);
            } else if (nextIndex !== -1) {
                session.orderedIds.splice(nextIndex, 0, chatId);
            } else {
                session.orderedIds.unshift(chatId);
            }
        }
    }

    function getVisibleMessages(root = document) {
        const visibleMessages = [];
        const seenIds = new Set();

        for (const type of ['user', 'model']) {
            const selector = ChatGPTProvider.selectors[type];
            const candidates = [];
            if (root.matches && root.matches(selector)) candidates.push(root);
            candidates.push(...root.querySelectorAll(selector));

            for (const node of candidates) {
                const chatId = generateChatIdInternal(node, type);
                if (chatId && !seenIds.has(chatId)) {
                    seenIds.add(chatId);
                    const markdownTarget = type === 'user'
                        ? node
                        : node.querySelector(ChatGPTProvider.selectors.markdownContent);
                    const textTarget = markdownTarget || node;
                    visibleMessages.push({
                        chatId,
                        type,
                        node,
                        turnOrder: getTurnOrderIndex(node),
                        markdownTarget: markdownTarget || textTarget,
                        textTarget
                    });
                }
            }
        }

        visibleMessages.sort((left, right) => {
            if (left.node === right.node) return 0;
            return left.node.compareDocumentPosition(right.node) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
        });

        return visibleMessages;
    }

    function getCodeLanguageInternal(node) {
        const codeDiv = node.querySelector(ChatGPTProvider.selectors.codeBlock);
        if (!codeDiv) return '';

        const langClass = Array.from(codeDiv.classList).find(c => c.startsWith('language-'));
        return langClass ? langClass.replace('language-', '') : '';
    }

    global.ChatGPTProvider = ChatGPTProvider;
})(window);
