/* ══════════════════════════════════════════════════════════
   PIXEL DROP — app.js
   내비게이션 · 코인 뱅크 · 카탈로그 · 모달 · 가챠 · 스튜디오 · 파티클
   ══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  const esc = (str) =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const hashStr = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h << 5) - h + s.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h).toString(36);
  };

  /* ═══════════ TOAST ═══════════ */
  const toastRoot = $("#toast-root");
  function toast(msg, type) {
    const t = document.createElement("div");
    t.className = "toast" + (type ? " t-" + type : "");
    t.innerHTML = `<span class="toast-dot"></span>${msg}`;
    toastRoot.appendChild(t);
    setTimeout(() => {
      t.classList.add("out");
      setTimeout(() => t.remove(), 320);
    }, 2600);
  }

  /* ═══════════ COIN BANK ═══════════ */
  const CoinBank = {
    balance: 5,
    listeners: [],
    onChange(fn) {
      this.listeners.push(fn);
    },
    _emit() {
      this.listeners.forEach((fn) => fn(this.balance));
    },
    add(n) {
      this.balance += n;
      this._emit();
      const ind = $("#coin-indicator");
      ind.classList.remove("bump", "zero");
      void ind.offsetWidth;
      ind.classList.add("bump");
      SoundFX.coin();
      toast(`코인 ${n}개 충전 완료! (보유 ${this.balance})`, "gold");
    },
    spend(n) {
      if (this.balance < n) {
        SoundFX.error();
        const ind = $("#coin-indicator");
        ind.classList.add("zero");
        toast(
          "코인이 부족합니다! 상단의 <b>+3</b> 무료 충전을 이용하세요",
          "magenta",
        );
        setTimeout(() => ind.classList.remove("zero"), 2500);
        return false;
      }
      this.balance -= n;
      this._emit();
      return true;
    },
  };
  window.CoinBank = CoinBank;

  function renderCoins(b) {
    $("#coin-count").textContent = b;
    $("#drawer-coin").textContent = b;
    $("#quick-coin-count").textContent = b;
  }
  CoinBank.onChange(renderCoins);

  /* ═══════════ MODAL 매니저 ═══════════ */
  let modalStack = [];
  function openModal(el) {
    el.hidden = false;
    document.body.classList.add("modal-open");
    modalStack.push(el);
    const closeBtn = el.querySelector(".modal-close");
    if (closeBtn) setTimeout(() => closeBtn.focus(), 60);
  }
  function closeModal(el) {
    el.hidden = true;
    modalStack = modalStack.filter((m) => m !== el);
    if (!modalStack.length) document.body.classList.remove("modal-open");
    if (el.id === "video-modal") $("#video-frame").innerHTML = "";
  }
  function closeAllModals() {
    modalStack.slice().forEach(closeModal);
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) {
      const modal = e.target.closest(".modal");
      if (modal) closeModal(modal);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalStack.length)
      closeModal(modalStack[modalStack.length - 1]);
  });

  /* ═══════════ 클립보드 복사 ═══════════ */
  function copyText(text) {
    const done = () => toast("프롬프트가 클립보드에 복사되었습니다", "cyan");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(done)
        .catch(() => fallback());
    } else fallback();
    function fallback() {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        done();
      } catch (e) {
        toast("복사 실패 — 프롬프트를 직접 선택해 주세요", "magenta");
      }
      ta.remove();
    }
  }

  /* ═══════════ 다운로드 시뮬레이션 ═══════════ */
  function simulateDownload(title) {
    toast(`「${esc(title)}」 다운로드 준비 중…`);
    setTimeout(
      () =>
        toast("다운로드 완료! (시뮬레이션 — 에셋 연동 후 실파일 제공)", "gold"),
      1100,
    );
  }

  /* ═══════════ 캡슐 언박싱 모달 ═══════════ */
  const capsuleModal = $("#capsule-modal");
  const capCapsule = $("#cap-capsule");
  const capReveal = $("#cap-reveal");
  const capHint = $("#cap-hint");
  let capItem = null;
  let capOpened = false;

  function rarityClass(r) {
    return "rarity-" + r.replace(/\s+/g, "");
  }

  window.AppBridge = {
    openCapsule(product) {
      capItem = product;
      capOpened = false;
      const meta = RARITY_META[product.rarity];
      capCapsule.className = "capsule-big " + rarityClass(product.rarity);
      capCapsule.style.setProperty("--rc", meta.color);
      capCapsule.classList.add("state-shake");
      capCapsule.style.display = "";
      capHint.hidden = false;
      capHint.textContent = "두근두근… 캡슐을 클릭해서 열어보세요!";
      capReveal.hidden = true;
      capReveal.innerHTML = "";
      openModal(capsuleModal);
    },
    toast,
  };

  function buildRevealCard(p) {
    const meta = RARITY_META[p.rarity];
    const isVideo = p.type === "video";
    return `
      <figure class="cap-card ${rarityClass(p.rarity)}" style="--rc:${meta.color}">
        <div class="cap-img-wrap">
          <img src="${p.imageSrc}" alt="${esc(p.title)}" />
          ${
            isVideo
              ? `
            <div class="video-hint" data-action="theater">
              <span class="play-badge"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M8 5l12 7-12 7z" fill="currentColor"/></svg></span>
              Tap to watch video in Theater Mode
            </div>`
              : ""
          }
        </div>
        <figcaption>
          <span class="rarity-tag" style="--rc:${meta.color}">${meta.label}</span>
          <h3>${esc(p.title)}</h3>
          <p class="cap-id">${p.id} · SLOT ${p.slot} · ${esc(p.category).toUpperCase()}</p>
          <div class="cap-actions">
            <button class="btn btn-small btn-dark" data-action="copy" type="button">⧉ 프롬프트 복사</button>
            <button class="btn btn-small btn-ghost" data-action="download" type="button">↓ 다운로드</button>
            ${isVideo ? '<button class="btn btn-small btn-magenta pixel-font" data-action="theater" type="button">▶ THEATER</button>' : ""}
          </div>
        </figcaption>
      </figure>`;
  }

  function openCapsuleNow() {
    if (capOpened || !capItem) return;
    capOpened = true;
    SoundFX.open();
    capCapsule.classList.remove("state-shake");
    capCapsule.classList.add("state-open");
    capHint.textContent = "";
    setTimeout(() => {
      capCapsule.style.display = "none";
      capHint.hidden = true;
      capReveal.innerHTML = buildRevealCard(capItem);
      capReveal.hidden = false;
    }, 520);
  }
  capCapsule.addEventListener("click", openCapsuleNow);
  capCapsule.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openCapsuleNow();
    }
  });

  capReveal.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn || !capItem) return;
    const action = btn.dataset.action;
    if (action === "copy") copyText(capItem.prompt);
    if (action === "download") simulateDownload(capItem.title);
    if (action === "theater") openVideo(capItem.videoUrl, capItem.title);
  });

  /* ═══════════ 비디오 씨어터 모달 (파사드 패턴) ═══════════ */
  const videoModal = $("#video-modal");
  function openVideo(youtubeId, title) {
    if (!youtubeId) return;
    $("#video-frame").innerHTML = `
      <iframe
        src="https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&rel=0&modestbranding=1"
        title="${esc(title || "PIXEL DROP 영상")}"
        referrerpolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen loading="lazy"></iframe>`;
    $("#video-title").textContent = (title || "THEATER MODE").toUpperCase();
    $("#video-link").href = "https://www.youtube.com/watch?v=" + youtubeId;
    openModal(videoModal);
  }

  $$(".motion-card").forEach((card) => {
    const go = () =>
      openVideo(card.dataset.youtubeId, $(".motion-info h3", card).textContent);
    card.addEventListener("click", go);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        go();
      }
    });
  });

  /* ═══════════ 상품 상세 모달 ═══════════ */
  const detailModal = $("#detail-modal");
  function openDetail(p) {
    const meta = RARITY_META[p.rarity];
    const box = $(".detail-box", detailModal);
    const grid = $("#detail-grid");
    const isVideo = p.type === "video";
    box.classList.toggle("video", isVideo);

    const mediaHTML = isVideo
      ? `<div class="detail-media"><div class="ratio">
           <iframe src="https://www.youtube-nocookie.com/embed/${p.videoUrl}?rel=0&modestbranding=1"
             title="${esc(p.title)}" referrerpolicy="strict-origin-when-cross-origin"
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
             allowfullscreen></iframe>
         </div></div>`
      : `<div class="detail-media"><span class="slot-stamp">SLOT ${p.slot}</span><img src="${p.imageSrc}" alt="${esc(p.title)}"${
          p._px ? ' class="px"' : ""
        } style="${p._filter && p._filter !== "none" ? "filter:" + p._filter : ""}" /></div>`;

    grid.innerHTML = `
      ${mediaHTML}
      <div class="detail-info">
        <span class="detail-cat">${esc(p.category).toUpperCase()} DROP</span>
        <h3 id="detail-title">${esc(p.title)}</h3>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <span class="rarity-tag" style="--rc:${meta.color}">${meta.label}</span>
          <span class="detail-meta">${p.id} · 타입 ${isVideo ? "VIDEO" : "IMAGE"}</span>
        </div>
        <p style="font-size:13px;color:var(--ink-2)">${esc((p.tags || []).map((t) => "#" + t).join("  "))}</p>
        <div class="prompt-block">${esc(p.prompt)}</div>
        <div class="detail-actions">
          <button class="btn btn-small btn-dark" id="detail-copy" type="button">⧉ 프롬프트 복사</button>
          <button class="btn btn-small btn-ghost" id="detail-download" type="button">↓ 다운로드</button>
          ${isVideo ? '<button class="btn btn-small btn-magenta pixel-font" id="detail-theater" type="button">▶ THEATER MODE</button>' : ""}
        </div>
      </div>`;

    $("#detail-copy").addEventListener("click", () => copyText(p.prompt));
    $("#detail-download").addEventListener("click", () =>
      simulateDownload(p.title),
    );
    const th = $("#detail-theater");
    if (th) th.addEventListener("click", () => openVideo(p.videoUrl, p.title));

    openModal(detailModal);
  }
  // 영상 상세 모달 닫을 때 iframe 제거
  new MutationObserver(() => {
    if (detailModal.hidden) $("#detail-grid").innerHTML = "";
  }).observe(detailModal, { attributes: true, attributeFilter: ["hidden"] });

  /* ═══════════ 카탈로그 ═══════════ */
  const catState = { cat: "All", q: "", rarity: "All" };
  let freshId = null;
  const grid = $("#catalog-grid");

  function applyFilters() {
    const q = catState.q.trim().toLowerCase();
    return products.filter((p) => {
      if (catState.cat !== "All" && p.category !== catState.cat) return false;
      if (catState.rarity !== "All" && p.rarity !== catState.rarity)
        return false;
      if (q) {
        const hay = (
          p.title +
          " " +
          (p.tags || []).join(" ") +
          " " +
          p.category
        ).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function renderCatalog() {
    const list = applyFilters();
    $("#catalog-count").textContent =
      `${list.length} ITEM${list.length === 1 ? "" : "S"} · 총 ${products.length}종 드롭 중`;
    $("#catalog-empty").hidden = list.length > 0;

    grid.innerHTML = list
      .map((p, i) => {
        const meta = RARITY_META[p.rarity];
        const isVideo = p.type === "video";
        return `
        <article class="goods-card ${rarityClass(p.rarity)}${p.id === freshId ? " fresh" : ""}"
                 data-id="${p.id}" tabindex="0" role="button"
                 aria-label="${esc(p.title)} 상세 보기" style="--rc:${meta.color};--d:${Math.min(i * 0.05, 0.4)}s">
          <div class="goods-thumb">
            <img src="${p.imageSrc}" alt="${esc(p.title)}" loading="lazy" />
            <span class="slot-chip">${p.slot}</span>
            ${isVideo ? '<span class="thumb-play"><span><svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 5l12 7-12 7z" fill="currentColor"/></svg></span></span>' : ""}
            ${p.id === freshId ? '<span class="new-chip">NEW</span>' : ""}
          </div>
          <div class="goods-info">
            <span class="goods-cat">${esc(p.category).toUpperCase()}</span>
            <h3>${esc(p.title)}</h3>
            <span class="rarity-tag" style="--rc:${meta.color}">${meta.label}</span>
          </div>
        </article>`;
      })
      .join("");
  }

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".goods-card");
    if (!card) return;
    SoundFX.key();
    const p = products.find((x) => x.id === card.dataset.id);
    if (p) openDetail(p);
  });
  grid.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const card = e.target.closest(".goods-card");
    if (!card) return;
    const p = products.find((x) => x.id === card.dataset.id);
    if (p) openDetail(p);
  });

  $("#catalog-tabs").addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (!tab) return;
    $$("#catalog-tabs .tab").forEach((t) => {
      t.classList.toggle("active", t === tab);
      t.setAttribute("aria-selected", t === tab);
    });
    catState.cat = tab.dataset.cat;
    SoundFX.key();
    renderCatalog();
  });

  $("#rarity-filter").addEventListener("click", (e) => {
    const chip = e.target.closest(".r-chip");
    if (!chip) return;
    $$("#rarity-filter .r-chip").forEach((c) =>
      c.classList.toggle("active", c === chip),
    );
    catState.rarity = chip.dataset.rar;
    SoundFX.key();
    renderCatalog();
  });

  let searchTimer;
  $("#catalog-search").addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      catState.q = e.target.value;
      renderCatalog();
    }, 160);
  });

  $("#catalog-reset").addEventListener("click", () => {
    catState.cat = "All";
    catState.q = "";
    catState.rarity = "All";
    $("#catalog-search").value = "";
    $$("#catalog-tabs .tab").forEach((t) =>
      t.classList.toggle("active", t.dataset.cat === "All"),
    );
    $$("#rarity-filter .r-chip").forEach((c) =>
      c.classList.toggle("active", c.dataset.rar === "All"),
    );
    renderCatalog();
    toast("필터를 초기화했습니다", "cyan");
  });

  /* ═══════════ GACHA ═══════════ */
  const gachaDrop = $("#gacha-drop");
  let gachaCount = 0;
  const gachaHistory = [];

  function weightedRandom() {
    const total = products.reduce(
      (s, p) => s + RARITY_META[p.rarity].weight,
      0,
    );
    let roll = Math.random() * total;
    for (const p of products) {
      roll -= RARITY_META[p.rarity].weight;
      if (roll <= 0) return p;
    }
    return products[0];
  }

  function pushHistory(p) {
    gachaHistory.unshift(p);
    if (gachaHistory.length > 8) gachaHistory.pop();
    const row = $("#gacha-history");
    row.innerHTML = gachaHistory
      .map(
        (h, i) => `
      <button class="history-chip" data-idx="${i}" type="button" title="${esc(h.title)} (${h.rarity})" style="--d:${i * 0.04}s">
        <img src="${h.imageSrc}" alt="${esc(h.title)}" loading="lazy" />
      </button>`,
      )
      .join("");
  }
  $("#gacha-history").addEventListener("click", (e) => {
    const chip = e.target.closest(".history-chip");
    if (!chip) return;
    const p = gachaHistory[+chip.dataset.idx];
    if (p) window.AppBridge.openCapsule(p);
  });

  $("#gacha-btn").addEventListener("click", () => {
    if (!CoinBank.spend(1)) return;
    const btn = $("#gacha-btn");
    btn.disabled = true;

    const p = weightedRandom();
    const meta = RARITY_META[p.rarity];
    gachaCount++;
    $("#gacha-count").textContent = String(gachaCount).padStart(2, "0");

    // 1) 캡슐 낙하
    gachaDrop.innerHTML = "";
    const cap = document.createElement("div");
    cap.className = "g-capsule";
    cap.style.setProperty("--rc", meta.color);
    cap.innerHTML =
      '<span class="g-top"></span><span class="g-bottom"></span><span class="g-line"></span>';
    gachaDrop.appendChild(cap);
    SoundFX.drop();

    // 2) 흔들림
    setTimeout(() => {
      cap.classList.add("shaking");
      SoundFX.key();
    }, 1050);
    // 3) 오픈 → 모달 & 미니 카드
    setTimeout(() => {
      cap.classList.remove("shaking");
      cap.classList.add("opening");
      SoundFX.gacha();
      pushHistory(p);
      setTimeout(() => {
        gachaDrop.innerHTML = `
          <button class="gacha-mini-card" type="button" style="--rc:${meta.color}" title="언박싱 다시 보기">
            <img src="${p.imageSrc}" alt="${esc(p.title)}" />
            <span><b>${esc(p.title)}</b><span class="pixel-font">${meta.label} GET!</span></span>
          </button>`;
        $(".gacha-mini-card", gachaDrop).addEventListener("click", () =>
          window.AppBridge.openCapsule(p),
        );
        window.AppBridge.openCapsule(p);
        btn.disabled = false;
      }, 480);
    }, 1900);
  });

  /* ═══════════ STUDIO ═══════════ */
  let studioStyle = "PIXEL";
  let studioResult = null;
  let generating = false;

  $("#style-chips").addEventListener("click", (e) => {
    const chip = e.target.closest(".style-chip");
    if (!chip || generating) return;
    $$(".style-chip").forEach((c) => {
      const on = c === chip;
      c.classList.toggle("active", on);
      c.setAttribute("aria-checked", on);
    });
    studioStyle = chip.dataset.style;
    SoundFX.key();
  });

  $$(".suggest-chip").forEach((c) =>
    c.addEventListener("click", () => {
      $("#studio-prompt").value = c.dataset.suggest;
      $("#studio-prompt").focus();
      SoundFX.key();
    }),
  );

  const STAGES = [
    "프롬프트 분석 중…",
    "키워드 임베딩 생성…",
    "잠재 공간(latent space) 샘플링…",
    "디퓨전 스텝 12/30…",
    "디퓨전 스텝 27/30…",
    "스타일 필터 전이…",
    "캡슐 봉인 중…",
  ];

  function generate() {
    const promptEl = $("#studio-prompt");
    const prompt = promptEl.value.trim();
    if (!prompt) {
      promptEl.classList.remove("shake");
      void promptEl.offsetWidth;
      promptEl.classList.add("shake");
      SoundFX.error();
      toast("프롬프트를 먼저 입력해 주세요!", "magenta");
      promptEl.focus();
      return;
    }
    if (generating) return;
    generating = true;
    const btn = $("#generate-btn");
    btn.disabled = true;

    const preset = STUDIO_STYLES[studioStyle];
    const seed = hashStr(prompt + "::" + studioStyle + "::" + Date.now());
    const url = `https://picsum.photos/seed/pd-${seed}/${preset.size}/${preset.size}`;

    // 프리로드 (완성 후 즉시 표시)
    const pre = new Image();
    pre.src = url;

    $("#preview-empty").hidden = true;
    $("#preview-result").hidden = true;
    const loading = $("#preview-loading");
    loading.hidden = false;
    const fill = $("#progress-fill");
    const stageEl = $("#stage-text");
    const subEl = $("#loading-sub");
    fill.style.width = "0%";

    const total = 2400;
    const started = performance.now();
    let stageIdx = 0;
    stageEl.textContent = STAGES[0];
    subEl.textContent = `style: ${studioStyle} · temperature 0.8`;

    const tick = (now) => {
      const pct = Math.min(100, ((now - started) / total) * 100);
      fill.style.width = pct + "%";
      const target = Math.floor((pct / 100) * STAGES.length);
      if (target > stageIdx && target < STAGES.length) {
        stageIdx = target;
        stageEl.textContent = STAGES[stageIdx];
      }
      if (pct < 100) requestAnimationFrame(tick);
      else finish();
    };
    requestAnimationFrame(tick);

    function finish() {
      const fullPrompt = `"${prompt}", ${preset.label} style, PIXEL DROP drop item, high detail, vivid pop color palette --seed pd-${seed}`;
      studioResult = {
        id: "PD-C" + hashStr(seed).slice(0, 5).toUpperCase(),
        slot: "S" + (1 + Math.floor(Math.random() * 9)),
        title: prompt.length > 18 ? prompt.slice(0, 18) + "…" : prompt,
        category:
          {
            PIXEL: "Pixel Art",
            CYBERPUNK: "Character",
            POPART: "Poster",
            DREAMY: "Wallpaper",
            RETRO: "Sticker",
            RENDER3D: "Character",
          }[studioStyle] || "Character",
        rarity: weightedRarity(),
        type: "image",
        imageSrc: url,
        videoUrl: null,
        prompt: fullPrompt,
        tags: ["스튜디오", preset.label, "커스텀드롭"],
        _filter: preset.filter,
        _px: preset.px,
      };

      const img = $("#result-img");
      img.className = preset.px ? "px" : "";
      img.style.filter = preset.filter === "none" ? "" : preset.filter;
      img.src = url;
      img.alt = prompt + " — AI 생성 시뮬레이션";
      $("#result-seed").textContent = "pd-" + seed;
      $("#result-style").textContent = preset.label + " · " + studioStyle;
      $("#result-style-badge").textContent = studioStyle;
      $("#result-prompt").textContent = prompt;
      loading.hidden = true;
      $("#preview-result").hidden = false;
      $("#save-btn").disabled = false;
      SoundFX.save();
      toast("드롭 생성 완료! 캡슐에 봉인했습니다", "cyan");
      generating = false;
      btn.disabled = false;
    }
  }

  function weightedRarity() {
    const keys = Object.keys(RARITY_META);
    const total = keys.reduce((s, k) => s + RARITY_META[k].weight, 0);
    let roll = Math.random() * total;
    for (const k of keys) {
      roll -= RARITY_META[k].weight;
      if (roll <= 0) return k;
    }
    return "Common";
  }

  $("#generate-btn").addEventListener("click", generate);
  $("#regen-btn").addEventListener("click", generate);

  $("#save-btn").addEventListener("click", () => {
    if (!studioResult) return;
    const exists = products.some((p) => p.id === studioResult.id);
    if (!exists) products.unshift(studioResult);
    freshId = studioResult.id;
    $("#save-btn").disabled = true;

    // 카탈로그를 ALL 상태로 초기화하고 최상단 아이템을 강조 진열
    catState.cat = "All";
    catState.q = "";
    catState.rarity = "All";
    $("#catalog-search").value = "";
    $$("#catalog-tabs .tab").forEach((t) =>
      t.classList.toggle("active", t.dataset.cat === "All"),
    );
    $$("#rarity-filter .r-chip").forEach((c) =>
      c.classList.toggle("active", c.dataset.rar === "All"),
    );
    renderCatalog();
    SoundFX.save();
    toast(
      "카탈로그 최상단에 저장되었습니다 (새로고침 시 초기화되는 샌드박스)",
      "gold",
    );

    const target = $("#catalog");
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      freshId = null;
      renderCatalog();
    }, 4000);
  });

  /* ═══════════ HEADER · NAV ═══════════ */
  const header = $("#site-header");
  window.addEventListener(
    "scroll",
    () => {
      header.classList.toggle("scrolled", window.scrollY > 8);
    },
    { passive: true },
  );

  // 사운드 토글
  const soundBtn = $("#sound-toggle");
  soundBtn.addEventListener("click", () => {
    const on = SoundFX.toggle();
    soundBtn.classList.toggle("off", !on);
    soundBtn.setAttribute("aria-pressed", on);
    toast(
      on ? "효과음 ON — 삐빅!" : "효과음 OFF — 조용한 아케이드",
      on ? "cyan" : "",
    );
    if (on) SoundFX.ok();
  });

  // 코인 충전 버튼 3종
  $("#coin-refill").addEventListener("click", () => CoinBank.add(3));
  $("#drawer-refill").addEventListener("click", () => CoinBank.add(3));
  $("#gacha-refill").addEventListener("click", () => CoinBank.add(3));

  // 햄버거 드로어
  const drawer = $("#mobile-drawer");
  const backdrop = $("#drawer-backdrop");
  const burger = $("#hamburger");
  function setDrawer(open) {
    drawer.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", !open);
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open);
    backdrop.hidden = !open;
    requestAnimationFrame(() => backdrop.classList.toggle("show", open));
    document.body.style.overflow = open ? "hidden" : "";
  }
  burger.addEventListener("click", () =>
    setDrawer(!drawer.classList.contains("open")),
  );
  $("#drawer-close").addEventListener("click", () => setDrawer(false));
  backdrop.addEventListener("click", () => setDrawer(false));
  $$(".drawer-nav a").forEach((a) =>
    a.addEventListener("click", () => setDrawer(false)),
  );

  // 스크롤 스파이 — 활성 메뉴 하이라이트
  const navMap = {};
  $$(".nav-links a").forEach((a) => {
    navMap[a.dataset.sec] = a;
  });
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          $$(".nav-links a").forEach((a) => a.classList.remove("active"));
          const link = navMap[en.target.id];
          if (link) link.classList.add("active");
        }
      });
    },
    { rootMargin: "-38% 0px -55% 0px" },
  );
  [
    "vending",
    "catdrop",
    "catalog",
    "gacha",
    "motion",
    "studio",
    "about",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) spy.observe(el);
  });

  /* ═══════════ SCROLL REVEAL & SKILL BARS ═══════════ */
  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          revealIO.unobserve(en.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  $$(".reveal").forEach((el) => revealIO.observe(el));

  const barIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          $$(".skill-bar .fill", en.target).forEach((f) => {
            f.style.width = f.dataset.pct + "%";
          });
          barIO.unobserve(en.target);
        }
      });
    },
    { threshold: 0.3 },
  );
  const skillPanel = $(".skill-panel");
  if (skillPanel) barIO.observe(skillPanel);

  /* ═══════════ AMBIENT PIXEL PARTICLES ═══════════ */
  function initParticles() {
    const canvas = $("#bg-canvas");
    if (
      !canvas ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const ctx = canvas.getContext("2d");
    const colors = ["#00C2D1", "#FF007A", "#8B5CF6", "#FFD700", "#39FF14"];
    let W,
      H,
      parts = [];

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      const n = Math.min(52, Math.floor(W / 26));
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        s: 3 + Math.random() * 5,
        v: 0.18 + Math.random() * 0.45,
        d: (Math.random() - 0.5) * 0.3,
        c: colors[Math.floor(Math.random() * colors.length)],
        a: 0.12 + Math.random() * 0.26,
        tw: Math.random() * Math.PI * 2,
      }));
    }
    resize();
    window.addEventListener("resize", resize);

    (function loop() {
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.y -= p.v;
        p.x += p.d;
        p.tw += 0.03;
        if (p.y < -10) {
          p.y = H + 10;
          p.x = Math.random() * W;
        }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        ctx.globalAlpha = p.a * (0.7 + 0.3 * Math.sin(p.tw));
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, p.s, p.s);
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(loop);
    })();
  }

  /* ═══════════ INIT ═══════════ */
  document.addEventListener("DOMContentLoaded", () => {
    $("#footer-year").textContent = new Date().getFullYear();
    renderCoins(CoinBank.balance);
    renderCatalog();
    VendingMachine.init();
    initParticles();

    // 환영 인사
    setTimeout(
      () => toast("어서오세요! 코인 5개가 지급되었습니다.♥", "gold"),
      700,
    );
  });
})();
