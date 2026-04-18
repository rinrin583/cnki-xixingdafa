// ==UserScript==
// @name         知网吸星大法 - CNKI全自动下载
// @namespace    https://cnki.net/
// @version      5.0
// @description  知网全自动批量下载PDF - 自动打开/下载/关闭，断点续传，验证码暂停，防反爬
// @match        *://*.cnki.net/*
// @match        *://*cnki*.*/*
// @match        *://*.atrust.seu.edu.cn/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 延迟执行，确保页面完全加载
    setTimeout(init, 3000);

    function init() {
        var isSearchPage = !!(
            document.querySelector('table.result-table-list') ||
            document.querySelector('.result-table-list') ||
            document.querySelector('#gridTable')
        );

        if (!isSearchPage) return;

        // ── 配置 ──
        var CONFIG = {
            delayMin: 3,
            delayMax: 8,
            restEvery: 20,
            restMin: 15,
            restMax: 30,
            maxPerSession: 100,
            pageLoadWait: 4000,
            downloadWait: 3000,
            autoNextPage: true
        };

        // ── 用 style 标签注入 CSS ──
        var style = document.createElement('style');
        style.textContent = '\
#cnki-panel{position:fixed;bottom:20px;right:20px;z-index:99999;background:#fff;border:2px solid #1a73e8;border-radius:12px;padding:16px;width:320px;box-shadow:0 4px 20px rgba(0,0,0,0.15);font-family:Microsoft YaHei,sans-serif;font-size:14px;cursor:move}\
#cnki-panel h3{margin:0 0 10px;color:#1a73e8;font-size:15px;border-bottom:1px solid #e0e0e0;padding-bottom:8px}\
#cnki-panel button{display:block;width:100%;padding:10px;margin:5px 0;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold}\
#cnki-btn-start{background:#1a73e8;color:#fff}\
#cnki-btn-stop{background:#ea4335;color:#fff}\
#cnki-btn-pause{background:#fb8c00;color:#fff}\
#cnki-btn-min{background:#f1f3f4;color:#333}\
#cnki-log{max-height:200px;overflow-y:auto;background:#f8f9fa;border-radius:6px;padding:8px;margin-top:8px;font-size:12px;line-height:1.5}\
#cnki-progress{margin:6px 0;font-weight:bold;color:#333}\
#cnki-countdown{margin:4px 0;color:#888;font-size:12px;min-height:18px}\
#cnki-captcha{display:none;background:#fff3cd;border:2px solid #ffc107;border-radius:8px;padding:10px;margin:8px 0;text-align:center;font-weight:bold;color:#856404;animation:cnkipulse 1.5s infinite}\
@keyframes cnkipulse{0%,100%{opacity:1}50%{opacity:0.6}}\
#cnki-mode{background:#e8f5e9;border-radius:6px;padding:8px;margin:6px 0;font-size:12px;color:#2e7d32}\
';
        document.head.appendChild(style);

        // ── 创建面板 ──
        var panel = document.createElement('div');
        panel.id = 'cnki-panel';
        panel.innerHTML = '\
<h3>\u{1F31F} 知网吸星大法 v5 \u{1F525}</h3>\
<div id="cnki-mode">全自动：打开文献 → 下载PDF → 关闭 → 下一篇<br>验证码自动暂停，手动完成后继续</div>\
<div id="cnki-progress">就绪</div>\
<div id="cnki-countdown"></div>\
<div id="cnki-captcha" style="display:none">检测到验证码！请完成验证后自动继续</div>\
<div style="margin:6px 0;font-size:13px">从第 <input id="cnki-start-num" type="number" min="1" value="1" style="width:50px;padding:2px 4px;border:1px solid #ccc;border-radius:4px;text-align:center"> 篇开始</div>\
<button id="cnki-btn-start">开始全自动下载</button>\
<button id="cnki-btn-pause" style="display:none">暂停</button>\
<button id="cnki-btn-stop" style="display:none">终止</button>\
<button id="cnki-btn-import" style="background:#8e24aa;color:#fff">导入已下载记录</button>\
<button id="cnki-btn-clear" style="background:#757575;color:#fff;font-size:12px">清空下载记录</button>\
<button id="cnki-btn-min">最小化</button>\
<div id="cnki-log"></div>\
';
        document.body.appendChild(panel);

        // 面板拖动
        var isDragging = false, dragX = 0, dragY = 0;
        panel.addEventListener('mousedown', function(e) {
            if (e.target.tagName === 'BUTTON') return;
            isDragging = true;
            dragX = e.clientX - panel.getBoundingClientRect().left;
            dragY = e.clientY - panel.getBoundingClientRect().top;
        });
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            panel.style.left = (e.clientX - dragX) + 'px';
            panel.style.top = (e.clientY - dragY) + 'px';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
        });
        document.addEventListener('mouseup', function() { isDragging = false; });

        var btnImport = document.getElementById('cnki-btn-import');
        var btnClear = document.getElementById('cnki-btn-clear');
        var logBox = document.getElementById('cnki-log');
        var progressBox = document.getElementById('cnki-progress');
        var countdownBox = document.getElementById('cnki-countdown');
        var captchaBox = document.getElementById('cnki-captcha');
        var btnStart = document.getElementById('cnki-btn-start');
        var btnPause = document.getElementById('cnki-btn-pause');
        var btnStop = document.getElementById('cnki-btn-stop');
        var btnMin = document.getElementById('cnki-btn-min');

        var running = false;
        var paused = false;

        // ── 已下载记录（存localStorage，刷新不丢）──
        var STORAGE_KEY = 'cnki_downloaded';
        function getDownloaded() {
            try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e) { return []; }
        }
        function saveDownloaded(title) {
            var list = getDownloaded();
            if (list.indexOf(title) === -1) { list.push(title); }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        }
        function isDownloaded(title) {
            return getDownloaded().indexOf(title) !== -1;
        }
        function getDownloadedCount() { return getDownloaded().length; }

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

        // ── 模拟人类行为 ──
        function humanScroll() {
            var pos = [0, 0.15, 0.3, 0.5, 0.7, 0.2, 0.4];
            var p = pos[Math.floor(Math.random() * pos.length)];
            window.scrollTo({ top: document.body.scrollHeight * p + (Math.random()-0.5)*150, behavior:'smooth' });
        }

        function simulateMouseMove() {
            document.dispatchEvent(new MouseEvent('mousemove', {
                clientX: Math.floor(Math.random()*window.innerWidth),
                clientY: Math.floor(Math.random()*window.innerHeight),
                bubbles: true
            }));
        }

        async function simulateBrowsing(seconds) {
            var actions = Math.floor(seconds / 10);
            for (var i = 0; i < actions; i++) {
                if (!running) return;
                if (Math.random() < 0.4) humanScroll();
                else if (Math.random() < 0.6) simulateMouseMove();
                await sleep(Math.random()*8000 + 5000);
            }
        }

        // ── 验证码检测 ──
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
            // 检查是否有大面积遮罩弹窗（真正的验证码弹窗通常会覆盖大部分页面）
            var modals = document.querySelectorAll('.mask_layer, .pop_box');
            for (var i = 0; i < modals.length; i++) {
                try {
                    var s = window.getComputedStyle(modals[i]);
                    if (s.display !== 'none' && s.visibility !== 'hidden' && modals[i].offsetHeight > 200) return true;
                } catch(e){}
            }
            return false;
        }

        async function waitForCaptcha() {
            if (!detectCaptcha()) return;
            captchaBox.style.display = 'block';
            log('检测到验证码，已暂停', '#e67e22');
            while (detectCaptcha() && running) await sleep(1000);
            if (running) {
                captchaBox.style.display = 'none';
                log('验证通过，15秒后继续', '#0d904f');
                await sleep(15000);
            }
        }

        // ── 等待暂停恢复 ──
        async function waitIfPaused() {
            while (paused && running) {
                countdownBox.textContent = '已暂停，点击"继续"恢复';
                await sleep(500);
            }
        }

        // ── 倒计时延迟 ──
        async function smartDelay(isRest) {
            var totalSec;
            if (isRest) {
                totalSec = Math.floor(Math.random()*(CONFIG.restMax-CONFIG.restMin)) + CONFIG.restMin;
                log('休息 ' + Math.ceil(totalSec/60) + ' 分钟...', '#e67e22');
            } else {
                totalSec = Math.floor(Math.random()*(CONFIG.delayMax-CONFIG.delayMin)) + CONFIG.delayMin;
            }
            simulateBrowsing(totalSec);
            for (var s = totalSec; s > 0; s--) {
                if (!running) return;
                await waitIfPaused();
                var m = Math.floor(s/60), sec = s%60;
                countdownBox.textContent = isRest
                    ? '休息中 ' + m + ':' + sec.toString().padStart(2,'0') + ' (防检测)'
                    : s + '秒后下一篇...';
                await sleep(1000);
                await waitForCaptcha();
            }
            countdownBox.textContent = '';
        }

        function getArticles() {
            var arts = document.querySelectorAll('table.result-table-list tbody tr td.name a.fz14');
            if (arts.length === 0) arts = document.querySelectorAll('a.fz14');
            return arts;
        }

        // ── 新窗口自动下载 ──
        async function autoDownload(newWin) {
            var loaded = false;
            for (var i = 0; i < 30; i++) {
                await sleep(1000);
                try {
                    if (newWin.document && newWin.document.readyState === 'complete') { loaded = true; break; }
                } catch(e){}
            }
            if (!loaded) await sleep(5000);
            await sleep(CONFIG.pageLoadWait);

            try {
                var doc = newWin.document;

                // 自动IP登录
                var btns = doc.querySelectorAll('a, button');
                for (var i = 0; i < btns.length; i++) {
                    var txt = btns[i].textContent || '';
                    if (txt.indexOf('IP') >= 0 && txt.indexOf('登录') >= 0) {
                        log('  自动点击IP登录', '#1a73e8');
                        btns[i].click();
                        await sleep(5000);
                        break;
                    }
                }

                // 找PDF按钮
                var pdfBtn = doc.querySelector('#pdfDown') || doc.querySelector('a#pdfDown')
                    || doc.querySelector('.btn-dlpdf');
                if (!pdfBtn) {
                    var links = doc.querySelectorAll('a');
                    for (var i = 0; i < links.length; i++) {
                        if (links[i].textContent.indexOf('PDF') >= 0 && links[i].textContent.indexOf('下载') >= 0) {
                            pdfBtn = links[i]; break;
                        }
                    }
                    if (!pdfBtn) {
                        for (var i = 0; i < links.length; i++) {
                            if (links[i].textContent.indexOf('PDF') >= 0) { pdfBtn = links[i]; break; }
                        }
                    }
                }

                if (pdfBtn) {
                    pdfBtn.dispatchEvent(new MouseEvent('mouseenter', {bubbles:true}));
                    await sleep(800 + Math.random()*1200);
                    log('  找到PDF，自动下载', '#0d904f');
                    pdfBtn.click();
                    await sleep(CONFIG.downloadWait);
                    return 'pdf';
                }

                // 尝试CAJ
                var cajBtn = doc.querySelector('#cajDown') || doc.querySelector('a#cajDown');
                if (!cajBtn) {
                    var links = doc.querySelectorAll('a');
                    for (var i = 0; i < links.length; i++) {
                        if (links[i].textContent.indexOf('CAJ') >= 0) { cajBtn = links[i]; break; }
                    }
                }
                if (cajBtn) {
                    log('  用CAJ下载', '#e67e22');
                    cajBtn.click();
                    await sleep(CONFIG.downloadWait);
                    return 'caj';
                }

                log('  未找到下载按钮', '#ea4335');
                return 'none';
            } catch(e) {
                log('  无法操作页面: ' + e.message, '#ea4335');
                return 'error';
            }
        }

        // ── 最小化 ──
        btnMin.addEventListener('click', function() {
            panel.style.display = 'none';
            var mb = document.createElement('button');
            mb.style.cssText = 'position:fixed;top:80px;right:20px;z-index:99999;background:#1a73e8;color:#fff;border:none;border-radius:50%;width:50px;height:50px;font-size:24px;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,0.3)';
            mb.textContent = '\u25BC';
            mb.title = '展开CNKI下载助手';
            mb.addEventListener('click', function(){ panel.style.display='block'; mb.remove(); });
            document.body.appendChild(mb);
        });

        // ── 导入已下载记录 ──
        btnImport.addEventListener('click', function() {
            var input = prompt(
                '请粘贴已下载的PDF文件名（每行一个，不需要.pdf后缀）\n\n' +
                '或者运行 python scan_downloaded.py 自动扫描生成\n\n' +
                '也可以直接输入文件名，用英文逗号分隔：'
            );
            if (!input) return;
            var titles = input.split(/[\n,]/).map(function(t) {
                return t.trim().replace(/\.pdf$/i, '');
            }).filter(function(t) { return t.length > 0; });
            var added = 0;
            titles.forEach(function(t) {
                if (!isDownloaded(t)) { saveDownloaded(t); added++; }
            });
            log('导入完成！新增 ' + added + ' 条，总计 ' + getDownloadedCount() + ' 条', '#8e24aa');
            // 重新标绿
            var arts = getArticles();
            for (var i = 0; i < arts.length; i++) {
                if (isDownloaded(arts[i].textContent.trim())) {
                    arts[i].style.backgroundColor = '#d4edda';
                }
            }
        });

        // ── 清空下载记录 ──
        btnClear.addEventListener('click', function() {
            if (confirm('确定清空所有下载记录吗？（不会删除已下载的文件）')) {
                localStorage.removeItem(STORAGE_KEY);
                log('已清空下载记录', '#ea4335');
                var arts = getArticles();
                for (var i = 0; i < arts.length; i++) {
                    arts[i].style.backgroundColor = '';
                }
            }
        });

        // ── 暂停/继续 ──
        btnPause.addEventListener('click', function() {
            if (paused) {
                paused = false;
                btnPause.textContent = '暂停';
                btnPause.style.background = '#fb8c00';
                log('已恢复', '#0d904f');
            } else {
                paused = true;
                btnPause.textContent = '继续';
                btnPause.style.background = '#0d904f';
                log('已暂停', '#e67e22');
            }
        });

        // ── 终止 ──
        btnStop.addEventListener('click', function() {
            running = false;
            paused = false;
            btnStop.style.display = 'none';
            btnPause.style.display = 'none';
            btnStart.style.display = 'block';
            captchaBox.style.display = 'none';
            countdownBox.textContent = '';
            log('已终止', '#ea4335');
            progressBox.textContent = '已终止';
        });

        // ── 开始 ──
        btnStart.addEventListener('click', async function() {
            var articles = getArticles();
            if (articles.length === 0) {
                log('未找到文献列表！', '#ea4335');
                return;
            }

            running = true;
            paused = false;
            btnStart.style.display = 'none';
            btnPause.style.display = 'block';
            btnStop.style.display = 'block';
            logBox.innerHTML = '';

            log('找到 ' + articles.length + ' 篇，累计已下载 ' + getDownloadedCount() + ' 篇', '#1a73e8');

            var success = 0, failed = 0, skipped = 0;

            for (var i = 0; i < articles.length; i++) {
                if (!running) break;
                await waitIfPaused();
                await waitForCaptcha();
                if (!running) break;

                if (success >= CONFIG.maxPerSession) {
                    log('达到' + success + '篇上限，建议稍后继续', '#e67e22');
                    break;
                }

                if (success > 0 && success % CONFIG.restEvery === 0) {
                    log('已下载' + success + '篇，休息...', '#e67e22');
                    await smartDelay(true);
                    if (!running) break;
                }

                var article = articles[i];
                var title = article.textContent.trim();
                var href = article.href;

                // 自动跳过已下载的
                if (isDownloaded(title)) {
                    article.style.backgroundColor = '#d4edda';
                    skipped++;
                    continue;
                }

                progressBox.textContent = '[' + (i+1) + '/' + articles.length + '] ' + title.substring(0,22) + '...';
                log('[' + (i+1) + '] ' + title, '#1a73e8');

                if (!href) { log('  跳过(无链接)', '#ea4335'); failed++; continue; }

                article.style.backgroundColor = '#fff3cd';
                article.scrollIntoView({behavior:'smooth', block:'center'});
                await sleep(1000 + Math.random()*1000);

                article.dispatchEvent(new MouseEvent('mouseenter', {bubbles:true}));
                await sleep(300 + Math.random()*500);

                var newWin = window.open(href, '_blank');
                if (!newWin) {
                    log('弹窗被拦截！请允许弹窗后刷新重试', '#ea4335');
                    running = false;
                    break;
                }

                var result = await autoDownload(newWin);

                if (result === 'pdf' || result === 'caj') {
                    await sleep(3000 + Math.random()*2000);
                }

                try { newWin.close(); } catch(e){}
                await sleep(1000);

                if (result === 'pdf' || result === 'caj') {
                    article.style.backgroundColor = '#d4edda';
                    saveDownloaded(title);
                    success++;
                    log('  完成(' + result.toUpperCase() + ') [累计' + getDownloadedCount() + '篇]', '#0d904f');
                } else {
                    article.style.backgroundColor = '#f8d7da';
                    failed++;
                }

                if (i < articles.length - 1 && running) {
                    await smartDelay(false);
                }
            }

            // ── 自动翻页 ──
            if (running && CONFIG.autoNextPage) {
                var nextBtn = document.querySelector('a#PageNext') ||
                    document.querySelector('a.next') ||
                    document.querySelector('a[id="PageNext"]');
                if (!nextBtn) {
                    var allAs = document.querySelectorAll('a');
                    for (var n = 0; n < allAs.length; n++) {
                        if (allAs[n].textContent.trim() === '下一页' || allAs[n].textContent.trim() === '>') {
                            nextBtn = allAs[n]; break;
                        }
                    }
                }
                if (nextBtn) {
                    log('本页完成！本次:' + success + ' 跳过:' + skipped + ' 累计:' + getDownloadedCount(), '#0d904f');
                    log('10秒后自动翻到下一页...', '#1a73e8');
                    countdownBox.textContent = '即将翻页...';
                    await sleep(10000);
                    if (running) {
                        localStorage.setItem('cnki_auto_continue', 'true');
                        nextBtn.click();
                        return;
                    }
                } else {
                    log('没有下一页了，全部完成！', '#0d904f');
                }
            }

            running = false;
            paused = false;
            btnStop.style.display = 'none';
            btnPause.style.display = 'none';
            btnStart.style.display = 'block';
            countdownBox.textContent = '';
            captchaBox.style.display = 'none';
            progressBox.textContent = '完成！本次' + success + '篇 跳过' + skipped + '篇 失败' + failed + '篇';
            log('完成！本次:' + success + ' 跳过:' + skipped + ' 失败:' + failed + ' 累计:' + getDownloadedCount(), '#0d904f');
        });

        // 后台监测验证码
        setInterval(function(){
            if (detectCaptcha() && running) captchaBox.style.display = 'block';
        }, 2000);

        // 页面加载时标绿已下载的文献
        var initArts = getArticles();
        var initSkip = 0;
        for (var k = 0; k < initArts.length; k++) {
            if (isDownloaded(initArts[k].textContent.trim())) {
                initArts[k].style.backgroundColor = '#d4edda';
                initSkip++;
            }
        }

        log('v5 已加载，累计已下载 ' + getDownloadedCount() + ' 篇', '#0d904f');
        if (initSkip > 0) log('本页有 ' + initSkip + ' 篇已下载（绿色标记）', '#0d904f');

        // 翻页后自动继续
        if (localStorage.getItem('cnki_auto_continue') === 'true') {
            localStorage.removeItem('cnki_auto_continue');
            log('翻页后自动继续下载...', '#1a73e8');
            setTimeout(function(){ btnStart.click(); }, 3000);
        }
    }
})();
