// ==UserScript==
// @name         知网吸星大法 - CNKI全自动下载
// @namespace    https://cnki.net/
// @version      8.0
// @description  知网全自动批量下载PDF - 搜索页调度+详情页自动下载，断点续传，验证码暂停
// @match        *://*.cnki.net/*
// @match        *://*cnki*.*/*
// @match        *://*.atrust.seu.edu.cn/*
// @license      MIT
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    var STORAGE_KEY = 'cnki_downloaded';
    var SIGNAL_KEY = 'cnki_dl_signal';

    function getDownloaded() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e) { return []; }
    }
    function saveDownloaded(title) {
        var list = getDownloaded();
        if (list.indexOf(title) === -1) list.push(title);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
    function isDownloaded(title) { return getDownloaded().indexOf(title) !== -1; }
    function getDownloadedCount() { return getDownloaded().length; }

    // ══════════════════════════════════════════════════
    // 第二部分：文献详情页 —— 自动点击PDF下载
    // ══════════════════════════════════════════════════
    function initDetailPage() {
        // 只在被搜索页调度打开时才自动下载（URL带标记）
        if (location.search.indexOf('cnki_auto_dl=1') === -1 &&
            !localStorage.getItem('cnki_pending_dl')) return;

        var title = localStorage.getItem('cnki_pending_dl') || '';

        function findPdfBtn() {
            var btn = document.querySelector('#pdfDown') || document.querySelector('a#pdfDown')
                || document.querySelector('.btn-dlpdf');
            if (btn) return btn;
            var links = document.querySelectorAll('a');
            for (var i = 0; i < links.length; i++) {
                var t = links[i].textContent || '';
                if (t.indexOf('PDF') >= 0 && t.indexOf('\u4e0b\u8f7d') >= 0) return links[i];
            }
            for (var i = 0; i < links.length; i++) {
                if ((links[i].textContent || '').indexOf('PDF') >= 0) return links[i];
            }
            return null;
        }

        function findCajBtn() {
            var btn = document.querySelector('#cajDown') || document.querySelector('a#cajDown');
            if (btn) return btn;
            var links = document.querySelectorAll('a');
            for (var i = 0; i < links.length; i++) {
                if ((links[i].textContent || '').indexOf('CAJ') >= 0) return links[i];
            }
            return null;
        }

        function detectCaptcha() {
            var sels = ['.verify-img','#verify_pic','.slider-verify',
                '.tcaptcha-popup','#tcaptcha_iframe','.geetest_panel',
                'iframe[src*="captcha"]', 'iframe[src*="verify"]'];
            for (var i = 0; i < sels.length; i++) {
                try {
                    var el = document.querySelector(sels[i]);
                    if (el && el.offsetParent !== null && el.offsetHeight > 50) return true;
                } catch(e){}
            }
            var modals = document.querySelectorAll('.mask_layer, .pop_box');
            for (var i = 0; i < modals.length; i++) {
                try {
                    var s = window.getComputedStyle(modals[i]);
                    if (s.display !== 'none' && s.visibility !== 'hidden' && modals[i].offsetHeight > 200) return true;
                } catch(e){}
            }
            return false;
        }

        var attempts = 0;
        var maxAttempts = 30;
        var clicked = false;

        var timer = setInterval(function() {
            attempts++;

            // 有验证码就等，不计次数
            if (detectCaptcha()) {
                attempts--;
                return;
            }

            var pdfBtn = findPdfBtn();
            if (pdfBtn && !clicked) {
                clicked = true;
                pdfBtn.click();
                // 通知搜索页：下载成功
                localStorage.setItem(SIGNAL_KEY, JSON.stringify({
                    status: 'done', title: title, type: 'pdf', time: Date.now()
                }));
                localStorage.removeItem('cnki_pending_dl');
                clearInterval(timer);
                setTimeout(function() { window.close(); }, 500);
                return;
            }

            var cajBtn = findCajBtn();
            if (cajBtn && !clicked) {
                clicked = true;
                cajBtn.click();
                localStorage.setItem(SIGNAL_KEY, JSON.stringify({
                    status: 'done', title: title, type: 'caj', time: Date.now()
                }));
                localStorage.removeItem('cnki_pending_dl');
                clearInterval(timer);
                setTimeout(function() { window.close(); }, 500);
                return;
            }

            if (attempts >= maxAttempts) {
                localStorage.setItem(SIGNAL_KEY, JSON.stringify({
                    status: 'fail', title: title, time: Date.now()
                }));
                localStorage.removeItem('cnki_pending_dl');
                clearInterval(timer);
                setTimeout(function() { window.close(); }, 500);
            }
        }, 500);
    }

    // ══════════════════════════════════════════════════
    // 第一部分：搜索页 —— 调度面板
    // ══════════════════════════════════════════════════
    function initSearchPage() {
        var CONFIG = {
            restEvery: 50, restMin: 15, restMax: 30,
            maxPerSession: 200, autoNextPage: true
        };

        var SETTINGS_KEY = 'cnki_settings';
        function loadSettings() {
            try {
                var saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
                if (saved) { for (var k in saved) { if (CONFIG.hasOwnProperty(k)) CONFIG[k] = saved[k]; } }
            } catch(e) {}
        }
        function saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(CONFIG)); }
        loadSettings();

        // ── CSS ──
        var style = document.createElement('style');
        style.textContent = '\
#cnki-panel{position:fixed;bottom:20px;right:20px;z-index:99999;background:#fff;border:2px solid #1a73e8;border-radius:12px;padding:16px;width:340px;box-shadow:0 4px 20px rgba(0,0,0,0.15);font-family:Microsoft YaHei,sans-serif;font-size:14px;cursor:move;max-height:90vh;overflow-y:auto}\
#cnki-panel h3{margin:0 0 10px;color:#1a73e8;font-size:15px;border-bottom:1px solid #e0e0e0;padding-bottom:8px}\
#cnki-panel button{display:block;width:100%;padding:10px;margin:5px 0;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold}\
#cnki-btn-start{background:#1a73e8;color:#fff}\
#cnki-btn-stop{background:#ea4335;color:#fff}\
#cnki-btn-pause{background:#fb8c00;color:#fff}\
#cnki-btn-min{background:#f1f3f4;color:#333}\
#cnki-log{max-height:150px;overflow-y:auto;background:#f8f9fa;border-radius:6px;padding:8px;margin-top:8px;font-size:12px;line-height:1.5}\
#cnki-progress{margin:6px 0;font-weight:bold;color:#333}\
#cnki-countdown{margin:4px 0;color:#888;font-size:12px;min-height:18px}\
#cnki-captcha{display:none;background:#fff3cd;border:2px solid #ffc107;border-radius:8px;padding:10px;margin:8px 0;text-align:center;font-weight:bold;color:#856404;animation:cnkipulse 1.5s infinite}\
@keyframes cnkipulse{0%,100%{opacity:1}50%{opacity:0.6}}\
#cnki-mode-area{background:#f8f9fa;border-radius:8px;padding:10px;margin:8px 0}\
#cnki-mode-area label{display:inline-flex;align-items:center;gap:4px;cursor:pointer;margin-right:12px;font-size:13px}\
#cnki-mode-area input[type=radio]{margin:0}\
#cnki-settings{background:#f8f9fa;border-radius:8px;padding:12px;margin:8px 0;font-size:13px;display:none}\
#cnki-settings .setting-group{margin-bottom:8px}\
#cnki-settings .setting-label{font-weight:bold;color:#333;margin-bottom:4px}\
#cnki-settings .setting-desc{font-size:11px;color:#888;margin-bottom:4px}\
#cnki-settings .input-row{display:flex;align-items:center;gap:6px}\
#cnki-settings .input-row input[type=number]{width:50px;padding:4px 6px;border:1px solid #ccc;border-radius:4px;text-align:center;font-size:13px}\
.cnki-select-all-bar{background:#e3f2fd;border-radius:6px;padding:6px 10px;margin:6px 0;font-size:13px;display:none;align-items:center;gap:8px}\
';
        document.head.appendChild(style);

        // ── 面板 ──
        var panel = document.createElement('div');
        panel.id = 'cnki-panel';
        panel.innerHTML = '\
<h3>\u{1F31F} \u77e5\u7f51\u5438\u661f\u5927\u6cd5 v8 \u{1F525}</h3>\
<div id="cnki-progress">\u5c31\u7eea</div>\
<div id="cnki-countdown"></div>\
<div id="cnki-captcha" style="display:none">\u26a0 \u68c0\u6d4b\u5230\u9a8c\u8bc1\u7801\uff01\u8bf7\u5b8c\u6210\u6ed1\u5757\u9a8c\u8bc1\u540e\u81ea\u52a8\u7ee7\u7eed</div>\
<div id="cnki-mode-area">\
  <div style="font-weight:bold;margin-bottom:6px">\u4e0b\u8f7d\u6a21\u5f0f</div>\
  <label><input type="radio" name="cnki-mode" value="sequential" checked> \u987a\u5e8f\u4e0b\u8f7d</label>\
  <label><input type="radio" name="cnki-mode" value="selected"> \u52fe\u9009\u4e0b\u8f7d</label>\
</div>\
<div class="cnki-select-all-bar" id="cnki-select-bar">\
  <span>\u8bf7\u5728\u5de6\u4fa7\u5217\u8868\u4e2d\u52fe\u9009\u8981\u4e0b\u8f7d\u7684\u6587\u732e</span>\
</div>\
<div style="margin:6px 0;font-size:13px">\u4ece\u7b2c <input id="cnki-start-num" type="number" min="1" value="1" style="width:50px;padding:2px 4px;border:1px solid #ccc;border-radius:4px;text-align:center"> \u7bc7\u5f00\u59cb\uff08\u987a\u5e8f\u6a21\u5f0f\uff09</div>\
<button id="cnki-btn-settings" style="background:#5c6bc0;color:#fff">\u2699 \u4e2d\u573a\u4f11\u606f\u8bbe\u7f6e</button>\
<div id="cnki-settings">\
  <div class="setting-group">\
    <div class="setting-label">\u2615 \u4e2d\u573a\u4f11\u606f</div>\
    <div class="setting-desc">\u9632\u6b62\u77ed\u65f6\u95f4\u5927\u91cf\u8bf7\u6c42\u89e6\u53d1\u53cd\u722c\uff0c\u4f11\u606f\u65f6\u6709\u9192\u76ee\u5012\u8ba1\u65f6</div>\
    <div class="input-row">\
      <span>\u6bcf</span>\
      <input type="number" id="cnki-rest-every" min="1" value="' + CONFIG.restEvery + '">\
      <span>\u7bc7\u4f11\u606f</span>\
      <input type="number" id="cnki-rest-min" min="1" value="' + CONFIG.restMin + '">\
      <span>~</span>\
      <input type="number" id="cnki-rest-max" min="1" value="' + CONFIG.restMax + '">\
      <span>\u79d2</span>\
    </div>\
  </div>\
</div>\
<button id="cnki-btn-start">\u5f00\u59cb\u5168\u81ea\u52a8\u4e0b\u8f7d</button>\
<button id="cnki-btn-pause" style="display:none">\u6682\u505c</button>\
<button id="cnki-btn-skip-rest" style="display:none;background:#43a047;color:#fff">\u26a1 \u8df3\u8fc7\u4f11\u606f\uff0c\u7acb\u5373\u7ee7\u7eed</button>\
<button id="cnki-btn-stop" style="display:none">\u7ec8\u6b62</button>\
<button id="cnki-btn-import" style="background:#8e24aa;color:#fff">\u5bfc\u5165\u5df2\u4e0b\u8f7d\u8bb0\u5f55</button>\
<button id="cnki-btn-clear" style="background:#757575;color:#fff;font-size:12px">\u6e05\u7a7a\u4e0b\u8f7d\u8bb0\u5f55</button>\
<button id="cnki-btn-min">\u6700\u5c0f\u5316</button>\
<div id="cnki-log"></div>\
';
        document.body.appendChild(panel);

        // ── 拖动 ──
        var isDragging = false, dragX = 0, dragY = 0;
        panel.addEventListener('mousedown', function(e) {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL') return;
            isDragging = true;
            dragX = e.clientX - panel.getBoundingClientRect().left;
            dragY = e.clientY - panel.getBoundingClientRect().top;
        });
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            panel.style.left = (e.clientX - dragX) + 'px';
            panel.style.top = (e.clientY - dragY) + 'px';
            panel.style.right = 'auto'; panel.style.bottom = 'auto';
        });
        document.addEventListener('mouseup', function() { isDragging = false; });

        // ── DOM ──
        var logBox = document.getElementById('cnki-log');
        var progressBox = document.getElementById('cnki-progress');
        var countdownBox = document.getElementById('cnki-countdown');
        var captchaBox = document.getElementById('cnki-captcha');
        var btnStart = document.getElementById('cnki-btn-start');
        var btnPause = document.getElementById('cnki-btn-pause');
        var btnStop = document.getElementById('cnki-btn-stop');
        var btnMin = document.getElementById('cnki-btn-min');
        var btnSettings = document.getElementById('cnki-btn-settings');
        var settingsPanel = document.getElementById('cnki-settings');
        var selectBar = document.getElementById('cnki-select-bar');
        var btnSkipRest = document.getElementById('cnki-btn-skip-rest');

        var running = false, paused = false, skipRest = false;
        var downloadMode = 'sequential';

        btnSkipRest.addEventListener('click', function() { skipRest = true; });

        btnSettings.addEventListener('click', function() {
            var show = settingsPanel.style.display === 'none' || !settingsPanel.style.display;
            settingsPanel.style.display = show ? 'block' : 'none';
            btnSettings.textContent = show ? '\u2699 \u6536\u8d77\u8bbe\u7f6e' : '\u2699 \u4e2d\u573a\u4f11\u606f\u8bbe\u7f6e';
        });

        ['cnki-rest-every','cnki-rest-min','cnki-rest-max'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('change', function() {
                var map = {'cnki-rest-every':'restEvery','cnki-rest-min':'restMin','cnki-rest-max':'restMax'};
                CONFIG[map[id]] = parseInt(el.value) || 1;
                if (CONFIG.restMax < CONFIG.restMin) CONFIG.restMax = CONFIG.restMin;
                saveSettings();
            });
        });

        document.querySelectorAll('input[name="cnki-mode"]').forEach(function(r) {
            r.addEventListener('change', function() {
                downloadMode = this.value;
                selectBar.style.display = downloadMode === 'selected' ? 'flex' : 'none';
            });
        });

        function log(text, color) {
            var item = document.createElement('div');
            item.style.borderBottom = '1px solid #eee';
            item.style.padding = '2px 0';
            item.style.color = color || '#1a73e8';
            var now = new Date();
            var ts = [now.getHours(), now.getMinutes(), now.getSeconds()]
                .map(function(n){ return n.toString().padStart(2,'0'); }).join(':');
            item.textContent = '[' + ts + '] ' + text;
            logBox.insertBefore(item, logBox.firstChild);
        }

        function sleep(ms) { return new Promise(function(r){ setTimeout(r, ms); }); }

        async function waitIfPaused() {
            while (paused && running) {
                countdownBox.textContent = '\u5df2\u6682\u505c\uff0c\u70b9\u51fb\u201c\u7ee7\u7eed\u201d\u6062\u590d';
                await sleep(500);
            }
        }

        async function restDelay() {
            skipRest = false;
            var totalSec = Math.floor(Math.random() * (CONFIG.restMax - CONFIG.restMin)) + CONFIG.restMin;
            log('\u4e2d\u573a\u4f11\u606f ' + totalSec + ' \u79d2\uff08\u53ef\u8df3\u8fc7\uff09', '#e67e22');
            countdownBox.style.cssText = 'margin:4px 0;font-size:14px;font-weight:bold;color:#e67e22;background:#fff3cd;padding:6px;border-radius:6px;text-align:center';
            progressBox.textContent = '\u4e2d\u573a\u4f11\u606f\u4e2d...';
            btnSkipRest.style.display = 'block';
            for (var s = totalSec; s > 0; s--) {
                if (!running || skipRest) break;
                await waitIfPaused();
                var m = Math.floor(s / 60), sec = s % 60;
                countdownBox.textContent = '\u4f11\u606f\u4e2d ' + m + ':' + sec.toString().padStart(2, '0') + ' \uff08\u70b9\u4e0b\u65b9\u8df3\u8fc7\uff09';
                await sleep(1000);
            }
            btnSkipRest.style.display = 'none';
            if (skipRest) log('\u5df2\u8df3\u8fc7\u4f11\u606f', '#1a73e8');
            countdownBox.textContent = '';
            countdownBox.style.cssText = 'margin:4px 0;color:#888;font-size:12px;min-height:18px';
        }

        function getArticles() {
            var arts = document.querySelectorAll('table.result-table-list tbody tr td.name a.fz14');
            if (arts.length === 0) arts = document.querySelectorAll('a.fz14');
            return arts;
        }

        function getSelectedArticles() {
            var result = [];
            document.querySelectorAll('table.result-table-list tbody tr').forEach(function(row) {
                var cb = row.querySelector('input[type="checkbox"]');
                if (cb && cb.checked) {
                    var link = row.querySelector('td.name a.fz14') || row.querySelector('a.fz14');
                    if (link) result.push(link);
                }
            });
            return result;
        }

        function markDownloaded() {
            var arts = getArticles();
            for (var i = 0; i < arts.length; i++) {
                if (isDownloaded(arts[i].textContent.trim())) arts[i].style.backgroundColor = '#d4edda';
            }
        }

        // ── 等待详情页回报结果 ──
        function waitForSignal(title, newWin, timeoutMs) {
            return new Promise(function(resolve) {
                var resolved = false;
                var startTime = Date.now();

                // 监听 localStorage 变化（详情页写入信号）
                function onStorage(e) {
                    if (e.key !== SIGNAL_KEY) return;
                    try {
                        var sig = JSON.parse(e.newValue);
                        if (sig && sig.title === title) {
                            cleanup();
                            resolve(sig.status === 'done' ? sig.type : 'none');
                        }
                    } catch(ex) {}
                }

                // 检测窗口是否已关闭（用户手动关闭或详情页自己关闭）
                var pollTimer = setInterval(function() {
                    if (resolved) return;
                    try {
                        if (newWin.closed) {
                            cleanup();
                            // 检查是否有信号（可能窗口关闭比事件快）
                            try {
                                var sig = JSON.parse(localStorage.getItem(SIGNAL_KEY));
                                if (sig && sig.title === title && sig.status === 'done') {
                                    resolve(sig.type);
                                    return;
                                }
                            } catch(ex){}
                            resolve('closed');
                        }
                    } catch(ex) {}
                    if (Date.now() - startTime > timeoutMs) {
                        cleanup();
                        resolve('timeout');
                    }
                }, 300);

                function cleanup() {
                    if (resolved) return;
                    resolved = true;
                    window.removeEventListener('storage', onStorage);
                    clearInterval(pollTimer);
                }

                window.addEventListener('storage', onStorage);
            });
        }

        // ── 最小化 ──
        btnMin.addEventListener('click', function() {
            panel.style.display = 'none';
            var mb = document.createElement('button');
            mb.style.cssText = 'position:fixed;top:80px;right:20px;z-index:99999;background:#1a73e8;color:#fff;border:none;border-radius:50%;width:50px;height:50px;font-size:24px;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,0.3)';
            mb.textContent = '\u25bc';
            mb.addEventListener('click', function(){ panel.style.display='block'; mb.remove(); });
            document.body.appendChild(mb);
        });

        document.getElementById('cnki-btn-import').addEventListener('click', function() {
            var input = prompt('\u8bf7\u7c98\u8d34\u5df2\u4e0b\u8f7d\u7684PDF\u6587\u4ef6\u540d\uff08\u6bcf\u884c\u4e00\u4e2a\uff09\uff1a');
            if (!input) return;
            var titles = input.split(/[\n,]/).map(function(t) {
                return t.trim().replace(/\.pdf$/i, '');
            }).filter(function(t) { return t.length > 0; });
            var added = 0;
            titles.forEach(function(t) { if (!isDownloaded(t)) { saveDownloaded(t); added++; } });
            log('\u5bfc\u5165 ' + added + ' \u6761\uff0c\u603b\u8ba1 ' + getDownloadedCount() + ' \u6761', '#8e24aa');
            markDownloaded();
        });

        document.getElementById('cnki-btn-clear').addEventListener('click', function() {
            if (confirm('\u786e\u5b9a\u6e05\u7a7a\u6240\u6709\u4e0b\u8f7d\u8bb0\u5f55\uff1f')) {
                localStorage.removeItem(STORAGE_KEY);
                log('\u5df2\u6e05\u7a7a', '#ea4335');
                var arts = getArticles();
                for (var i = 0; i < arts.length; i++) arts[i].style.backgroundColor = '';
            }
        });

        btnPause.addEventListener('click', function() {
            if (paused) {
                paused = false; btnPause.textContent = '\u6682\u505c'; btnPause.style.background = '#fb8c00';
                log('\u5df2\u6062\u590d', '#0d904f');
            } else {
                paused = true; btnPause.textContent = '\u7ee7\u7eed'; btnPause.style.background = '#0d904f';
                log('\u5df2\u6682\u505c', '#e67e22');
            }
        });

        btnStop.addEventListener('click', function() {
            running = false; paused = false;
            btnStop.style.display = 'none'; btnPause.style.display = 'none';
            btnStart.style.display = 'block'; captchaBox.style.display = 'none';
            countdownBox.textContent = '';
            log('\u5df2\u7ec8\u6b62', '#ea4335');
            progressBox.textContent = '\u5df2\u7ec8\u6b62';
        });

        // ── 开始 ──
        btnStart.addEventListener('click', async function() {
            var targetArticles;
            if (downloadMode === 'selected') {
                targetArticles = getSelectedArticles();
                if (targetArticles.length === 0) { log('\u8bf7\u5148\u52fe\u9009\u8981\u4e0b\u8f7d\u7684\u6587\u732e\uff01', '#ea4335'); return; }
            } else {
                targetArticles = Array.from(getArticles());
                if (targetArticles.length === 0) { log('\u672a\u627e\u5230\u6587\u732e\u5217\u8868\uff01', '#ea4335'); return; }
            }

            CONFIG.restEvery = parseInt(document.getElementById('cnki-rest-every').value) || 50;
            CONFIG.restMin = parseInt(document.getElementById('cnki-rest-min').value) || 15;
            CONFIG.restMax = parseInt(document.getElementById('cnki-rest-max').value) || 30;
            if (CONFIG.restMax < CONFIG.restMin) CONFIG.restMax = CONFIG.restMin;
            saveSettings();

            settingsPanel.style.display = 'none';
            btnSettings.textContent = '\u2699 \u4e2d\u573a\u4f11\u606f\u8bbe\u7f6e';
            running = true; paused = false;
            btnStart.style.display = 'none'; btnPause.style.display = 'block'; btnStop.style.display = 'block';
            logBox.innerHTML = '';

            var modeLabel = downloadMode === 'selected' ? '\u52fe\u9009' : '\u987a\u5e8f';
            log(modeLabel + '\u6a21\u5f0f\uff0c\u5171 ' + targetArticles.length + ' \u7bc7\uff0c\u7d2f\u8ba1\u5df2\u4e0b\u8f7d ' + getDownloadedCount() + ' \u7bc7', '#1a73e8');

            var success = 0, failed = 0, skipped = 0;

            for (var i = 0; i < targetArticles.length; i++) {
                if (!running) break;
                await waitIfPaused();
                if (!running) break;

                if (success >= CONFIG.maxPerSession) {
                    log('\u8fbe\u5230' + success + '\u7bc7\u4e0a\u9650', '#e67e22'); break;
                }
                if (success > 0 && success % CONFIG.restEvery === 0) {
                    await restDelay();
                    if (!running) break;
                }

                var article = targetArticles[i];
                var title = article.textContent.trim();
                var href = article.href;

                if (isDownloaded(title)) {
                    article.style.backgroundColor = '#d4edda';
                    skipped++; continue;
                }

                progressBox.textContent = '[' + (i+1) + '/' + targetArticles.length + '] ' + title.substring(0, 22) + '...';
                log('[' + (i+1) + '] ' + title, '#1a73e8');

                if (!href) { log('  \u8df3\u8fc7(\u65e0\u94fe\u63a5)', '#ea4335'); failed++; continue; }

                article.style.backgroundColor = '#fff3cd';
                article.scrollIntoView({behavior:'smooth', block:'center'});

                // 写入待下载标记，详情页读取
                localStorage.setItem('cnki_pending_dl', title);
                localStorage.removeItem(SIGNAL_KEY);

                var dlUrl = href + (href.indexOf('?') >= 0 ? '&' : '?') + 'cnki_auto_dl=1';
                var newWin = window.open(dlUrl, '_blank');
                if (!newWin) {
                    log('\u5f39\u7a97\u88ab\u62e6\u622a\uff01\u8bf7\u5141\u8bb8\u5f39\u7a97', '#ea4335');
                    running = false; break;
                }

                // 等待详情页回报（最长30秒）
                var result = await waitForSignal(title, newWin, 30000);

                // 确保窗口关闭
                try { if (!newWin.closed) newWin.close(); } catch(e) {}

                if (result === 'pdf' || result === 'caj') {
                    article.style.backgroundColor = '#d4edda';
                    saveDownloaded(title);
                    success++;
                    log('  \u2713 ' + result.toUpperCase() + ' [\u7d2f\u8ba1' + getDownloadedCount() + ']', '#0d904f');
                } else if (result === 'closed') {
                    // 窗口被关闭但没收到信号，检查是否可能已下载
                    article.style.backgroundColor = '#f8d7da';
                    failed++;
                    log('  \u2717 \u7a97\u53e3\u5df2\u5173\u95ed\uff0c\u672a\u786e\u8ba4\u4e0b\u8f7d', '#ea4335');
                } else {
                    article.style.backgroundColor = '#f8d7da';
                    failed++;
                    log('  \u2717 \u4e0b\u8f7d\u5931\u8d25(' + result + ')', '#ea4335');
                }
            }

            // ── 翻页 ──
            if (running && CONFIG.autoNextPage && downloadMode === 'sequential') {
                var nextBtn = document.querySelector('a#PageNext') || document.querySelector('a.next');
                if (!nextBtn) {
                    document.querySelectorAll('a').forEach(function(a) {
                        if (!nextBtn && (a.textContent.trim() === '\u4e0b\u4e00\u9875' || a.textContent.trim() === '>'))
                            nextBtn = a;
                    });
                }
                if (nextBtn) {
                    log('\u672c\u9875\u5b8c\u6210\uff01' + success + '\u7bc7 \u7d2f\u8ba1' + getDownloadedCount(), '#0d904f');
                    log('\u7ffb\u9875...', '#1a73e8');
                    await sleep(1000);
                    if (running) {
                        localStorage.setItem('cnki_auto_continue', 'true');
                        nextBtn.click(); return;
                    }
                } else {
                    log('\u5168\u90e8\u5b8c\u6210\uff01', '#0d904f');
                }
            }

            running = false; paused = false;
            btnStop.style.display = 'none'; btnPause.style.display = 'none'; btnStart.style.display = 'block';
            countdownBox.textContent = ''; captchaBox.style.display = 'none';
            progressBox.textContent = '\u5b8c\u6210\uff01' + success + '\u7bc7 \u8df3\u8fc7' + skipped + ' \u5931\u8d25' + failed;
            log('\u5b8c\u6210\uff01' + success + '/' + skipped + '/' + failed + ' \u7d2f\u8ba1' + getDownloadedCount(), '#0d904f');
        });

        markDownloaded();
        var initArts = getArticles();
        var initSkip = 0;
        for (var k = 0; k < initArts.length; k++) {
            if (isDownloaded(initArts[k].textContent.trim())) initSkip++;
        }
        log('v8 \u5df2\u52a0\u8f7d\uff0c\u7d2f\u8ba1 ' + getDownloadedCount() + ' \u7bc7', '#0d904f');
        if (initSkip > 0) log('\u672c\u9875 ' + initSkip + ' \u7bc7\u5df2\u4e0b\u8f7d\uff08\u7eff\u8272\uff09', '#0d904f');

        if (localStorage.getItem('cnki_auto_continue') === 'true') {
            localStorage.removeItem('cnki_auto_continue');
            log('\u7ffb\u9875\u540e\u81ea\u52a8\u7ee7\u7eed...', '#1a73e8');
            setTimeout(function(){ btnStart.click(); }, 2000);
        }
    }

    // ══════════════════════════════════════════════════
    // 入口：判断当前页面类型
    // ══════════════════════════════════════════════════
    setTimeout(function() {
        var isSearchPage = !!(
            document.querySelector('table.result-table-list') ||
            document.querySelector('.result-table-list') ||
            document.querySelector('#gridTable')
        );

        if (isSearchPage) {
            initSearchPage();
        } else {
            initDetailPage();
        }
    }, 2000);

})();
