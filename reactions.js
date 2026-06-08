/* BioNexus Hub — lesson reactions (👍/👎) + site-wide feedback button.
   All config lives here so pages only need: <script src="reactions.js" defer></script> */
(function () {
  /* ---- Microsoft Clarity analytics (site-wide, project x42dr4bq40) ---- */
  (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","x42dr4bq40");

  var SB = "https://wuyullrwhjrlackilxkx.supabase.co";
  var KEY = "sb_publishable_Ifknlm8w9rTfHISaaV4URQ_cpg-9lX9";
  var FORM = "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=ky6c7Ifqc0SCSJa_dg0BeMmGgTffXlVMpZ2oqB0FKtRUNllZMTU3MlVDRk81TkxaS0JBQ0JYVE9KNC4u";
  var H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
  var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  function start() {
    /* ---- floating feedback button (every page) ---- */
    var fb = document.createElement("a");
    fb.href = FORM; fb.target = "_blank"; fb.rel = "noopener"; fb.title = "Send feedback";
    fb.textContent = "💬 Feedback";
    fb.setAttribute("style",
      "position:fixed;right:18px;bottom:18px;z-index:1500;background:linear-gradient(135deg,#5b9cf8,#a855f7);" +
      "color:#fff;padding:11px 18px;border-radius:30px;font-family:'Work Sans',sans-serif;font-weight:600;" +
      "font-size:0.92rem;text-decoration:none;box-shadow:0 6px 20px rgba(91,156,248,0.45);");
    document.body.appendChild(fb);

    /* ---- reaction widget (lesson pages only) ---- */
    var lessonBody = document.querySelector(".lesson-body");
    var footer = document.querySelector("footer");
    if (!lessonBody || !footer) return;

    var w = document.createElement("div");
    w.setAttribute("style",
      "max-width:820px;margin:36px auto 0;padding:24px 26px;border:1px solid rgba(91,156,248,0.25);" +
      "border-radius:14px;background:#fff;text-align:center;font-family:'Work Sans',sans-serif;" +
      "box-shadow:0 4px 18px rgba(0,0,0,0.05);");
    w.innerHTML =
      '<p style="font-weight:700;color:#0f172a;margin:0 0 4px;font-size:1.1rem;">Was this lesson helpful?</p>' +
      '<p style="color:#64748b;margin:0 0 16px;font-size:0.92rem;">Your tap helps us improve the material.</p>' +
      '<div style="display:flex;gap:14px;justify-content:center;">' +
      '<button class="bnx-up" style="cursor:pointer;border:1px solid rgba(16,185,129,0.4);background:rgba(16,185,129,0.08);color:#047857;font-weight:700;font-size:1rem;padding:10px 22px;border-radius:30px;">👍 <span class="bnx-up-c">0</span></button>' +
      '<button class="bnx-down" style="cursor:pointer;border:1px solid rgba(239,68,68,0.35);background:rgba(239,68,68,0.06);color:#b91c1c;font-weight:700;font-size:1rem;padding:10px 22px;border-radius:30px;">👎 <span class="bnx-down-c">0</span></button>' +
      '</div>' +
      '<p class="bnx-msg" style="min-height:18px;margin:12px 0 0;font-size:0.88rem;color:#10b981;"></p>' +
      '<p style="margin:6px 0 0;font-size:0.88rem;"><a href="' + FORM + '" target="_blank" rel="noopener" style="color:#5b9cf8;text-decoration:none;font-weight:600;">Have more to say? Send detailed feedback &rarr;</a></p>';
    footer.parentNode.insertBefore(w, footer);

    var upC = w.querySelector(".bnx-up-c"),
        downC = w.querySelector(".bnx-down-c"),
        msg = w.querySelector(".bnx-msg");

    function refresh() {
      fetch(SB + "/rest/v1/reactions?select=reaction&page=eq." + encodeURIComponent(page), { headers: H })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!Array.isArray(d)) return;
          upC.textContent = d.filter(function (x) { return x.reaction === "like"; }).length;
          downC.textContent = d.filter(function (x) { return x.reaction === "dislike"; }).length;
        })
        .catch(function () {});
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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
