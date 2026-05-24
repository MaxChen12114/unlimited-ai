// my-buttons.js —— 重试按钮 + 停止生成 + 一键复制
(function () {
  window.addEventListener("load", function () {
    const chat = document.getElementById("chat");
    const sendBtn = document.getElementById("sendBtn");
    const msgInput = document.getElementById("msg");
    if (!chat || !sendBtn || !msgInput) return;

    let retryWrap = null;
    let abortController = null; // 用于停止生成

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
        // 在最后一条 AI 消息后追加中断提示
        const aiRows = chat.querySelectorAll(".row.ai");
        if (aiRows.length > 0) {
          const notice = document.createElement("div");
          notice.style.cssText = "font-size:12px;color:#666;padding:0 6px 8px;text-align:left;";
          notice.textContent = "⚠️ 已停止生成";
          aiRows[aiRows.length - 1].insertAdjacentElement("afterend", notice);
        }
      }
    }, true);

    // ───────────────────────────────
    // 3. 重试按钮
    // ───────────────────────────────
    function addRetryBtn(userRow) {
      if (retryWrap) retryWrap.remove();

      const wrap = document.createElement("div");
      wrap.className = "my-retry-wrap";
      wrap.style.cssText = "display:flex;justify-content:flex-end;gap:8px;padding:2px 6px 10px;";

      const btn = makeBtn("↺ 重试");
      btn.addEventListener("click", () => {
        const bubble = userRow.querySelector(".bubble.user");
        if (!bubble) return;
        const text = bubble.textContent.trim();
        if (!text) return;

        // 删除该用户消息之后所有行
        const rows = Array.from(chat.querySelectorAll(".row"));
        const idx = rows.indexOf(userRow);
        for (let i = rows.length - 1; i > idx; i--) rows[i].remove();

        // 删除"已停止生成"提示
        chat.querySelectorAll("div[style*='已停止']").forEach(el => el.remove());

        userRow.remove();
        wrap.remove();
        retryWrap = null;

        msgInput.value = text;
        msgInput.dispatchEvent(new Event("input"));
        sendBtn.click();
      });

      wrap.appendChild(btn);
      retryWrap = wrap;
      userRow.insertAdjacentElement("afterend", wrap);
    }

    // ───────────────────────────────
    // 4. 复制按钮（加在 AI 消息上）
    // ───────────────────────────────
    function addCopyBtn(aiRow) {
      if (aiRow.dataset.copyAttached) return;
      aiRow.dataset.copyAttached = "1";

      const content = aiRow.querySelector(".content");
      if (!content) return;

      const row = document.createElement("div");
      row.style.cssText = "display:flex;justify-content:flex-start;padding:2px 4px 4px;";

      const btn = makeBtn("📋 复制");
      btn.addEventListener("click", () => {
        const bubble = aiRow.querySelector(".bubble.ai");
        const text = bubble ? bubble.textContent.trim() : "";
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = "✅ 已复制";
          setTimeout(() => btn.textContent = "📋 复制", 1500);
        });
      });

      row.appendChild(btn);
      content.appendChild(row);
    }

    // ───────────────────────────────
    // 5. 通用小按钮样式
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
      btn.addEventListener("mouseenter", () => { btn.style.color="#fff"; btn.style.background="#1e1e1e"; });
      btn.addEventListener("mouseleave", () => { btn.style.color="#777"; btn.style.background="#111"; });
      return btn;
    }

    // ───────────────────────────────
    // 6. MutationObserver 监听新消息
    // ───────────────────────────────
    const observer = new MutationObserver(() => {
      // 处理最新用户消息 → 重试按钮
      const userRows = chat.querySelectorAll(".row.user");
      if (userRows.length > 0) {
        const last = userRows[userRows.length - 1];
        if (!last.dataset.retryAttached) {
          last.dataset.retryAttached = "1";
          addRetryBtn(last);
        }
      }
      // 处理所有 AI 消息 → 复制按钮
      chat.querySelectorAll(".row.ai").forEach(addCopyBtn);
    });

    observer.observe(chat, { childList: true });
  });
})();