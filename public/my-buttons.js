// my-buttons.js —— 重试按钮 + 一键复制
(function () {
  window.addEventListener("load", function () {
    const chat = document.getElementById("chat");
    const sendBtn = document.getElementById("sendBtn");
    const msgInput = document.getElementById("msg");
    if (!chat || !sendBtn || !msgInput) return;

    // ───────────────────────────────
    // 1. 通用小按钮样式
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
    // 2. 给 AI 消息行添加"重试 + 复制"
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

        // ✅ 降级方案：clipboard API 失败时用 execCommand（兼容手机）
        const doFallback = () => {
          const ta = document.createElement("textarea");
          ta.value = text;
          // font-size:16px 防止 iOS Safari 自动缩放
          ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;font-size:16px;";
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          try {
            document.execCommand("copy");
            copyBtn.textContent = "✅ 已复制";
          } catch {
            copyBtn.textContent = "❌ 失败";
          }
          document.body.removeChild(ta);
          setTimeout(() => copyBtn.textContent = "📋 复制", 1500);
        };

        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(() => {
            copyBtn.textContent = "✅ 已复制";
            setTimeout(() => copyBtn.textContent = "📋 复制", 1500);
          }).catch(doFallback);
        } else {
          doFallback();
        }
      });

      // ── 重试按钮 ──
      const retryBtn = makeBtn("↺ 重试");
      retryBtn.addEventListener("click", () => {
        const allRows = Array.from(chat.querySelectorAll(".row"));
        const aiIdx = allRows.indexOf(aiRow);
        if (aiIdx < 0) return;

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

        // 同步 session：截断到用户消息之前
        if (typeof window.__sessionTruncateTo === "function") {
          window.__sessionTruncateTo(aiIdx - 1);
        }

        // 强制重置按钮状态
        sendBtn.disabled = false;
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
    // 3. MutationObserver 监听新 AI 消息
    // ───────────────────────────────
    const observer = new MutationObserver(() => {
      chat.querySelectorAll(".row.ai").forEach(addAiButtons);
    });

    observer.observe(chat, { childList: true });

    // 刷新后历史已恢复时，补充给已有 AI 行加按钮
    chat.querySelectorAll(".row.ai").forEach(addAiButtons);
  });
})();
