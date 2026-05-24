// my-buttons.js —— 重试 + 删除 + 复制
(function () {
  window.addEventListener("load", function () {
    const chat = document.getElementById("chat");
    const sendBtn = document.getElementById("sendBtn");
    const msgInput = document.getElementById("msg");
    if (!chat || !sendBtn || !msgInput) return;

    // ───────────────────────────────
    // 1. 通用小按钮样式
    // ───────────────────────────────
    function makeBtn(label, danger) {
      const btn = document.createElement("button");
      btn.textContent = label;
      btn.style.cssText = `
        border: 1px solid ${danger ? "#4a1a1a" : "#2e2e2e"};
        background: ${danger ? "#1a0a0a" : "#111"};
        color: ${danger ? "#a04040" : "#777"};
        border-radius: 10px;
        padding: 4px 11px;
        font-size: 12px;
        cursor: pointer;
        transition: color .15s, background .15s;
      `;
      btn.addEventListener("mouseenter", () => {
        btn.style.color = danger ? "#ff6666" : "#fff";
        btn.style.background = danger ? "#2a0a0a" : "#1e1e1e";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.color = danger ? "#a04040" : "#777";
        btn.style.background = danger ? "#1a0a0a" : "#111";
      });
      return btn;
    }

    // ───────────────────────────────
    // 2. 给 AI 消息行添加"重试 + 删除 + 复制"
    // ───────────────────────────────
    function addAiButtons(aiRow) {
      if (aiRow.dataset.btnsAttached) return;
      aiRow.dataset.btnsAttached = "1";

      const content = aiRow.querySelector(".content");
      if (!content) return;

      const wrap = document.createElement("div");
      wrap.style.cssText = "display:flex;justify-content:flex-start;gap:8px;padding:4px 4px 2px;flex-wrap:wrap;";

      // ── 复制按钮 ──
      const copyBtn = makeBtn("📋 复制");
      copyBtn.addEventListener("click", () => {
        const bubble = aiRow.querySelector(".bubble.ai");
        const text = bubble ? bubble.textContent.trim() : "";
        const doFallback = () => {
          const ta = document.createElement("textarea");
          ta.value = text;
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

        // 删除 DOM：用户行、AI 行及之后所有行
        for (let i = allRows.length - 1; i >= userRowDomIdx; i--) {
          allRows[i].remove();
        }
        const spacer = document.getElementById("bottom-spacer");
        Array.from(chat.childNodes).forEach(node => {
          if (node !== spacer && !node.classList?.contains("row")) node.remove();
        });

        // 同步 session
        if (typeof window.__sessionTruncateTo === "function") {
          window.__sessionTruncateTo(aiIdx - 1);
        }

        // 强制解锁 isSending
        if (typeof window.__resetSending === "function") {
          window.__resetSending();
        } else {
          sendBtn.disabled = false;
          sendBtn.textContent = "Send";
        }

        // 填入并自动发送
        msgInput.value = lastUserText;
        msgInput.dispatchEvent(new Event("input"));
        setTimeout(() => {
          msgInput.dispatchEvent(new KeyboardEvent("keydown", {
            key: "Enter", bubbles: true, cancelable: true
          }));
        }, 30);
      });

      // ── 删除按钮（只删这一对，不重发）──
      const delBtn = makeBtn("🗑️ 删除", true);
      delBtn.addEventListener("click", () => {
        const allRows = Array.from(chat.querySelectorAll(".row"));
        const aiIdx = allRows.indexOf(aiRow);
        if (aiIdx < 0) return;

        const userRowDomIdx = aiIdx - 1;
        const hasUserRow = userRowDomIdx >= 0 && allRows[userRowDomIdx].classList.contains("user");

        // 从 DOM 删除这一对（用户行 + AI 行）
        aiRow.remove();
        if (hasUserRow) allRows[userRowDomIdx].remove();

        // 同步 session：从中间删除这两条
        if (typeof window.__sessionDeleteAt === "function") {
          const sessionStart = hasUserRow ? userRowDomIdx : aiIdx;
          const count = hasUserRow ? 2 : 1;
          window.__sessionDeleteAt(sessionStart, count);
        }
      });

      wrap.appendChild(retryBtn);
      wrap.appendChild(delBtn);
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

    // 刷新后历史已恢复时补充按钮
    chat.querySelectorAll(".row.ai").forEach(addAiButtons);
  });
})();
