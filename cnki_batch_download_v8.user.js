// ==UserScript==
// @name         知网吸星大法 - CNKI全自动下载
// @namespace    https://cnki.net/
// @version      8.3
// @description  知网全自动批量下载PDF - 直接触发下载链接，断点续传，验证码暂停
// @match        *://*.cnki.net/*
// @match        *://*cnki*.*/*
// @match        *://*.atrust.seu.edu.cn/*
// @match        *://119.45.145.238/*
// @match        *://119.45.237.51/*
// @author       原作者Cowvirgina, Optimized by AI
// @license      MIT
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // 持续检查页面元素（翻页后 DOM 会重建）
    var panelInited = false;
    setInterval(function() {
        var batchOpsBox = document.querySelector('#batchOpsBox');
        var tableBody = document.querySelector('#gridTable table.result-table-list tbody');
        if (!batchOpsBox || !tableBody) return;
        if (document.getElementById('cnki-panel')) return;
        initPanel();
    }, 1000);

    function initPanel() {

        var CONFIG = {
            restEvery: 50, restMin: 15, restMax: 30, maxPerSession: 200
        };
        var SETTINGS_KEY = 'cnki_settings';
        var STORAGE_KEY = 'cnki_downloaded';

        function loadSettings() {
            try {
                var saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
                if (saved) { for (var k in saved) { if (CONFIG.hasOwnProperty(k)) CONFIG[k] = saved[k]; } }
            } catch(e) {}
        }
        function saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(CONFIG)); }
        loadSettings();

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
<div id="cnki-captcha" style="display:none">\u26a0 \u6d4f\u89c8\u5668\u53ef\u80fd\u5f39\u51fa\u9a8c\u8bc1\u7801\uff0c\u8bf7\u5728\u5f39\u51fa\u7684\u7a97\u53e3\u4e2d\u5b8c\u6210\u9a8c\u8bc1</div>\
<div id="cnki-mode-area">\
  <div style="font-weight:bold;margin-bottom:6px">\u4e0b\u8f7d\u6a21\u5f0f</div>\
  <label><input type="radio" name="cnki-mode" value="sequential" checked> \u987a\u5e8f\u4e0b\u8f7d</label>\
  <label><input type="radio" name="cnki-mode" value="selected"> \u52fe\u9009\u4e0b\u8f7d</label>\
</div>\
<div class="cnki-select-all-bar" id="cnki-select-bar">\
  <span>\u8bf7\u5728\u5de6\u4fa7\u5217\u8868\u4e2d\u52fe\u9009\u8981\u4e0b\u8f7d\u7684\u6587\u732e</span>\
</div>\
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
<button id="cnki-btn-start">\u5f00\u59cb\u6279\u91cf\u4e0b\u8f7d</button>\
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
                countdownBox.textContent = '\u4f11\u606f\u4e2d ' + m + ':' + sec.toString().padStart(2,'0') + ' \uff08\u70b9\u4e0b\u65b9\u8df3\u8fc7\uff09';
                await sleep(1000);
            }
            btnSkipRest.style.display = 'none';
            if (skipRest) log('\u5df2\u8df3\u8fc7\u4f11\u606f', '#1a73e8');
            countdownBox.textContent = '';
            countdownBox.style.cssText = 'margin:4px 0;color:#888;font-size:12px;min-height:18px';
        }

        // 每次重新获取表格（翻页后 DOM 会变）
        function getTableBody() {
            return document.querySelector('#gridTable table.result-table-list tbody');
        }

        // 从操作列中找到 PDF 下载链接
        function findPdfDownloadHref(operatCell) {
            var allLinks = operatCell.querySelectorAll('a');
            var pdfLink = null;
            var cajLink = null;

            for (var i = 0; i < allLinks.length; i++) {
                var a = allLinks[i];
                var href = a.href || '';
                var text = (a.textContent || '').trim();
                var cls = a.className || '';
                var onclick = a.getAttribute('onclick') || '';

                if (!href || href === '' || href === 'javascript:void(0);') continue;

                // 优先：明确的 PDF 链接
                if (cls.indexOf('pdf') >= 0 || text.indexOf('PDF') >= 0 ||
                    href.indexOf('pdfdown') >= 0 || href.indexOf('pdf') >= 0 ||
                    onclick.indexOf('pdf') >= 0 || onclick.indexOf('PDF') >= 0) {
                    pdfLink = href;
                    break;
                }

                // 记录通用下载链接作为备用
                if (cls.indexOf('downloadlink') >= 0 || cls.indexOf('download') >= 0) {
                    cajLink = href;
                }
            }

            // 如果找到明确的 PDF 链接直接用
            if (pdfLink) return pdfLink;

            // 否则尝试将 CAJ 链接转为 PDF
            if (cajLink) {
                // 方法1：替换 dflag 参数
                var url = cajLink.replace(/dflag=[^&]*/i, 'dflag=pdfdown');
                if (url !== cajLink) return url;

                // 方法2：替换 URL 路径中的 caj/CAJ
                url = cajLink.replace(/\/CAJDownload\//i, '/PDFDownload/');
                if (url !== cajLink) return url;

                // 方法3：追加 dflag 参数
                return cajLink + (cajLink.indexOf('?') >= 0 ? '&' : '?') + 'dflag=pdfdown';
            }

            return null;
        }

        // ── 从表格行中收集下载信息 ──
        function collectDownloadItems(mode) {
            var items = [];
            var tb = getTableBody();
            if (!tb) return items;
            var rows = tb.querySelectorAll('tr');
            rows.forEach(function(row) {
                if (mode === 'selected') {
                    var cb = row.querySelector('input[type="checkbox"]');
                    if (!cb || !cb.checked) return;
                }

                var titleLink = row.querySelector('td.name a.fz14') || row.querySelector('a.fz14');
                var title = titleLink ? titleLink.textContent.trim() : '';

                var operatCell = row.querySelector('td.operat');
                if (!operatCell) return;

                var dlHref = findPdfDownloadHref(operatCell);

                if (title && dlHref) {
                    items.push({ title: title, href: dlHref, row: row, titleLink: titleLink });
                }
            });
            return items;
        }

        function markDownloaded() {
            var tb = getTableBody();
            if (!tb) return;
            var rows = tb.querySelectorAll('tr');
            rows.forEach(function(row) {
                var titleLink = row.querySelector('td.name a.fz14') || row.querySelector('a.fz14');
                if (titleLink && isDownloaded(titleLink.textContent.trim())) {
                    titleLink.style.backgroundColor = '#d4edda';
                }
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
            // 创建隐藏的文件夹选择器
            var folderInput = document.createElement('input');
            folderInput.type = 'file';
            folderInput.setAttribute('webkitdirectory', '');
            folderInput.setAttribute('multiple', '');
            folderInput.style.display = 'none';
            document.body.appendChild(folderInput);

            folderInput.addEventListener('change', function() {
                var files = folderInput.files;
                if (!files || files.length === 0) {
                    folderInput.remove();
                    return;
                }
                var added = 0;
                for (var i = 0; i < files.length; i++) {
                    var name = files[i].name;
                    // 只识别 PDF 和 CAJ 文件
                    if (!/\.(pdf|caj)$/i.test(name)) continue;
                    var title = name.replace(/\.(pdf|caj)$/i, '').trim();
                    if (title && !isDownloaded(title)) {
                        saveDownloaded(title);
                        added++;
                    }
                }
                log('\u626b\u63cf\u6587\u4ef6\u5939\u5b8c\u6210\uff01\u65b0\u589e ' + added + ' \u6761\uff0c\u603b\u8ba1 ' + getDownloadedCount() + ' \u6761', '#8e24aa');
                markDownloaded();
                folderInput.remove();
            });

            folderInput.click();
        });

        document.getElementById('cnki-btn-clear').addEventListener('click', function() {
            if (confirm('\u786e\u5b9a\u6e05\u7a7a\u6240\u6709\u4e0b\u8f7d\u8bb0\u5f55\uff1f')) {
                localStorage.removeItem(STORAGE_KEY);
                log('\u5df2\u6e05\u7a7a', '#ea4335');
                var tb = getTableBody();
                if (!tb) return;
                var rows = tb.querySelectorAll('tr');
                rows.forEach(function(row) {
                    var t = row.querySelector('td.name a.fz14') || row.querySelector('a.fz14');
                    if (t) t.style.backgroundColor = '';
                });
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

        // ── 开始下载 ──
        btnStart.addEventListener('click', async function() {
            var items = collectDownloadItems(downloadMode);
            if (items.length === 0) {
                if (downloadMode === 'selected') {
                    log('\u8bf7\u5148\u52fe\u9009\u8981\u4e0b\u8f7d\u7684\u6587\u732e\uff01', '#ea4335');
                } else {
                    log('\u672a\u627e\u5230\u6709\u6548\u7684\u4e0b\u8f7d\u94fe\u63a5\uff01', '#ea4335');
                }
                return;
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
            log(modeLabel + '\u6a21\u5f0f\uff0c\u5171 ' + items.length + ' \u7bc7\uff0c\u7d2f\u8ba1\u5df2\u4e0b\u8f7d ' + getDownloadedCount(), '#1a73e8');
            log('\u8bf7\u786e\u4fdd\u6d4f\u89c8\u5668\u5141\u8bb8\u5f39\u51fa\u7a97\u53e3\uff01', '#e67e22');

            var success = 0, failed = 0, skipped = 0;

            for (var i = 0; i < items.length; i++) {
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

                var item = items[i];

                if (isDownloaded(item.title)) {
                    if (item.titleLink) item.titleLink.style.backgroundColor = '#d4edda';
                    skipped++; continue;
                }

                progressBox.textContent = '[' + (i+1) + '/' + items.length + '] ' + item.title.substring(0, 22) + '...';
                log('[' + (i+1) + '] ' + item.title, '#1a73e8');

                if (item.titleLink) {
                    item.titleLink.style.backgroundColor = '#fff3cd';
                    item.titleLink.scrollIntoView({behavior:'smooth', block:'center'});
                }

                // 直接打开下载链接（不操作子窗口 DOM）
                var newWin = window.open(item.href, '_blank');
                if (!newWin) {
                    log('\u5f39\u7a97\u88ab\u62e6\u622a\uff01\u8bf7\u5141\u8bb8\u5f39\u7a97\u540e\u91cd\u8bd5', '#ea4335');
                    captchaBox.style.display = 'block';
                    running = false; break;
                }

                // 记录为已下载
                if (item.titleLink) item.titleLink.style.backgroundColor = '#d4edda';
                saveDownloaded(item.title);
                success++;
                log('  \u2713 \u5df2\u89e6\u53d1\u4e0b\u8f7d [\u7d2f\u8ba1' + getDownloadedCount() + ']', '#0d904f');

                // 篇间等待（给浏览器处理下载的时间，也防反爬）
                if (i < items.length - 1 && running) {
                    var waitSec = 3 + Math.floor(Math.random() * 3);
                    for (var s = waitSec; s > 0; s--) {
                        if (!running) break;
                        await waitIfPaused();
                        countdownBox.textContent = s + '\u79d2\u540e\u4e0b\u4e00\u7bc7...';
                        await sleep(1000);
                    }
                    countdownBox.textContent = '';
                }
            }

            // ── 翻页（顺序模式自动翻，勾选模式如果本页有下载也翻到下一页继续） ──
            if (running) {
                var shouldTurnPage = downloadMode === 'sequential' || success > 0;
                if (shouldTurnPage) {
                    var nextBtn = document.querySelector('a#PageNext') || document.querySelector('a.next');
                    if (!nextBtn) {
                        document.querySelectorAll('a').forEach(function(a) {
                            if (!nextBtn && (a.textContent.trim() === '\u4e0b\u4e00\u9875' || a.textContent.trim() === '>'))
                                nextBtn = a;
                        });
                    }
                    if (nextBtn) {
                        log('\u672c\u9875\u5b8c\u6210\uff01' + success + '\u7bc7 \u7d2f\u8ba1' + getDownloadedCount(), '#0d904f');
                        log('\u7ffb\u9875\u7ee7\u7eed...', '#1a73e8');
                        await sleep(1000);
                        if (running) {
                            localStorage.setItem('cnki_auto_continue', 'true');
                            localStorage.setItem('cnki_dl_mode', downloadMode);
                            nextBtn.click(); return;
                        }
                    } else {
                        log('\u6ca1\u6709\u4e0b\u4e00\u9875\u4e86\uff0c\u5168\u90e8\u5b8c\u6210\uff01', '#0d904f');
                    }
                }
            }

            running = false; paused = false;
            btnStop.style.display = 'none'; btnPause.style.display = 'none'; btnStart.style.display = 'block';
            countdownBox.textContent = ''; captchaBox.style.display = 'none';

            var doneQuotes = [
                '\u5168\u90e8\u641e\u5b9a\u5566\uff5e\u7d2f\u6b7b\u6211\u4e86\uff0c\u8001\u677f\u52a0\u9e21\u817f\uff01\ud83c\udf57',
                '\u6d3b\u513f\u5e72\u5b8c\u4e86\uff01\u6211\u5148\u8e7a\u4e00\u4f1a\u513f\u2026\ud83d\ude34',
                '\u53ee\uff5e\u60a8\u7684\u6587\u732e\u5957\u9910\u5df2\u9001\u8fbe\uff0c\u597d\u8bc4\u8bb0\u5f97\u7ed9\u4e94\u661f\u54e6\uff01\u2b50',
                '\u5458\u5de5\u5df2\u7b4b\u75b2\u529b\u5c3d\uff0c\u8bf7\u6295\u5582\u5496\u5561\u2615\u540e\u518d\u8bd5',
                '\u77e5\u7f51\u5438\u661f\u5927\u6cd5\u5927\u529f\u544a\u6210\uff01\u53c8\u662f\u5145\u5b9e\u7684\u4e00\u5929\uff01\ud83c\udf1f',
                '\u4e0b\u8f7d\u5b8c\u6bd5\uff01\u6211\u5148\u53bb\u505a\u4e2aSPA\u653e\u677e\u4e00\u4e0b\u2026\ud83d\udec0',
                '\u53ee\u549a\uff01\u6587\u732e\u5df2\u5168\u90e8\u5230\u8d26\uff0c\u8bf7\u67e5\u6536\uff01\ud83d\udce6',
                '\u6211\u5df2\u7ecf\u5c3d\u529b\u4e86\uff0c\u5269\u4e0b\u7684\u4ea4\u7ed9\u4f60\u7684\u8111\u5b50\u5566\uff01\ud83e\udde0'
            ];
            var quote = doneQuotes[Math.floor(Math.random() * doneQuotes.length)];
            progressBox.textContent = quote;
            log('\u2705 \u5168\u90e8\u5b8c\u6210\uff01\u4e0b\u8f7d' + success + '\u7bc7 \u8df3\u8fc7' + skipped + ' \u5931\u8d25' + failed + ' \u7d2f\u8ba1' + getDownloadedCount(), '#0d904f');
            log(quote, '#8e24aa');
        });

        // 尝试自动将每页显示数量调到50
        try {
            var pageSizeEl = document.querySelector('#perPageDiv .sort-default span, .countPageMark');
            var curSize = pageSizeEl ? parseInt(pageSizeEl.textContent) : 0;
            if (curSize && curSize < 50) {
                var perPageDiv = document.querySelector('#perPageDiv, .countPageDiv');
                if (perPageDiv) {
                    // 先触发展开下拉
                    var trigger = perPageDiv.querySelector('.sort-default') || perPageDiv;
                    if (trigger) trigger.click();
                    setTimeout(function() {
                        var opts = perPageDiv.querySelectorAll('li a, ul a');
                        opts.forEach(function(opt) {
                            if (opt.textContent.trim() === '50') {
                                log('\u81ea\u52a8\u5207\u6362\u6bcf\u987550\u7bc7', '#5c6bc0');
                                opt.click();
                            }
                        });
                    }, 300);
                }
            }
        } catch(e) {}

        markDownloaded();
        var initCount = 0;
        var tb = getTableBody();
        if (tb) {
            tb.querySelectorAll('tr').forEach(function(row) {
                var t = row.querySelector('td.name a.fz14') || row.querySelector('a.fz14');
                if (t && isDownloaded(t.textContent.trim())) initCount++;
            });
        }
        log('v8 \u5df2\u52a0\u8f7d\uff0c\u7d2f\u8ba1 ' + getDownloadedCount() + ' \u7bc7', '#0d904f');
        if (initCount > 0) log('\u672c\u9875 ' + initCount + ' \u7bc7\u5df2\u4e0b\u8f7d\uff08\u7eff\u8272\uff09', '#0d904f');

        if (localStorage.getItem('cnki_auto_continue') === 'true') {
            localStorage.removeItem('cnki_auto_continue');
            var savedMode = localStorage.getItem('cnki_dl_mode');
            if (savedMode) {
                downloadMode = savedMode;
                localStorage.removeItem('cnki_dl_mode');
                var radio = document.querySelector('input[name="cnki-mode"][value="' + savedMode + '"]');
                if (radio) radio.checked = true;
                if (savedMode === 'selected') selectBar.style.display = 'flex';
            }
            log('\u7ffb\u9875\u540e\u81ea\u52a8\u7ee7\u7eed...', '#1a73e8');
            setTimeout(function(){ btnStart.click(); }, 2000);
        }
    }
})();
