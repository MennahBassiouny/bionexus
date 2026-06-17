/* BioNexus Hub - in-page interactivity engine
   Two self-activating widgets, no backend, safe to load on every page:
   1) .pycell  -> a runnable Python code cell (Pyodide, lazy-loaded from CDN)
   2) .quiz    -> an auto-graded multiple-choice question
   The script injects its own CSS and only does work if the widgets exist. */
(function () {
  "use strict";

  /* ---------- styles ---------- */
  var CSS = '' +
    '.bnx-ix{--b:#5b9cf8;--p:#a855f7;--navy:#0f172a;--gray:#64748b;--green:#10b981;--red:#ef4444;}' +
    '.pycell{border:1px solid rgba(91,156,248,0.3);border-radius:12px;overflow:hidden;margin:22px 0;background:#0f172a;}' +
    '.pycell-bar{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:#111c33;border-bottom:1px solid rgba(255,255,255,0.07);}' +
    '.pycell-bar span{color:#94a3b8;font:600 0.78rem/1 "Work Sans",sans-serif;letter-spacing:.4px;text-transform:uppercase;}' +
    '.pycell-run{background:linear-gradient(135deg,#5b9cf8,#a855f7);color:#fff;border:0;border-radius:7px;padding:7px 18px;font:600 0.85rem "Work Sans",sans-serif;cursor:pointer;transition:transform .2s;}' +
    '.pycell-run:hover{transform:translateY(-1px);}' +
    '.pycell-run:disabled{opacity:.6;cursor:wait;}' +
    '.pycell textarea{width:100%;border:0;background:#0f172a;color:#e2e8f0;font:0.88rem/1.6 "JetBrains Mono",monospace;padding:16px 18px;resize:vertical;display:block;box-sizing:border-box;min-height:90px;outline:none;}' +
    '.pycell-out{margin:0;padding:0 18px;max-height:0;overflow:auto;background:#0b1220;color:#cbd5e1;font:0.85rem/1.55 "JetBrains Mono",monospace;border-top:1px solid rgba(255,255,255,0);transition:max-height .2s,padding .2s;white-space:pre-wrap;}' +
    '.pycell-out.show{max-height:360px;padding:14px 18px;border-top:1px solid rgba(255,255,255,0.07);}' +
    '.pycell-out .err{color:#fca5a5;}' +
    '.pycell-out .muted{color:#64748b;}' +
    '.quiz{background:#fff;border:1px solid rgba(91,156,248,0.25);border-radius:12px;padding:20px 22px;margin:18px 0;}' +
    '.quiz-q{font:600 1.05rem "Work Sans",sans-serif;color:#0f172a;margin-bottom:14px;}' +
    '.quiz-opt{display:block;width:100%;text-align:left;background:#f8fafc;border:1px solid rgba(91,156,248,0.25);border-radius:9px;padding:12px 15px;margin-bottom:9px;font:0.98rem "Work Sans",sans-serif;color:#1e293b;cursor:pointer;transition:all .15s;}' +
    '.quiz-opt:hover{border-color:#5b9cf8;background:#fff;}' +
    '.quiz-opt:disabled{cursor:default;}' +
    '.quiz-opt.correct{background:rgba(16,185,129,0.12);border-color:#10b981;color:#047857;font-weight:600;}' +
    '.quiz-opt.wrong{background:rgba(239,68,68,0.1);border-color:#ef4444;color:#b91c1c;}' +
    '.quiz-opt .mark{float:right;font-weight:700;}' +
    '.quiz-explain{margin-top:6px;padding:13px 16px;border-radius:9px;background:rgba(91,156,248,0.08);color:#475569;font:0.96rem/1.5 "Work Sans",sans-serif;display:none;}' +
    '.quiz-explain.show{display:block;}' +
    '.quiz-explain strong{color:#0f172a;}' +
    '.quiz-summary{margin:26px 0 8px;padding:18px 22px;border-radius:12px;font:600 1.05rem "Work Sans",sans-serif;display:none;}' +
    '.quiz-summary.show{display:block;}' +
    '.quiz-summary.pass{background:rgba(16,185,129,0.1);border:1px solid #10b981;color:#047857;}' +
    '.quiz-summary.fail{background:rgba(245,158,11,0.1);border:1px solid #f59e0b;color:#b45309;}' +
    '.quiz-summary .sub{display:block;font-weight:400;font-size:0.92rem;color:#475569;margin-top:6px;}' +
    '.ngsstrip{display:flex;flex-wrap:wrap;align-items:center;gap:6px;background:#fff;border:1px solid rgba(91,156,248,0.2);border-radius:10px;padding:10px 14px;margin:0 0 26px;font-family:"Work Sans",sans-serif;}' +
    '.ngsstrip .lab{font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;margin-right:2px;}' +
    '.ngsstrip a.step,.ngsstrip span.step{font-size:0.82rem;font-weight:600;text-decoration:none;padding:5px 11px;border-radius:7px;white-space:nowrap;}' +
    '.ngsstrip a.step{color:#3b6fd4;background:rgba(91,156,248,0.1);transition:background .15s;}' +
    '.ngsstrip a.step:hover{background:rgba(91,156,248,0.22);}' +
    '.ngsstrip span.step.here{color:#fff;background:linear-gradient(135deg,#5b9cf8,#a855f7);}' +
    '.ngsstrip .sep{color:#a855f7;font-weight:700;font-size:0.8rem;}';

  function injectCSS() {
    if (document.getElementById('bnx-ix-css')) return;
    var s = document.createElement('style');
    s.id = 'bnx-ix-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ---------- Pyodide (lazy, shared) ---------- */
  var PYODIDE_VER = 'v0.26.4';
  var pyodidePromise = null;
  function getPyodide() {
    if (!pyodidePromise) {
      pyodidePromise = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/pyodide/' + PYODIDE_VER + '/full/pyodide.js';
        s.onload = function () {
          window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/' + PYODIDE_VER + '/full/' })
            .then(resolve).catch(reject);
        };
        s.onerror = function () { reject(new Error('Could not load Python. Check your connection and try again.')); };
        document.head.appendChild(s);
      });
    }
    return pyodidePromise;
  }

  function buildPyCell(cell) {
    var src = cell.querySelector('script[type="application/x-python"]');
    var code = src ? src.textContent.replace(/^\n/, '').replace(/\s+$/, '') : '';
    cell.innerHTML = '';

    var bar = document.createElement('div');
    bar.className = 'pycell-bar';
    var label = document.createElement('span');
    label.textContent = 'Python · runs in your browser';
    var run = document.createElement('button');
    run.className = 'pycell-run';
    run.textContent = '▶ Run';
    bar.appendChild(label);
    bar.appendChild(run);

    var ta = document.createElement('textarea');
    ta.value = code;
    ta.spellcheck = false;
    ta.setAttribute('aria-label', 'Editable Python code');
    var rows = Math.min(Math.max(code.split('\n').length, 3), 18);
    ta.rows = rows;

    var out = document.createElement('pre');
    out.className = 'pycell-out';

    cell.appendChild(bar);
    cell.appendChild(ta);
    cell.appendChild(out);

    function show(text, isErr) {
      out.className = 'pycell-out show';
      out.innerHTML = '';
      var span = document.createElement('span');
      if (isErr) span.className = 'err';
      span.textContent = text;
      out.appendChild(span);
    }

    run.addEventListener('click', function () {
      run.disabled = true;
      var original = run.textContent;
      run.textContent = 'Loading…';
      out.className = 'pycell-out show';
      out.innerHTML = '<span class="muted">Starting Python (first run downloads it, ~5s)…</span>';
      getPyodide().then(function (py) {
        run.textContent = 'Running…';
        var buf = '';
        py.setStdout({ batched: function (m) { buf += m + '\n'; } });
        py.setStderr({ batched: function (m) { buf += m + '\n'; } });
        return py.runPythonAsync(ta.value).then(function () {
          show(buf.length ? buf : '(ran with no output)', false);
        }).catch(function (e) {
          show((buf ? buf + '\n' : '') + String(e.message || e), true);
        });
      }).catch(function (e) {
        show(String(e.message || e), true);
      }).then(function () {
        run.disabled = false;
        run.textContent = original;
      });
    });
  }

  /* ---------- Quiz ---------- */
  var gQuizTotal = 0, gQuizAnswered = 0, gQuizCorrect = 0, gSummaryEl = null;
  function updateQuizSummary() {
    if (!gSummaryEl || gQuizAnswered < gQuizTotal) return;
    var pct = Math.round(gQuizCorrect / gQuizTotal * 100);
    var pass = pct >= 70;
    gSummaryEl.className = 'quiz-summary show ' + (pass ? 'pass' : 'fail');
    gSummaryEl.innerHTML = 'Lesson check: you scored ' + gQuizCorrect + ' of ' + gQuizTotal + ' (' + pct + '%).' +
      '<span class="sub">' + (pass
        ? 'Passed (70% or above). You can mark this lesson complete at the bottom of the page.'
        : 'Aim for at least 70%. Re-read the sections you missed, then reload the page to retry the questions.') + '</span>';
    gSummaryEl.scrollIntoView({behavior:'smooth', block:'nearest'});
  }
  function buildQuiz(quiz, onFirstAnswer) {
    var question = quiz.getAttribute('data-question') || '';
    var qsrcEl = quiz.querySelector('.quiz-q-src');
    var qsrcHTML = qsrcEl ? qsrcEl.innerHTML : '';
    var opts = Array.prototype.slice.call(quiz.querySelectorAll('[data-opt]'));
    var explainEl = quiz.querySelector('.quiz-explain');
    var explainHTML = explainEl ? explainEl.innerHTML : '';

    quiz.innerHTML = '';
    var q = document.createElement('div');
    q.className = 'quiz-q';
    if (qsrcHTML) { q.innerHTML = qsrcHTML; } else { q.textContent = question; }
    quiz.appendChild(q);

    var explain = document.createElement('div');
    explain.className = 'quiz-explain';
    explain.innerHTML = explainHTML;

    var answered = false;
    opts.forEach(function (o) {
      var btn = document.createElement('button');
      btn.className = 'quiz-opt';
      btn.type = 'button';
      btn.textContent = o.textContent.trim();
      var isCorrect = o.hasAttribute('data-correct');
      btn.addEventListener('click', function () {
        if (answered) return;
        answered = true;
        var all = quiz.querySelectorAll('.quiz-opt');
        for (var i = 0; i < all.length; i++) all[i].disabled = true;
        if (isCorrect) {
          btn.classList.add('correct');
          btn.innerHTML = btn.textContent + '<span class="mark">✓</span>';
        } else {
          btn.classList.add('wrong');
          btn.innerHTML = btn.textContent + '<span class="mark">✗</span>';
          // reveal the correct one
          var correctBtns = quiz.querySelectorAll('.quiz-opt');
          for (var j = 0; j < correctBtns.length; j++) {
            if (opts[j] && opts[j].hasAttribute('data-correct')) {
              correctBtns[j].classList.add('correct');
              correctBtns[j].innerHTML = correctBtns[j].textContent + '<span class="mark">✓</span>';
            }
          }
        }
        if (explainHTML) explain.classList.add('show');
        if (onFirstAnswer) onFirstAnswer(isCorrect);
      });
      quiz.appendChild(btn);
    });
    quiz.appendChild(explain);
  }

  /* ---------- NGS pipeline strip ---------- */
  var NGS_STEPS = [
    ['fastqc', 'QC', 'ngs-fastqc.html'],
    ['trimming', 'Trim', 'ngs-trimming.html'],
    ['alignment', 'Align', 'ngs-alignment.html'],
    ['samtools', 'Sort & index', 'ngs-samtools.html'],
    ['variant', 'Variants', 'ngs-variant-calling.html']
  ];
  function buildNgsStrip(el) {
    var here = el.getAttribute('data-here') || '';
    el.innerHTML = '';
    var lab = document.createElement('span');
    lab.className = 'lab';
    lab.textContent = 'Pipeline:';
    el.appendChild(lab);
    NGS_STEPS.forEach(function (s, i) {
      if (i > 0) {
        var sep = document.createElement('span');
        sep.className = 'sep';
        sep.textContent = '→';
        el.appendChild(sep);
      }
      if (s[0] === here) {
        var sp = document.createElement('span');
        sp.className = 'step here';
        sp.textContent = s[1];
        el.appendChild(sp);
      } else {
        var a = document.createElement('a');
        a.className = 'step';
        a.href = s[2];
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = s[1];
        el.appendChild(a);
      }
    });
  }

  /* ---------- init ---------- */
  function init() {
    var cells = document.querySelectorAll('.pycell');
    var quizzes = document.querySelectorAll('.quiz');
    var strips = document.querySelectorAll('.ngsstrip');
    if (!cells.length && !quizzes.length && !strips.length) return;
    injectCSS();
    var root = document.body;
    if (root) root.classList.add('bnx-ix');
    for (var i = 0; i < cells.length; i++) buildPyCell(cells[i]);
    gQuizTotal = quizzes.length; gQuizAnswered = 0; gQuizCorrect = 0;
    var onQ = function (correct) { gQuizAnswered++; if (correct) gQuizCorrect++; updateQuizSummary(); };
    for (var k = 0; k < quizzes.length; k++) buildQuiz(quizzes[k], onQ);
    if (quizzes.length) {
      gSummaryEl = document.createElement('div');
      gSummaryEl.className = 'quiz-summary';
      var lastQ = quizzes[quizzes.length - 1];
      lastQ.parentNode.insertBefore(gSummaryEl, lastQ.nextSibling);
    }
    for (var s = 0; s < strips.length; s++) buildNgsStrip(strips[s]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
