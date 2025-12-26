const i18n = {
    get lang() {
        const l = navigator.language.toLowerCase();
        if (l.startsWith('zh')) return 'zh';
        if (l.startsWith('ja')) return 'ja';
        if (l.startsWith('ko')) return 'ko';
        if (l.startsWith('de')) return 'de';
        if (l.startsWith('fr')) return 'fr';
        if (l.startsWith('es')) return 'es';
        return 'en';
    },

    zh: {
        selectBtn: "选择对话", 
        exportBtn: "导出已选内容", 
        exportAsText: "导出为 TXT",
        exportAsMarkdown: "导出为 Markdown", 
        noSelection: "请先勾选需要导出的内容", 
        exportPrompt: "选中此段", 
        userHeader: "我",
        modelHeader: "Gemini",
    },
    en: {
        selectBtn: "Select Messages",
        exportBtn: "Export Selected",
        exportAsText: "Export as TXT",
        exportAsMarkdown: "Export as Markdown",
        noSelection: "Please select messages to export",
        exportPrompt: "Select this message",
        userHeader: "Me",
        modelHeader: "Gemini"
    },
    ja: {
        selectBtn: "メッセージを選択",
        exportBtn: "選択した内容を書き出し",
        exportAsText: "TXT形式で保存",
        exportAsMarkdown: "Markdown形式で保存",
        noSelection: "書き出す内容を選択してください",
        exportPrompt: "これを選択",
        userHeader: "自分",
        modelHeader: "ジェミニ"
    },
    ko: {
        selectBtn: "메시지 선택",
        exportBtn: "선택한 항목 내보내기",
        exportAsText: "TXT로 저장",
        exportAsMarkdown: "Markdown으로 저장",
        noSelection: "내보낼 항목을 선택해 주세요",
        exportPrompt: "항목 선택",
        userHeader: "나",
        modelHeader: "제미나이"
    },
    de: {
        selectBtn: "Nachrichten auswählen",
        exportBtn: "Auswahl exportieren",
        exportAsText: "Als TXT exportieren",
        exportAsMarkdown: "Als Markdown exportieren",
        noSelection: "Bitte wählen Sie Nachrichten zum Exportieren aus",
        exportPrompt: "Diesen Teil auswählen",
        userHeader: "Ich",
        modelHeader: "Gemini"
    },
    fr: {
        selectBtn: "Sélect. messages",
        exportBtn: "Exporter la sélection",
        exportAsText: "Exporter en TXT",
        exportAsMarkdown: "Exporter en Markdown",
        noSelection: "Veuillez sélectionner des messages à exporter",
        exportPrompt: "Sélectionner ceci",
        userHeader: "Moi",
        modelHeader: "Gemini"
    },
    es: {
        selectBtn: "Seleccionar mensajes",
        exportBtn: "Exportar seleccionados",
        exportAsText: "Exportar como TXT",
        exportAsMarkdown: "Exportar como Markdown",
        noSelection: "Por favor, selecciona mensajes para exportar",
        exportPrompt: "Seleccionar esto",
        userHeader: "Yo",
        modelHeader: "Gemini"
    },

    t(key) {
        return this[this.lang][key] || this['en'][key];
    }
};

/*
ChatGPT: チャットGPT (Chatto GPT)
Claude: クロード (Kurōdo)
Gemini: ジェミニ (Jemini)

ChatGPT: 챗GPT (Chaet GPT)
Claude: 클로드 (Keul-lo-deu)
Gemini: 제미나이 (Je-mi-na-i)
*/
