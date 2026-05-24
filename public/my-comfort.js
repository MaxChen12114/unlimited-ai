// my-comfort.js —— 深浅主题切换 + 智能自动滚动
(function () {
  window.addEventListener("load", function () {
    const chat = document.getElementById("chat");
    const history = document.getElementById("history");
    const topbarInner = document.querySelector(".topbar-inner");
    const topbar = document.getElementById("topbar");
    if (!topbarInner || !history) return;

    // ───────────────────────────────
    // 1. 深浅主题切换
    // ───────────────────────────────
    const LIGHT_VARS = {
      "--bg": "#f0f0f0",
      "--border": "#ddd",
      "--muted": "#888",
      "--bubble-ai": "#fff",
      "--bubble-user": "#e2e2e2",
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

      // 整体背景 + 文字
      document.body.style.color = light ? "#111" : "#eaeaea";
      document.body.style.background = light ? "#f0f0f0" : "#0b0b0b";

      // ✅ 顶栏背景（原CSS写死渐变，不走变量，需单独设置）
      if (topbar) {
        topbar.style.background = light
          ? "linear-gradient(to bottom, rgba(240,240,240,.95), rgba(240,240,240,.75))"
          : "linear-gradient(to bottom, rgba(11,11,11,.92), rgba(11,11,11,.65))";
        topbar.style.borderBottomColor = light ? "#ddd" : "#151515";
      }

      // select 颜色
      document.querySelectorAll("select").forEach(el => {
        el.style.background = light ? "#fff" : "#0f0f0f";
        el.style.color = light ? "#111" : "#fff";
        el.style.borderColor = light ? "#ccc" : "#333";
      });

      // iconbtn 颜色
      document.querySelectorAll(".iconbtn").forEach(el => {
        el.style.background = light ? "#e8e8e8" : "#101010";
        el.style.borderColor = light ? "#ccc" : "#2a2a2a";
        el.style.color = light ? "#111" : "#fff";
      });

      // pill 背景
      document.querySelectorAll(".pill").forEach(el => {
        el.style.background = light ? "#e8e8e8" : "#101010";
        el.style.borderColor = light ? "#ccc" : "#2a2a2a";
      });

      // model-label 文字
      document.querySelectorAll(".model-label").forEach(el => {
        el.style.color = light ? "#444" : "#cfcfcf";
      });

      // 气泡文字颜色
      document.querySelectorAll(".bubble, .meta, .stats").forEach(el => {
        el.style.color = light ? "#111" : "";
      });

      // 输入框文字
      const inputEl = document.getElementById("msg");
      if (inputEl) inputEl.style.color = light ? "#111" : "#fff";

      // Settings 面板背景
      const settings = document.getElementById("settings");
      if (settings) {
        settings.style.background = light ? "#f5f5f5" : "#0f0f0f";
        settings.style.borderColor = light ? "#ddd" : "#2a2a2a";
      }
      document.querySelectorAll(".card").forEach(el => {
        el.style.background = light ? "#fff" : "#101010";
        el.style.borderColor = light ? "#e0e0e0" : "#242424";
      });
      document.querySelectorAll(".smallbtn").forEach(el => {
        el.style.background = light ? "#ebebeb" : "#141414";
        el.style.color = light ? "#111" : "#fff";
        el.style.borderColor = light ? "#ccc" : "#2a2a2a";
      });

      themeBtn.textContent = light ? "☀️" : "🌙";
      localStorage.setItem("my-theme", light ? "light" : "dark");
    }

    // ✅ 插到最前面（替代原来打赏按钮的位置）
    const themeBtn = document.createElement("button");
    themeBtn.className = "iconbtn";
    themeBtn.title = "切换深浅色";
    themeBtn.style.cssText = "flex: 0 0 38px;";

    themeBtn.addEventListener("click", () => {
      isLight = !isLight;
      applyTheme(isLight);
    });

    topbarInner.prepend(themeBtn);
    applyTheme(isLight);

    // ───────────────────────────────
    // 2. 智能自动滚动
    //    用户上翻查看历史时暂停跟随，回到底部自动恢复
    // ───────────────────────────────
    let autoScroll = true;

    history.addEventListener("scroll", () => {
      const distFromBottom = history.scrollHeight - history.scrollTop - history.clientHeight;
      autoScroll = distFromBottom < 60;
    }, { passive: true });

    if (chat) {
      const scrollObserver = new MutationObserver(() => {
        if (autoScroll) {
          history.scrollTo({ top: history.scrollHeight, behavior: "smooth" });
        }
      });
      scrollObserver.observe(chat, { childList: true, subtree: true, characterData: true });
    }

    // 发送时强制滚到底
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
