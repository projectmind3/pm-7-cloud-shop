(function () {
  'use strict';

  var KEY = 'shop.video.rows';
  var P = 'shopvid-';

  var SAMPLE = [
    { s: 0, e: 3, zh: '大家好，今天给大家介绍一款保暖袜套。', ja: 'みなさん、こんにちは。本日は暖かいレッグウォーマーをご紹介します。' },
    { s: 3, e: 6, zh: '采用柔软舒适的棉质面料，保暖又透气。', ja: '柔らかく快適なコットン素材で、暖かく通気性も抜群です。' },
    { s: 6, e: 9, zh: '松紧适中，不勒腿，一年四季都可以穿。', ja: 'ゆったりフィットで締め付けず、一年中お使いいただけます。' },
    { s: 9, e: 12, zh: '颜色多样，搭配靴子特别好看。', ja: 'カラーバリエーション豊富で、ブーツとの相性も抜群です。' },
    { s: 12, e: 15, zh: '现在下单还可以包邮，欢迎选购。', ja: '今ご注文いただくと送料無料です。ぜひご利用ください。' }
  ];

  // 演示级词典（长词优先匹配）
  var DICT = [
    ['大家好', 'みなさん、こんにちは'], ['今天', '本日は'], ['给大家介绍', 'ご紹介します'], ['介绍', 'ご紹介'],
    ['一款', '一つの'], ['保暖袜套', '暖かいレッグウォーマー'], ['袜套', 'レッグウォーマー'], ['袜子', '靴下'],
    ['保暖', '保温性'], ['透气', '通気性'], ['柔软', '柔らかい'], ['舒适', '快適'], ['棉质', 'コットン'],
    ['面料', '素材'], ['松紧适中', 'ちょうどよいフィット感'], ['不勒腿', '締め付けません'], ['一年四季', '一年中'],
    ['都可以穿', 'お使いいただけます'], ['颜色多样', 'カラーバリエーション豊富'], ['搭配', 'コーディネート'],
    ['靴子', 'ブーツ'], ['好看', 'おしゃれ'], ['特别', 'とても'], ['现在', '今'], ['下单', 'ご注文'],
    ['包邮', '送料無料'], ['欢迎选购', 'ぜひご利用ください'], ['谢谢', 'ありがとうございます'],
    ['价格', '価格'], ['优惠', 'お得'], ['尺寸', 'サイズ'], ['材质', '素材'], ['发货', '発送'],
    ['又', 'かつ'], ['和', 'と'], ['，', '、'], ['。', '。'], ['！', '！']
  ];
  DICT.sort(function (a, b) { return b[0].length - a[0].length; });

  function translate(zh) {
    var out = '', i = 0, hit = false, miss = false;
    zh = String(zh || '');
    while (i < zh.length) {
      var found = null;
      for (var k = 0; k < DICT.length; k++) {
        if (zh.substr(i, DICT[k][0].length) === DICT[k][0]) { found = DICT[k]; break; }
      }
      if (found) { out += found[1]; i += found[0].length; hit = true; }
      else {
        var ch = zh.charAt(i);
        if (/[一-鿿]/.test(ch)) miss = true;
        out += ch; i++;
      }
    }
    if (!zh.trim()) return '';
    return (hit && !miss) ? out : (hit ? out + '（要確認）' : '【未対応】' + zh);
  }

  function load() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY));
      if (Array.isArray(v)) return v;
    } catch (e) {}
    return [];
  }
  function save(rows) {
    try { localStorage.setItem(KEY, JSON.stringify(rows)); } catch (e) {}
  }

  function pad(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }
  function srtTime(sec) {
    var ms = Math.round(Math.max(0, sec) * 1000);
    var h = Math.floor(ms / 3600000); ms -= h * 3600000;
    var m = Math.floor(ms / 60000); ms -= m * 60000;
    var s = Math.floor(ms / 1000); ms -= s * 1000;
    return pad(h, 2) + ':' + pad(m, 2) + ':' + pad(s, 2) + ',' + pad(ms, 3);
  }
  function num(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }

  function buildSrt(rows) {
    var list = rows.filter(function (r) { return String(r.ja || '').trim(); });
    return list.map(function (r, i) {
      return (i + 1) + '\n' + srtTime(r.s) + ' --> ' + srtTime(r.e) + '\n' + String(r.ja).trim() + '\n';
    }).join('\n');
  }

  function injectStyle() {
    if (document.getElementById(P + 'style')) return;
    var st = document.createElement('style');
    st.id = P + 'style';
    st.textContent =
      '.' + P + 'wrap{max-width:960px;margin:0 auto;padding:12px;font-size:14px;color:#333}' +
      '.' + P + 'wrap h3{margin:0 0 6px;color:#e8505b}' +
      '.' + P + 'note{color:#888;font-size:12px;margin:4px 0 10px}' +
      '.' + P + 'card{background:#fff;border:1px solid #eee;border-radius:8px;padding:12px;margin-bottom:12px}' +
      '.' + P + 'stage{position:relative;background:#111;border-radius:6px;overflow:hidden;min-height:120px}' +
      '.' + P + 'stage video{display:block;width:100%;max-height:360px}' +
      '.' + P + 'ov{position:absolute;left:8%;right:8%;bottom:12px;text-align:center;color:#fff;font-size:16px;' +
      'text-shadow:0 0 3px #000,0 0 3px #000;pointer-events:none}' +
      '.' + P + 'prev{margin-top:8px;padding:8px;background:#fdf1f2;border-left:4px solid #e8505b;border-radius:4px;min-height:22px}' +
      '.' + P + 'btn{background:#e8505b;color:#fff;border:0;border-radius:4px;padding:6px 12px;margin:0 6px 6px 0;cursor:pointer;font-size:13px}' +
      '.' + P + 'btn.' + P + 'sec{background:#fff;color:#e8505b;border:1px solid #e8505b}' +
      '.' + P + 'tbl{width:100%;border-collapse:collapse}' +
      '.' + P + 'tbl th{background:#fdf1f2;color:#e8505b;text-align:left;padding:4px;font-weight:600}' +
      '.' + P + 'tbl td{padding:3px;vertical-align:top}' +
      '.' + P + 'tbl input,.' + P + 'tbl textarea,.' + P + 'wrap textarea.' + P + 'all{width:100%;box-sizing:border-box;border:1px solid #ddd;border-radius:4px;padding:4px;font:inherit}' +
      '.' + P + 'tbl input.' + P + 't{width:64px}' +
      '.' + P + 'tbl textarea{height:48px;resize:vertical}' +
      '.' + P + 'on{background:#fff3cd}' +
      '.' + P + 'slider{width:100%}';
    document.head.appendChild(st);
  }

  function render(el) {
    injectStyle();
    var rows = load();
    var curUrl = null;

    el.innerHTML =
      '<div class="' + P + 'wrap">' +
      '<h3>视频字幕：中文视频 → 日语介绍/字幕</h3>' +
      '<div class="' + P + 'note">视频仅在本浏览器内播放，不会上传到任何服务器；字幕保存在本机 localStorage。</div>' +
      '<div class="' + P + 'card">' +
      '<input type="file" accept="video/*" class="' + P + 'file">' +
      '<div class="' + P + 'stage" style="margin-top:8px"><video controls style="display:none"></video>' +
      '<div class="' + P + 'ov"></div></div>' +
      '<div class="' + P + 'novid" style="margin-top:8px"><span class="' + P + 'note">未选择视频：拖动滑块模拟播放时间预览字幕　</span>' +
      '<input type="range" class="' + P + 'slider" min="0" max="60" step="0.1" value="0"> <span class="' + P + 'tv">0.0 秒</span></div>' +
      '<div class="' + P + 'prev"></div>' +
      '</div>' +
      '<div class="' + P + 'card">' +
      '<div><button class="' + P + 'btn" data-a="sample">示例字幕</button>' +
      '<button class="' + P + 'btn" data-a="add">添加一行</button>' +
      '<button class="' + P + 'btn" data-a="tr">自动翻译</button>' +
      '<button class="' + P + 'btn ' + P + 'sec" data-a="clear">清空</button></div>' +
      '<div class="' + P + 'note">自动翻译为演示版（词典匹配），正式版可接入 AI 翻译与语音识别。</div>' +
      '<table class="' + P + 'tbl"><thead><tr><th>起始秒</th><th>结束秒</th><th>中文原文</th><th>日语译文</th><th></th></tr></thead>' +
      '<tbody></tbody></table></div>' +
      '<div class="' + P + 'card">' +
      '<button class="' + P + 'btn" data-a="srt">导出日语 SRT</button>' +
      '<button class="' + P + 'btn" data-a="copy">复制日语介绍全文</button>' +
      '<span class="' + P + 'msg note"></span>' +
      '<textarea class="' + P + 'all" rows="4" readonly placeholder="日语介绍全文"></textarea>' +
      '</div></div>';

    var $ = function (s) { return el.querySelector(s); };
    var tbody = $('tbody'), video = $('video'), ov = $('.' + P + 'ov'), prev = $('.' + P + 'prev');
    var slider = $('.' + P + 'slider'), tv = $('.' + P + 'tv'), novid = $('.' + P + 'novid');
    var all = $('.' + P + 'all'), msg = $('.' + P + 'msg'), stage = $('.' + P + 'stage');
    stage.style.display = 'none';

    function say(t) { msg.textContent = ' ' + t; }

    function current(t) {
      for (var i = 0; i < rows.length; i++) {
        if (t >= rows[i].s && t < rows[i].e && String(rows[i].ja || '').trim()) return i;
      }
      return -1;
    }
    function showAt(t) {
      var i = current(t);
      var text = i >= 0 ? rows[i].ja : '';
      ov.textContent = text;
      prev.textContent = text || '（当前时间没有对应字幕）';
      Array.prototype.forEach.call(tbody.children, function (tr, k) {
        tr.className = k === i ? P + 'on' : '';
      });
    }
    function now() { return curUrl ? video.currentTime : num(slider.value); }

    function refreshAll() {
      all.value = rows.map(function (r) { return String(r.ja || '').trim(); })
        .filter(Boolean).join('\n');
      var maxT = rows.reduce(function (m, r) { return Math.max(m, r.e); }, 60);
      slider.max = Math.ceil(maxT);
    }

    function draw() {
      tbody.innerHTML = '';
      rows.forEach(function (r, i) {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td><input class="' + P + 't" data-f="s" type="number" min="0" step="0.1"></td>' +
          '<td><input class="' + P + 't" data-f="e" type="number" min="0" step="0.1"></td>' +
          '<td><textarea data-f="zh"></textarea></td>' +
          '<td><textarea data-f="ja"></textarea></td>' +
          '<td><button class="' + P + 'btn ' + P + 'sec" data-del="1">删除</button></td>';
        Array.prototype.forEach.call(tr.querySelectorAll('[data-f]'), function (inp) {
          var f = inp.getAttribute('data-f');
          inp.value = r[f];
          inp.addEventListener('input', function () {
            r[f] = (f === 's' || f === 'e') ? num(inp.value) : inp.value;
            save(rows); refreshAll(); showAt(now());
          });
        });
        tr.querySelector('[data-del]').addEventListener('click', function () {
          rows.splice(i, 1); save(rows); draw();
        });
        tbody.appendChild(tr);
      });
      refreshAll(); showAt(now());
    }

    $('.' + P + 'file').addEventListener('change', function (ev) {
      var f = ev.target.files && ev.target.files[0];
      if (curUrl) { URL.revokeObjectURL(curUrl); curUrl = null; }
      if (!f) {
        video.removeAttribute('src'); video.style.display = 'none'; stage.style.display = 'none';
        novid.style.display = ''; showAt(now()); return;
      }
      curUrl = URL.createObjectURL(f);
      video.src = curUrl;
      video.style.display = ''; stage.style.display = ''; novid.style.display = 'none';
      showAt(0);
    });
    video.addEventListener('timeupdate', function () { showAt(video.currentTime); });
    video.addEventListener('seeked', function () { showAt(video.currentTime); });
    slider.addEventListener('input', function () {
      tv.textContent = num(slider.value).toFixed(1) + ' 秒'; showAt(num(slider.value));
    });

    el.addEventListener('click', function (ev) {
      var a = ev.target.getAttribute && ev.target.getAttribute('data-a');
      if (!a) return;
      if (a === 'sample') {
        if (rows.length && !confirm('将用示例字幕替换当前字幕，是否继续？')) return;
        rows = SAMPLE.map(function (r) { return { s: r.s, e: r.e, zh: r.zh, ja: r.ja }; });
        save(rows); draw(); say('已填入示例字幕。');
      } else if (a === 'add') {
        var last = rows.length ? rows[rows.length - 1].e : 0;
        rows.push({ s: last, e: last + 3, zh: '', ja: '' });
        save(rows); draw();
      } else if (a === 'tr') {
        var n = 0;
        rows.forEach(function (r) {
          if (String(r.zh || '').trim()) { r.ja = translate(r.zh); n++; }
        });
        save(rows); draw(); say('演示版翻译完成（' + n + ' 行），请人工校对。');
      } else if (a === 'clear') {
        if (rows.length && !confirm('确定清空全部字幕？')) return;
        rows = []; save(rows); draw();
      } else if (a === 'srt') {
        var srt = buildSrt(rows);
        if (!srt) { say('没有可导出的日语字幕。'); return; }
        var blob = new Blob(['﻿' + srt], { type: 'application/x-subrip;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url; link.download = 'subtitles_ja.srt';
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        say('已导出 subtitles_ja.srt。');
      } else if (a === 'copy') {
        var text = all.value;
        if (!text) { say('没有可复制的日语内容。'); return; }
        var ok = function () { say('已复制日语介绍全文。'); };
        var fallback = function () {
          all.select();
          try { document.execCommand('copy') ? ok() : say('请手动复制文本框内容。'); }
          catch (e) { say('请手动复制文本框内容。'); }
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(ok, fallback);
        } else fallback();
      }
    });

    draw();
  }

  (window.ShopAppModules = window.ShopAppModules || []).push({ id: 'video', title: '视频字幕', render: render });
})();
