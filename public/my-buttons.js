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
    // 4. 给 AI 消息行添加"重试 + 复制"
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
        const allRows = Array.from(chat.querySelectorAll(".row"));
        const aiIdx = allRows.indexOf(aiRow);
        if (aiIdx < 0) return;

        // 找到紧前一条用户消息
        const userRowDomIdx = aiIdx - 1;
        if (userRowDomIdx < 0 || !allRows[userRowDomIdx].classList.contains("user")) return;
        const bubble = allRows[userRowDomIdx].querySelector(".bubble.user");
        if (!bubble) return;
        const lastUserText = bubble.textContent.trim();
        if (!lastUserText) return;

        // 从 DOM 删除：用户消息、AI 消息、以及之后所有行
        for (let i = allRows.length - 1; i >= userRowDomIdx; i--) {
          allRows[i].remove();
        }

        // 清理行之间可能残留的非 row 节点
        const spacer = document.getElementById("bottom-spacer");
        Array.from(chat.childNodes).forEach(node => {
          if (node !== spacer && !node.classList?.contains("row")) {
            node.remove();
          }
        });

        // 同步 session：截断到用户消息之前（send() 会重新 push）
        if (typeof window.__sessionTruncateTo === "function") {
          window.__sessionTruncateTo(aiIdx - 1);
        }

        // 重置按钮状态
        sendBtn.disabled = false;
        delete sendBtn.dataset.stopMode;
        sendBtn.textContent = "Send";

        // 填入文字，延迟触发 Enter 自动发送
        msgInput.value = lastUserText;
        msgInput.dispatchEvent(new Event("input"));

        setTimeout(() => {
          msgInput.dispatchEvent(new KeyboardEvent("keydown", {
            key: "Enter",
            bubbles: true,
            cancelable: true
          }));
        }, 30);
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

    // ✅ 刷新后历史已恢复时，补充给已有 AI 行加按钮
    chat.querySelectorAll(".row.ai").forEach(addAiButtons);
  });
})();
