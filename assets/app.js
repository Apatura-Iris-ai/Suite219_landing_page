(function () {
  "use strict";

  var enc = window.SUITE219_ENC;
  if (!window.crypto || !crypto.subtle) {
    document.addEventListener("DOMContentLoaded", function () {
      var el = document.getElementById("gate-error");
      if (el) el.textContent = "Diese Seite muss über HTTPS aufgerufen werden.";
    });
    return;
  }
  var gate = document.getElementById("gate");
  var gateCard = gate.querySelector(".gate-card");
  var form = document.getElementById("gate-form");
  var input = document.getElementById("gate-password");
  var submit = document.getElementById("gate-submit");
  var errorEl = document.getElementById("gate-error");
  var protectedEl = document.getElementById("protected");
  var STORAGE_KEY = "s219.pw";

  function b64ToBytes(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function deriveKey(password) {
    var encData = enc;
    var keyMaterial = crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    return keyMaterial.then(function (km) {
      return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: b64ToBytes(encData.salt), iterations: encData.iter, hash: "SHA-256" },
        km,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );
    });
  }

  function decrypt(password) {
    return deriveKey(password).then(function (key) {
      return crypto.subtle.decrypt(
        { name: "AES-GCM", iv: b64ToBytes(enc.iv) },
        key,
        b64ToBytes(enc.data)
      );
    }).then(function (plain) {
      return new TextDecoder().decode(plain);
    });
  }

  function showError(msg) {
    errorEl.textContent = msg;
    gateCard.classList.remove("shake");
    void gateCard.offsetWidth;
    gateCard.classList.add("shake");
  }

  function addLockButton() {
    if (document.querySelector(".lock-btn")) return;
    var btn = document.createElement("button");
    btn.className = "lock-btn";
    btn.type = "button";
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="10.5" width="16" height="10" rx="2.2"></rect><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"></path></svg> Seite sperren';
    btn.addEventListener("click", function () {
      sessionStorage.removeItem(STORAGE_KEY);
      location.reload();
    });
    document.body.appendChild(btn);
  }

  function unlock(password) {
    return decrypt(password).then(function (html) {
      sessionStorage.setItem(STORAGE_KEY, password);
      protectedEl.innerHTML = html;
      protectedEl.hidden = false;
      gate.classList.add("gate--open");
      addLockButton();
      burst();
      window.scrollTo(0, 0);
      return true;
    }).catch(function () {
      return false;
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var pw = input.value;
    if (!pw) return;
    submit.disabled = true;
    errorEl.textContent = "";
    unlock(pw).then(function (ok) {
      submit.disabled = false;
      if (!ok) {
        input.value = "";
        input.focus();
        showError("Passwort nicht korrekt – bitte erneut versuchen.");
      }
    });
  });

  var saved = sessionStorage.getItem(STORAGE_KEY);
  if (saved) {
    unlock(saved).then(function (ok) {
      if (!ok) sessionStorage.removeItem(STORAGE_KEY);
    });
  }

  var canvas = document.getElementById("sparkles");
  var ctx = canvas.getContext("2d");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var stars = [];
  var confetti = [];
  var raf = null;

  var GOLD = ["#f6e27a", "#d4af37", "#fff6d8", "#e9c766", "#ffffff"];

  function resize() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initStars() {
    stars = [];
    var count = Math.min(130, Math.floor((window.innerWidth * window.innerHeight) / 14000));
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: 0.6 + Math.random() * 1.9,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.2,
        color: GOLD[(Math.random() * GOLD.length) | 0]
      });
    }
  }

  function burst() {
    var cx = window.innerWidth / 2;
    var cy = Math.min(window.innerHeight * 0.35, 320);
    for (var i = 0; i < 170; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 3 + Math.random() * 9;
      confetti.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 3 + Math.random() * 6,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        color: GOLD[(Math.random() * GOLD.length) | 0],
        life: 1,
        decay: 0.006 + Math.random() * 0.01
      });
    }
  }

  function frame(t) {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t / 1000 * s.speed + s.phase));
      ctx.globalAlpha = tw;
      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    for (var j = confetti.length - 1; j >= 0; j--) {
      var c = confetti[j];
      c.x += c.vx;
      c.y += c.vy;
      c.vy += 0.16;
      c.vx *= 0.992;
      c.rot += c.vr;
      c.life -= c.decay;
      if (c.life <= 0 || c.y > window.innerHeight + 30) {
        confetti.splice(j, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, c.life);
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
      ctx.restore();
    }

    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener("resize", function () {
    resize();
    initStars();
  });

  resize();
  initStars();
  raf = requestAnimationFrame(frame);
})();
