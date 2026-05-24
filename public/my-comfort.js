// my-comfort.js —— 深浅主题切换 + 智能自动滚动
(function () {
  window.addEventListener("load", function () {
    const chat = document.getElementById("chat");
    const history = document.getElementById("history");
    const topbarInner = document.querySelector(".topbar-inner");
    if (!topbarInner || !history) return;

    // ───────────────────────────────
    // 1. 深浅主题切换
    // ───────────────────────────────
    const LIGHT_VARS = {
      "--bg": "#f5f5f5",
      "--border": "#ddd",
      "--muted": "#888",
      "--bubble-ai": "#fff",
      "--bubble-user": "#e8e8e8",
      "--input-bg": "#fff",
      "--input-border": "#ccc",
      "--btn-bg": "#e0e0e0",
      "--btn-bg-hover": "#d0d0d0",
    };
    const DARK_VARS = {
      "--bg": "#0b0b0b",
      "--border": "#222",
      "--muted": "#9a9a9a",
      "--bubble-ai": "#141414",
      "--bubble-user": "#1f1f1f",
      "--input-bg": "#2d2d2d",
      "--input-border": "#444",
      "--btn-bg": "#3b3b3b",
      "--btn-bg-hover": "#4a4a4a",
    };

    let isLight = localStorage.getItem("my-theme") === "light";

    function applyTheme(light) {
      const vars = light ? LIGHT_VARS : DARK_VARS;
      const root = document.documentElement;
      Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));

      // 文字颜色
      document.body.style.color = light ? "#111" : "#eaeaea";

      // select 颜色
      document.querySelectorAll("select").forEach(el => {
        el.style.background = light ? "#fff" : "#0f0f0f";
        el.style.color = light ? "#111" : "#fff";
      });

      themeBtn.textContent = light ? "☀️" : "🌙";
      localStorage.setItem("my-theme", light ? "light" : "dark");
    }

    const themeBtn = document.createElement("button");
    themeBtn.className = "iconbtn";
    themeBtn.title = "切换深浅色";
    themeBtn.style.flex = "0 0 38px";

    themeBtn.addEventListener("click", () => {
      isLight = !isLight;
      applyTheme(isLight);
    });

    // 插到顶栏最前面
    topbarInner.prepend(themeBtn);
    applyTheme(isLight);

    // ───────────────────────────────
    // 2. 智能自动滚动
    //    用户向上滚时停止跟随，回到底部后恢复
    // ───────────────────────────────
    let autoScroll = true;
    let userScrolling = false;

    history.addEventListener("scroll", () => {
      const distFromBottom = history.scrollHeight - history.scrollTop - history.clientHeight;
      // 距底部 60px 以内算"在底部"
      if (distFromBottom < 60) {
        autoScroll = true;
      } else {
        autoScroll = false;
      }
    }, { passive: true });

    // 监听聊天内容变化，内容增加时如果 autoScroll = true 就滚动
    if (chat) {
      const scrollObserver = new MutationObserver(() => {
        if (autoScroll) {
          history.scrollTo({ top: history.scrollHeight, behavior: "smooth" });
        }
      });
      scrollObserver.observe(chat, { childList: true, subtree: true, characterData: true });
    }

    // 发送消息时强制滚到底（新对话总是要看新回复）
    const sendBtn = document.getElementById("sendBtn");
    if (sendBtn) {
      sendBtn.addEventListener("click", () => {
        autoScroll = true;
        setTimeout(() => {
          history.scrollTo({ top: history.scrollHeight, behavior: "smooth" });
        }, 50);
      });
    }
  });
})();