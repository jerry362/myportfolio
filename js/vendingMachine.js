/* ══════════════════════════════════════════════════════════
   PIXEL DROP — vendingMachine.js
   자판기 상태 머신 + Web Audio 효과음
   State: IDLE → COIN_INSERTED → SELECTING → PROCESSING → DISPENSED → (COLLECT)
   ══════════════════════════════════════════════════════════ */

/* ── SoundFX : Web Audio API 8-bit 효과음 ── */
const SoundFX = (function () {
  let ctx = null;
  let enabled = true;

  function beep(freq, dur, type, vol, delay) {
    if (!enabled) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      const t = ctx.currentTime + (delay || 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || "square";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(vol || 0.045, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur);
    } catch (e) {
      /* 오디오 미지원 환경은 조용히 무시 */
    }
  }

  return {
    toggle() {
      enabled = !enabled;
      return enabled;
    },
    isEnabled() {
      return enabled;
    },
    coin() {
      beep(880, 0.09);
      beep(1318, 0.14, "square", 0.045, 0.1);
    },
    key() {
      beep(620, 0.05, "square", 0.03);
    },
    ok() {
      beep(784, 0.07);
      beep(988, 0.1, "square", 0.04, 0.07);
    },
    error() {
      beep(170, 0.22, "sawtooth", 0.05);
      beep(120, 0.25, "sawtooth", 0.05, 0.12);
    },
    motor() {
      beep(130, 0.5, "sawtooth", 0.028);
      beep(98, 0.55, "sawtooth", 0.028, 0.35);
      beep(150, 0.4, "sawtooth", 0.028, 0.7);
    },
    drop() {
      beep(330, 0.1, "triangle", 0.05);
      beep(220, 0.12, "triangle", 0.05, 0.12);
      beep(160, 0.18, "triangle", 0.05, 0.24);
    },
    open() {
      [523, 659, 784, 1047].forEach((f, i) =>
        beep(f, 0.13, "square", 0.04, i * 0.09),
      );
    },
    save() {
      beep(784, 0.1);
      beep(1175, 0.16, "square", 0.04, 0.1);
    },
    gacha() {
      [392, 494, 587, 784, 988].forEach((f, i) =>
        beep(f, 0.1, "triangle", 0.045, i * 0.07),
      );
    },
  };
})();

/* ── VendingMachine : 상태 머신 ── */
const VendingMachine = (function () {
  const STATE = {
    IDLE: "IDLE",
    COIN: "COIN_INSERTED",
    SELECT: "SELECTING",
    PROCESS: "PROCESSING",
    DISPENSED: "DISPENSED",
  };
  const ROWS = ["A", "B", "C"];

  let state = STATE.IDLE;
  let buffer = "";
  let dispensed = null; // { slot, product }
  const stock = {}; // slot → boolean (재고)
  let els = {};

  const $ = (s) => document.querySelector(s);

  /* ── LCD 출력 (mode: static | blink | scroll) ── */
  function lcd(text, mode) {
    const line = els.lcdText;
    if (!line) return;
    line.textContent = text;
    line.className = "lcd-line" + (mode ? " mode-" + mode : "");
  }
  function led(color) {
    els.lcd.classList.remove("led-gold", "led-lime");
    if (color) els.lcd.classList.add("led-" + color);
  }

  /* ── 슬롯 진열창 렌더링 ── */
  function renderSlots() {
    els.slots.innerHTML = products
      .map((p) => {
        stock[p.slot] = true;
        const sold = stock[p.slot] === false;
        return `
        <div class="slot" data-slot="${p.slot}" title="${p.title}">
          <img src="${p.imageSrc}" alt="${p.title}" loading="lazy" />
          <span class="slot-code">${p.slot}</span>
          <span class="slot-shelf"></span>
          ${sold ? '<span class="soldout-tag">SOLD OUT</span>' : ""}
        </div>`;
      })
      .join("");
  }

  function slotEl(slot) {
    return els.slots.querySelector(`.slot[data-slot="${slot}"]`);
  }

  function setSlotState(slot, cls, on) {
    const el = slotEl(slot);
    if (el) el.classList.toggle(cls, on);
  }

  function setKeypad(enabled) {
    els.keypad.querySelectorAll(".key").forEach((k) => {
      k.disabled = !enabled;
    });
    els.coinBtn.disabled = state === STATE.PROCESS;
  }

  /* ── 상태 전이 ── */
  function goIdle() {
    state = STATE.IDLE;
    buffer = "";
    lcd("INSERT COIN TO START", "scroll");
    led(null);
    setKeypad(false);
    els.tray.classList.remove("has-capsule");
    els.coinBtn.disabled = false;
  }

  function insertCoin() {
    if (state === STATE.PROCESS || state === STATE.DISPENSED) {
      SoundFX.error();
      lcd(
        state === STATE.DISPENSED ? "COLLECT ITEM FIRST!" : "PLEASE WAIT...",
        "blink",
      );
      setTimeout(() => {
        if (state === STATE.DISPENSED) lcd("COLLECT YOUR ITEM ▼", "blink");
      }, 1300);
      return;
    }
    if (state === STATE.COIN || state === STATE.SELECT) {
      SoundFX.error();
      lcd("CREDIT ALREADY 1 · SELECT!", "blink");
      setTimeout(() => {
        if (state === STATE.SELECT) lcd("CREDIT 1 · SELECT A1~C3", "static");
      }, 1200);
      return;
    }
    if (window.CoinBank && !window.CoinBank.spend(1)) return; // 잔액 부족 처리는 CoinBank가 담당

    state = STATE.COIN;
    SoundFX.coin();
    els.flyCoin.classList.remove("flying");
    void els.flyCoin.offsetWidth; // 애니메이션 리플로우
    els.flyCoin.classList.add("flying");

    setTimeout(() => {
      state = STATE.SELECT;
      buffer = "";
      lcd("CREDIT 1 · SELECT A1~C3", "static");
      led("gold");
      setKeypad(true);
    }, 480);
  }

  function pressKey(key) {
    const btn = els.keypad.querySelector(`.key[data-key="${key}"]`);
    if (btn) {
      btn.classList.remove("pressed");
      void btn.offsetWidth;
      btn.classList.add("pressed");
    }

    if (state !== STATE.SELECT) return;

    if (key === "CLR") {
      SoundFX.key();
      buffer = "";
      lcd("CREDIT 1 · SELECT A1~C3", "static");
      return;
    }
    if (key === "OK") {
      if (buffer.length === 2) validateAndDispense();
      else {
        SoundFX.error();
        lcd("INPUT ROW+NUMBER", "blink");
      }
      return;
    }

    SoundFX.key();
    const isRow = ROWS.includes(key);
    if (isRow) {
      buffer = key; // 행 문자는 항상 처음 자리
      lcd(`SELECT > ${key}_`, "static");
      highlightRow(key);
    } else if (/^[1-3]$/.test(key)) {
      if (!buffer) {
        SoundFX.error();
        lcd("ROW FIRST! (A/B/C)", "blink");
        setTimeout(() => {
          if (state === STATE.SELECT) lcd("CREDIT 1 · SELECT A1~C3", "static");
        }, 1100);
        return;
      }
      buffer = buffer[0] + key;
      lcd(`SELECT > ${buffer}`, "static");
      highlightRow(null);
      validateAndDispense(); // 2자리 완성 시 자동 배출
    }
  }

  function highlightRow(row) {
    els.slots.querySelectorAll(".slot").forEach((s) => {
      s.classList.toggle("selected", !!row && s.dataset.slot.startsWith(row));
    });
  }

  function validateAndDispense() {
    const product = products.find((p) => p.slot === buffer);
    if (!product) {
      SoundFX.error();
      lcd("INVALID CODE!", "blink");
      buffer = "";
      setTimeout(() => {
        if (state === STATE.SELECT) lcd("CREDIT 1 · SELECT A1~C3", "static");
      }, 1200);
      return;
    }
    dispense(product);
  }

  function dispense(product) {
    state = STATE.PROCESS;
    dispensed = { slot: product.slot, product };
    setKeypad(false);
    els.coinBtn.disabled = true;
    els.machine.classList.add("state-processing");
    setSlotState(product.slot, "processing", true);
    highlightRow(null);
    lcd("DISPENSING " + product.slot + "...", "blink");
    led(null);
    SoundFX.motor();

    setTimeout(() => {
      els.machine.classList.remove("state-processing");
      setSlotState(product.slot, "processing", false);
      setSlotState(product.slot, "soldout", true);
      stock[product.slot] = false;
      const tag = document.createElement("span");
      tag.className = "soldout-tag";
      tag.textContent = "SOLD OUT";
      const el = slotEl(product.slot);
      if (el && !el.querySelector(".soldout-tag")) el.appendChild(tag);

      // 캡슐 배출
      const meta = RARITY_META[product.rarity];
      const cap = document.createElement("div");
      cap.className = "tray-capsule";
      cap.style.setProperty("--rc", meta.color);
      cap.innerHTML =
        '<span class="tc-top"></span><span class="tc-bottom"></span><span class="tc-line"></span>';
      els.trayHole.innerHTML = "";
      els.trayHole.appendChild(cap);

      SoundFX.drop();
      state = STATE.DISPENSED;
      els.tray.classList.add("has-capsule");
      lcd("COLLECT YOUR ITEM ▼", "blink");
      led("lime");
    }, 1500);
  }

  function collect() {
    if (state !== STATE.DISPENSED || !dispensed) return;
    const cap = els.trayHole.querySelector(".tray-capsule");
    if (cap) cap.classList.add("collecting");
    SoundFX.ok();

    const { slot, product } = dispensed;
    dispensed = null;

    setTimeout(() => {
      els.trayHole.innerHTML = "";
      // 재고 복구 (데모이므로 무한 리스톡)
      stock[slot] = true;
      setSlotState(slot, "soldout", false);
      const el = slotEl(slot);
      if (el) {
        const tag = el.querySelector(".soldout-tag");
        if (tag) tag.remove();
        el.classList.remove("restock");
        void el.offsetWidth;
        el.classList.add("restock");
      }
      goIdle();
      if (window.AppBridge) window.AppBridge.openCapsule(product, "machine");
    }, 380);
  }

  /* ── 초기화 ── */
  function init() {
    els = {
      machine: $("#vending-machine"),
      slots: $("#vm-slots"),
      lcd: $(".lcd"),
      lcdText: $("#vm-lcd-text"),
      keypad: $("#vm-keypad"),
      coinBtn: $("#vm-coin-btn"),
      flyCoin: $("#fly-coin"),
      tray: $("#vm-tray"),
      trayHole: $("#vm-tray-hole"),
    };
    if (!els.machine) return;

    // 전구 생성
    document.querySelectorAll("[data-bulbs]").forEach((strip) => {
      for (let i = 0; i < 12; i++)
        strip.appendChild(document.createElement("i"));
    });

    renderSlots();
    goIdle();

    els.coinBtn.addEventListener("click", insertCoin);
    els.keypad.addEventListener("click", (e) => {
      const k = e.target.closest(".key");
      if (k && !k.disabled) pressKey(k.dataset.key);
    });
    els.tray.addEventListener("click", collect);
    els.tray.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        collect();
      }
    });

    // 키보드 지원: 자판기가 포커스 영역일 때 A-C / 1-3 입력
    document.addEventListener("keydown", (e) => {
      if (e.target.closest("input, textarea")) return;
      const k = e.key.toUpperCase();
      if (/^[ABC123]$/.test(k) && state === STATE.SELECT) pressKey(k);
    });
  }

  return { init, insertCoin, STATE, getState: () => state };
})();
