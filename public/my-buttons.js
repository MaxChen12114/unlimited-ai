// my-buttons.js —— 重试按钮 + 停止生成 + 一键复制
(function () {
  window.addEventListener("load", function () {
    const chat = document.getElementById("chat");
    const sendBtn = document.getElementById("sendBtn");
    const msgInput = document.getElementById("msg");
    if (!chat || !sendBtn || !msgInput) return;

    let abortController = null;

    // ───────────────────────────────
    // 1. 拦截 fetch，注入 abort 控制
    // ───────────────────────────────
    const _originalFetch = window.fetch;
    window.fetch = function (url, options = {}) {
      if (typeof url === "string" && url.includes("/api/chat")) {
        abortController = new AbortController();
        options = { ...options, signal: abortController.signal };
        setStopMode(true);
      }
      return _originalFetch(url, options).finally(() => {
        setStopMode(false);
        abortController = null;
      });
    };

    // ───────────────────────────────
    // 2. Send 按钮切换为"停止生成"
    // ───────────────────────────────
    function setStopMode(on) {
      if (on) {
        sendBtn.textContent = "⏹ 停止";
        sendBtn.dataset.stopMode = "1";
      } else {
        sendBtn.textContent = "Send";
        delete sendBtn.dataset.stopMode;
      }
    }

    sendBtn.addEventListener("click", function (e) {
      if (sendBtn.dataset.stopMode === "1") {
        e.stopImmediatePropagation();
        if (abortController) abortController.abort();
        setStopMode(false);
      }
    }, true);

    // ───────────────────────────────
    // 3. 通用小按钮样式
    // ───────────────────────────────
    function makeBtn(label) {
      const btn = document.createElement("button");
      btn.textContent = label;
      btn.style.cssText = `
        border: 1px solid #2e2e2e;
        background: #111;
        color: #777;
        border-radius: 10px;
        padding: 4px 11px;
        font-size: 12px;
        cursor: pointer;
        transition: color .15s, background .15s;
      `;
      btn.addEventListener("mouseenter", () => { btn.style.color = "#fff"; btn.style.background = "#1e1e1e"; });
      btn.addEventListener("mouseleave", () => { btn.style.color = "#777"; btn.style.background = "#111"; });
      return btn;
    }

    // ───────────────────────────────
    // 4. 给 AI 消息行添加"重试 + 复制"按钮
    //    重试 = 删掉此条 AI 回复，用上一条用户消息重新发请求
    // ───────────────────────────────
    function addAiButtons(aiRow) {
      if (aiRow.dataset.btnsAttached) return;
      aiRow.dataset.btnsAttached = "1";

      const content = aiRow.querySelector(".content");
      if (!content) return;

      const wrap = document.createElement("div");
      wrap.style.cssText = "display:flex;justify-content:flex-start;gap:8px;padding:4px 4px 2px;";

      // ── 复制按钮 ──
      const copyBtn = makeBtn("📋 复制");
      copyBtn.addEventListener("click", () => {
        const bubble = aiRow.querySelector(".bubble.ai");
        const text = bubble ? bubble.textContent.trim() : "";
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.textContent = "✅ 已复制";
          setTimeout(() => copyBtn.textContent = "📋 复制", 1500);
        });
      });

      // ── 重试按钮 ──
      const retryBtn = makeBtn("↺ 重试");
      retryBtn.addEventListener("click", () => {
        // 找到此 AI 消息之前最近的一条用户消息内容
        const allRows = Array.from(chat.querySelectorAll(".row"));
        const aiIdx = allRows.indexOf(aiRow);
        let lastUserText = "";
        for (let i = aiIdx - 1; i >= 0; i--) {
          if (allRows[i].classList.contains("user")) {
            const bubble = allRows[i].querySelector(".bubble.user");
            if (bubble) lastUserText = bubble.textContent.trim();
            break;
          }
        }
        if (!lastUserText) return;

        // 删除此条 AI 消息（含按钮区域）
        // 同时删除 AI 消息后可能存在的"已停止"提示
        let next = aiRow.nextSibling;
        while (next && next.nodeType === 1 && !next.classList.contains("row")) {
          const tmp = next.nextSibling;
          next.remove();
          next = tmp;
        }
        aiRow.remove();

        // 把用户消息文字填入输入框并发送
        msgInput.value = lastUserText;
        msgInput.dispatchEvent(new Event("input"));
        sendBtn.click();
      });

      wrap.appendChild(retryBtn);
      wrap.appendChild(copyBtn);
      content.appendChild(wrap);
    }

    // ───────────────────────────────
    // 5. MutationObserver 监听新 AI 消息
    // ───────────────────────────────
    const observer = new MutationObserver(() => {
      chat.querySelectorAll(".row.ai").forEach(addAiButtons);
    });

    observer.observe(chat, { childList: true });
  });
})();
