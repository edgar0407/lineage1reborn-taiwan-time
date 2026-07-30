// ==UserScript==
// @name         Lineage 1 Reborn - Taiwan Time
// @namespace    https://github.com/edgar0407/lineage1reborn-taiwan-time
// @version      1.1.0
// @description  Convert Lineage 1 Reborn Eastern Time displays to Taiwan time.
// @author       edgar0407
// @license      MIT
// @match        https://lineage1reborn.com/*
// @match        https://www.lineage1reborn.com/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/edgar0407/lineage1reborn-taiwan-time/main/lineage1reborn-taiwan-time.user.js
// @downloadURL  https://raw.githubusercontent.com/edgar0407/lineage1reborn-taiwan-time/main/lineage1reborn-taiwan-time.user.js
// ==/UserScript==

(function () {
    'use strict';

    if (window.__l1rTaiwanTimeInjected) return;
    window.__l1rTaiwanTimeInjected = true;

    var SOURCE_ZONE = 'America/New_York';

    var MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    var MONTH_INDEX = {};
    MONTHS.forEach(function (m, i) { MONTH_INDEX[m] = i + 1; });

    // --- Timezone math (wall-clock <-> absolute instant), per docs/SPEC.md section 10 ---

    function partsAt(date, zone) {
        var values = {};
        var formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: zone,
            hourCycle: 'h23',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        formatter.formatToParts(date).forEach(function (part) {
            if (part.type !== 'literal') {
                values[part.type] = Number(part.value);
            }
        });

        return values;
    }

    function zonedDate(year, month, day, hour, minute, second, zone) {
        var desired = Date.UTC(year, month - 1, day, hour, minute, second);
        var guess = desired;

        for (var i = 0; i < 4; i += 1) {
            var parts = partsAt(new Date(guess), zone);
            var represented = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
            var adjustment = desired - represented;
            guess += adjustment;
            if (adjustment === 0) break;
        }

        return new Date(guess);
    }

    function inferYear(month, day, now) {
        var refYear = partsAt(now, SOURCE_ZONE).year;
        var candidates = [refYear - 1, refYear, refYear + 1];
        var best = refYear;
        var bestDiff = Infinity;

        candidates.forEach(function (year) {
            var attempt = zonedDate(year, month, day, 12, 0, 0, SOURCE_ZONE);
            var diff = Math.abs(attempt.getTime() - now.getTime());
            if (diff < bestDiff) {
                bestDiff = diff;
                best = year;
            }
        });

        return best;
    }

    // --- Badge rendering for converted TW values ---

    var BADGE_STYLE = 'display:inline-block;background-color:#16a34a;color:#fff;' +
        'padding:0 6px;border-radius:4px;font-weight:600;white-space:nowrap;';

    function makeBadge(text) {
        var span = document.createElement('span');
        span.className = 'l1r-tw-badge';
        span.style.cssText = BADGE_STYLE;
        span.textContent = text;
        return span;
    }

    // --- Taiwan-side formatters (each mirrors the source string's own layout) ---

    function formatClockTaiwan(date) {
        var formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Taipei',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        var parts = {};
        formatter.formatToParts(date).forEach(function (p) { parts[p.type] = p.value; });
        return parts.hour + ':' + parts.minute + ':' + parts.second + ' ' + parts.dayPeriod + ' TW';
    }

    function taiwanDayMonth(date) {
        var day = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Taipei', day: 'numeric' }).format(date);
        var month = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Taipei', month: 'short' }).format(date);
        return { day: day, month: month };
    }

    function taiwanTime24(date) {
        return new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Taipei',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23'
        }).format(date);
    }

    function formatSiegeTaiwan(date) {
        var dm = taiwanDayMonth(date);
        return { day: dm.day, month: dm.month, time: taiwanTime24(date) };
    }

    function formatEventEndsTaiwan(date) {
        var dm = taiwanDayMonth(date);
        return dm.month + ' ' + dm.day + ', ' + taiwanTime24(date) + ' TW';
    }

    // --- Handler 1: live "Time Now" clock ([data-home-edt-clock]) ---
    // The site rewrites this element's text every second. We intercept each
    // rewrite via MutationObserver (disconnect -> write -> reconnect) so we
    // never trigger ourselves and never race the site's own timer.

    function bindClock() {
        var clockEl = document.querySelector('[data-home-edt-clock]');
        if (!clockEl || clockEl.dataset.l1rBound === '1') return;
        clockEl.dataset.l1rBound = '1';
        clockEl.title = 'Source: America/New_York (ET)';

        var obs = new MutationObserver(convert);

        function convert() {
            var text = formatClockTaiwan(new Date());
            obs.disconnect();
            clockEl.textContent = '';
            clockEl.appendChild(makeBadge(text));
            obs.observe(clockEl, { childList: true, characterData: true, subtree: true });
        }

        convert();
    }

    // --- Handler 2: event countdown "Ends ..." line, next to .home-event-countdown[data-target] ---
    // data-target is a Unix-seconds timestamp for the exact same instant, so we
    // convert it directly instead of re-parsing the printed ET string.

    function convertEventEnds() {
        var countdownEl = document.querySelector('.home-event-countdown[data-target]');
        if (!countdownEl) return;

        var timeRow = countdownEl.parentElement;
        var container = timeRow ? timeRow.parentElement : null;
        if (!container) return;

        var endsEl = null;
        for (var i = 0; i < container.children.length; i += 1) {
            var el = container.children[i];
            if (el === timeRow) continue;
            if (el.dataset && el.dataset.l1rProcessed === '1') continue;
            if (el.children.length > 0) continue;
            if (/\bET\b/.test(el.textContent)) {
                endsEl = el;
                break;
            }
        }
        if (!endsEl) return;

        var targetSeconds = parseInt(countdownEl.dataset.target, 10);
        if (!targetSeconds || Number.isNaN(targetSeconds)) return;

        var date = new Date(targetSeconds * 1000);
        var original = endsEl.textContent.trim();
        var prefixMatch = /^(\S+)\s+/.exec(original);
        var prefix = prefixMatch ? prefixMatch[1] : '';

        endsEl.textContent = '';
        if (prefix) endsEl.appendChild(document.createTextNode(prefix + ' '));
        endsEl.appendChild(makeBadge(formatEventEndsTaiwan(date)));
        endsEl.title = 'Original: ' + original;
        endsEl.dataset.l1rOriginalTime = original;
        endsEl.dataset.l1rProcessed = '1';
    }

    // --- Handler 3: siege schedule entries, e.g. "1 Aug" + "10 AM ET" in adjacent leaf elements ---
    // No stable selector exists for these, so we fall back to the "minimal
    // matching container" text-pattern strategy from docs/SPEC.md section 6.

    var DATE_LEAF_RE = /^(\d{1,2})\s+([A-Za-z]{3,})$/;
    var TIME_LEAF_RE = /^(\d{1,2})(?::([0-5]\d))?\s*(AM|PM)\s*ET$/i;

    function isLeaf(el) {
        return el && el.nodeType === 1 && el.children.length === 0 && el.textContent.trim().length > 0;
    }

    function convertSiegeEntries() {
        var candidates = document.body.querySelectorAll('span, div, p, td, li');

        for (var i = 0; i < candidates.length; i += 1) {
            var el = candidates[i];
            if (!isLeaf(el) || el.dataset.l1rProcessed === '1') continue;

            var text = el.textContent.trim();
            var dateMatch = DATE_LEAF_RE.exec(text);
            if (!dateMatch) continue;

            var monthKey = dateMatch[2].slice(0, 3).toLowerCase();
            if (!(monthKey in MONTH_INDEX)) continue;

            var timeEl = el.nextElementSibling;
            if (!isLeaf(timeEl) || timeEl.dataset.l1rProcessed === '1') continue;

            var timeMatch = TIME_LEAF_RE.exec(timeEl.textContent.trim());
            if (!timeMatch) continue;

            var day = Number(dateMatch[1]);
            var month = MONTH_INDEX[monthKey];
            var hour = Number(timeMatch[1]) % 12;
            if (/pm/i.test(timeMatch[3])) hour += 12;
            var minute = timeMatch[2] ? Number(timeMatch[2]) : 0;

            var now = new Date();
            var year = inferYear(month, day, now);
            var sourceDate = zonedDate(year, month, day, hour, minute, 0, SOURCE_ZONE);
            var tw = formatSiegeTaiwan(sourceDate);

            var originalCombined = text + ' ' + timeEl.textContent.trim();
            var titleText = 'Original: ' + originalCombined;

            el.textContent = tw.day + ' ' + tw.month;
            timeEl.textContent = '';
            timeEl.appendChild(makeBadge(tw.time + ' TW'));
            el.title = titleText;
            timeEl.title = titleText;
            el.dataset.l1rProcessed = '1';
            timeEl.dataset.l1rProcessed = '1';

            if (el.parentElement === timeEl.parentElement) {
                el.parentElement.dataset.l1rOriginalTime = originalCombined;
            }
        }
    }

    // --- Bootstrap + re-scan on dynamic re-render ---

    function runScan() {
        try { bindClock(); } catch (e) { console.error('[L1R-TW]', e); }
        try { convertEventEnds(); } catch (e) { console.error('[L1R-TW]', e); }
        try { convertSiegeEntries(); } catch (e) { console.error('[L1R-TW]', e); }
    }

    runScan();

    var scanQueued = false;
    var bodyObserver = new MutationObserver(function (mutations) {
        var isNoise = mutations.every(function (m) {
            var node = m.target.nodeType === 3 ? m.target.parentElement : m.target;
            return node && node.closest && (node.closest('[data-home-edt-clock]') || node.closest('.home-event-countdown'));
        });
        if (isNoise || scanQueued) return;

        scanQueued = true;
        setTimeout(function () {
            scanQueued = false;
            runScan();
        }, 500);
    });

    bodyObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
})();
