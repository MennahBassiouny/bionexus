/* BioNexus Hub — one file, loaded on every page via <script src="reactions.js" defer></script>.
   Handles: Microsoft Clarity analytics, footer year, the floating feedback button,
   per-lesson reactions (Supabase), "Mark complete" progress, and the Learn-page progress display. */
(function () {
  var SB = "https://wuyullrwhjrlackilxkx.supabase.co";
  var KEY = "sb_publishable_Ifknlm8w9rTfHISaaV4URQ_cpg-9lX9";
  var FORM = "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=ky6c7Ifqc0SCSJa_dg0BeMmGgTffXlVMpZ2oqB0FKtRUNllZMTU3MlVDRk81TkxaS0JBQ0JYVE9KNC4u";
  var H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
  var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  /* ---- Microsoft Clarity analytics (site-wide, project x42dr4bq40) ---- */
  (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","x42dr4bq40");

  function doneKey(p) { return "bnx-done-" + p; }
  function isDone(p) { try { return localStorage.getItem(doneKey(p)) === "1"; } catch (e) { return false; } }

  function start() {
    /* ---- footer year: always show the current year ---- */
    try {
      var yr = new Date().getFullYear();
      document.querySelectorAll("footer p").forEach(function (p) {
        p.innerHTML = p.innerHTML.replace(/(?:©|&copy;)\s*20\d\d/, "© " + yr);
      });
    } catch (e) {}

    /* ---- floating feedback button (every page) ---- */
    var fb = document.createElement("a");
    fb.href = FORM; fb.target = "_blank"; fb.rel = "noopener"; fb.title = "Send feedback";
    fb.textContent = "💬 Feedback";
    fb.setAttribute("style",
      "position:fixed;right:18px;bottom:18px;z-index:1500;background:linear-gradient(135deg,#5b9cf8,#a855f7);" +
      "color:#fff;padding:11px 18px;border-radius:30px;font-family:'Work Sans',sans-serif;font-weight:600;" +
      "font-size:0.92rem;text-decoration:none;box-shadow:0 6px 20px rgba(91,156,248,0.45);");
    document.body.appendChild(fb);

    /* ---- Learn page: show progress, then stop ---- */
    if (page === "learn.html") { buildProgress(); return; }

    /* ---- lesson pages only ---- */
    var lessonBody = document.querySelector(".lesson-body");
    var footer = document.querySelector("footer");
    if (!lessonBody || !footer) return;

    var w = document.createElement("div");
    w.setAttribute("style",
      "max-width:820px;margin:36px auto 0;padding:24px 26px;border:1px solid rgba(91,156,248,0.25);" +
      "border-radius:14px;background:#fff;text-align:center;font-family:'Work Sans',sans-serif;" +
      "box-shadow:0 4px 18px rgba(0,0,0,0.05);");
    w.innerHTML =
      '<button class="bnx-done" style="cursor:pointer;border:0;border-radius:30px;font-weight:700;font-size:1rem;padding:12px 26px;margin-bottom:20px;"></button>' +
      '<p style="font-weight:700;color:#0f172a;margin:0 0 4px;font-size:1.1rem;">Was this lesson helpful?</p>' +
      '<p style="color:#64748b;margin:0 0 16px;font-size:0.92rem;">Your tap helps us improve the material.</p>' +
      '<div style="display:flex;gap:14px;justify-content:center;">' +
      '<button class="bnx-up" style="cursor:pointer;border:1px solid rgba(16,185,129,0.4);background:rgba(16,185,129,0.08);color:#047857;font-weight:700;font-size:1rem;padding:10px 22px;border-radius:30px;">👍 <span class="bnx-up-c">0</span></button>' +
      '<button class="bnx-down" style="cursor:pointer;border:1px solid rgba(239,68,68,0.35);background:rgba(239,68,68,0.06);color:#b91c1c;font-weight:700;font-size:1rem;padding:10px 22px;border-radius:30px;">👎 <span class="bnx-down-c">0</span></button>' +
      '</div>' +
      '<p class="bnx-msg" style="min-height:18px;margin:12px 0 0;font-size:0.88rem;color:#10b981;"></p>' +
      '<p style="margin:6px 0 0;font-size:0.88rem;"><a href="' + FORM + '" target="_blank" rel="noopener" style="color:#5b9cf8;text-decoration:none;font-weight:600;">Have more to say? Send detailed feedback &rarr;</a></p>';
    footer.parentNode.insertBefore(w, footer);

    /* mark-complete button */
    var doneBtn = w.querySelector(".bnx-done");
    function paintDone() {
      if (isDone(page)) {
        doneBtn.textContent = "✓ Lesson completed";
        doneBtn.style.background = "rgba(16,185,129,0.12)";
        doneBtn.style.color = "#047857";
      } else {
        doneBtn.textContent = "Mark this lesson complete";
        doneBtn.style.background = "linear-gradient(135deg,#5b9cf8,#a855f7)";
        doneBtn.style.color = "#fff";
      }
    }
    doneBtn.onclick = function () {
      try {
        if (isDone(page)) localStorage.removeItem(doneKey(page));
        else localStorage.setItem(doneKey(page), "1");
      } catch (e) {}
      paintDone();
    };
    paintDone();

    /* reactions */
    var upC = w.querySelector(".bnx-up-c"), downC = w.querySelector(".bnx-down-c"), msg = w.querySelector(".bnx-msg");
    function refresh() {
      fetch(SB + "/rest/v1/reactions?select=reaction&page=eq." + encodeURIComponent(page), { headers: H })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!Array.isArray(d)) return;
          upC.textContent = d.filter(function (x) { return x.reaction === "like"; }).length;
          downC.textContent = d.filter(function (x) { return x.reaction === "dislike"; }).length;
        }).catch(function () {});
    }
    if (localStorage.getItem("bnx-react-" + page)) msg.textContent = "Thanks for your feedback!";
    function vote(kind) {
      if (localStorage.getItem("bnx-react-" + page)) { msg.textContent = "You already voted on this lesson."; return; }
      fetch(SB + "/rest/v1/reactions", { method: "POST", headers: H, body: JSON.stringify({ page: page, reaction: kind }) })
        .then(function (r) {
          if (r.ok) { localStorage.setItem("bnx-react-" + page, kind); msg.style.color = "#10b981"; msg.textContent = "Thanks for your feedback!"; refresh(); }
          else { msg.style.color = "#b91c1c"; msg.textContent = "Could not save — please try again later."; }
        })
        .catch(function () { msg.style.color = "#b91c1c"; msg.textContent = "Could not save — check your connection."; });
    }
    w.querySelector(".bnx-up").onclick = function () { vote("like"); };
    w.querySelector(".bnx-down").onclick = function () { vote("dislike"); };
    refresh();
  }

  /* ---- Learn-page progress: ✓ on done lessons, per-card counts, overall bar ---- */
  function buildProgress() {
    var links = Array.prototype.slice.call(
      document.querySelectorAll('.roadmap a[href$=".html"], .found-steps a[href$=".html"], .entry-card a[href$=".html"]')
    );
    var seen = {}, lessons = [];
    links.forEach(function (a) {
      var href = (a.getAttribute("href") || "").split("#")[0].toLowerCase();
      if (!href || href.indexOf(".html") === -1 || href === "learn.html") return;
      if (!seen[href]) { seen[href] = 1; lessons.push(href); }
      if (isDone(href) && a.getAttribute("data-bnx") !== "1") {
        a.setAttribute("data-bnx", "1");
        a.insertAdjacentHTML("afterbegin", '<span style="color:#10b981;font-weight:700;">✓ </span>');
      }
    });

    /* per-card counts */
    document.querySelectorAll(".track-card, .found-card").forEach(function (card) {
      var as = card.querySelectorAll('a[href$=".html"]');
      if (!as.length) return;
      var s2 = {}, t = 0, d = 0;
      as.forEach(function (a) {
        var h = (a.getAttribute("href") || "").split("#")[0].toLowerCase();
        if (h === "learn.html" || s2[h]) return;
        s2[h] = 1; t++; if (isDone(h)) d++;
      });
      if (!t) return;
      var h3 = card.querySelector("h3");
      if (h3) {
        var sp = document.createElement("span");
        sp.textContent = " " + d + "/" + t;
        sp.style.cssText = "color:" + (d === t ? "#10b981" : "#64748b") + ";font-weight:700;font-size:0.8em;white-space:nowrap;";
        h3.appendChild(sp);
      }
    });

    /* overall bar */
    var total = lessons.length, done = lessons.filter(isDone).length;
    if (!total) return;
    var pct = Math.round((done / total) * 100);
    var anchor = document.querySelector("section");
    if (!anchor) return;
    var box = document.createElement("div");
    box.setAttribute("style",
      "max-width:760px;margin:0 auto 8px;padding:18px 22px;border:1px solid rgba(91,156,248,0.25);border-radius:12px;" +
      "background:#fff;font-family:'Work Sans',sans-serif;box-shadow:0 4px 18px rgba(0,0,0,0.05);");
    box.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
      '<strong style="color:#0f172a;">Your progress</strong>' +
      '<span style="color:#64748b;font-size:0.9rem;">' + done + ' of ' + total + ' lessons complete</span></div>' +
      '<div style="height:10px;background:#eef2f7;border-radius:6px;overflow:hidden;">' +
      '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#5b9cf8,#a855f7);"></div></div>' +
      (done === 0 ? '<p style="margin:8px 0 0;color:#64748b;font-size:0.82rem;">Tip: tap “Mark this lesson complete” at the bottom of any lesson to track your progress here.</p>' : '');
    anchor.parentNode.insertBefore(box, anchor);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
