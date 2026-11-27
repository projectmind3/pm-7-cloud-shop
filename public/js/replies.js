(function () {
  'use strict';

  var KEY_TPL = 'shop.replies.templates';
  var KEY_ITEM = 'shop.replies.product';

  var CATS = [
    {
      id: 'size', name: '尺寸询问',
      words: [['サイズ', 2], ['大きさ', 2], ['寸法', 2], ['身長', 1], ['cm', 1], ['センチ', 1], ['ゆったり', 1], ['きつい', 1]],
      ja: 'お問い合わせありがとうございます。\n{商品名}のサイズは{尺寸}でございます。\nサイズ感についてご不安な点がございましたら、身長・体重を教えていただければ、おすすめのサイズをご案内いたします。\nどうぞよろしくお願いいたします。',
      zh: '感谢您的咨询。\n{商品名}的尺寸是{尺寸}。\n如果对尺码有疑问，请告诉我们您的身高体重，我们会为您推荐合适的尺码。\n请多关照。'
    },
    {
      id: 'discount', name: '可否降价',
      words: [['値下げ', 2], ['値引', 2], ['安く', 2], ['割引', 2], ['負けて', 2], ['まけて', 2], ['お安く', 2], ['ディスカウント', 1]],
      ja: 'ご興味をお持ちいただき、誠にありがとうございます。\n申し訳ございませんが、{商品名}はすでに特別価格でご提供しておりますため、これ以上のお値下げは難しい状況でございます。\n何卒ご理解いただけますと幸いです。',
      zh: '非常感谢您对商品感兴趣。\n很抱歉，{商品名}已经是特价，无法再进一步降价。\n恳请您理解。'
    },
    {
      id: 'thanks', name: '感谢购买',
      words: [['ありがとう', 2], ['感謝', 2], ['助かりました', 1], ['気に入', 1], ['満足', 1]],
      ja: 'この度は{商品名}をご購入いただき、誠にありがとうございます。\nご満足いただけましたら幸いです。\n今後ともどうぞよろしくお願いいたします。',
      zh: '感谢您购买{商品名}。\n如果您满意，我们将不胜荣幸。\n今后也请多多关照。'
    },
    {
      id: 'shipped', name: '已发货',
      words: [['発送', 2], ['出荷', 2], ['配送', 2], ['届', 1], ['到着', 1], ['追跡', 1], ['いつ', 1]],
      ja: 'お待たせいたしました。\nご注文いただいた{商品名}は、本日発送いたしました。\nお手元に届くまで、今しばらくお待ちくださいませ。\nどうぞよろしくお願いいたします。',
      zh: '让您久等了。\n您订购的{商品名}已于今天发货。\n请耐心等待商品送达。\n请多关照。'
    }
  ];

  var SAMPLES = [
    'こんにちは。このズボンのサイズ感を教えてください。身長160cmですがSサイズで大丈夫でしょうか？',
    '少し値下げしていただくことは可能ですか？もう少し安くなると嬉しいです。',
    '商品が届きました。丁寧な梱包でした。ありがとうございます！',
    '先日注文しましたが、発送はいつ頃になりますか？'
  ];

  var FALLBACK_TEXT = '请人工回复';

  function loadJSON(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  }
  function saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* 忽略存储失败 */ }
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function defaultTemplates() {
    var t = {};
    CATS.forEach(function (c) { t[c.id] = { ja: c.ja, zh: c.zh }; });
    return t;
  }
  function loadTemplates() {
    var saved = loadJSON(KEY_TPL, null);
    var t = defaultTemplates();
    if (saved && typeof saved === 'object') {
      CATS.forEach(function (c) {
        var s = saved[c.id];
        if (s && typeof s.ja === 'string' && typeof s.zh === 'string') t[c.id] = { ja: s.ja, zh: s.zh };
      });
    }
    return t;
  }
  function fill(text, product, size) {
    return text.split('{商品名}').join(product || '{商品名}').split('{尺寸}').join(size || '{尺寸}');
  }
  // 按关键词权重打分，得分最高者胜出；同分取先定义的类别；无命中返回 null
  function detect(msg) {
    var best = null, bestScore = 0;
    CATS.forEach(function (c) {
      var score = 0;
      c.words.forEach(function (w) { if (msg.indexOf(w[0]) !== -1) score += w[1]; });
      if (score > bestScore) { bestScore = score; best = c.id; }
    });
    return best;
  }

  var STYLE_ID = 'rp-replies-style';
  var CSS =
    '.rp-wrap{font-family:"Microsoft YaHei",sans-serif;color:#333;max-width:880px;margin:0 auto;padding:12px}' +
    '.rp-wrap h2{margin:0 0 4px;font-size:20px;color:#e8505b}' +
    '.rp-wrap h3{margin:0 0 8px;font-size:15px}' +
    '.rp-sub{color:#888;font-size:13px;margin:0 0 12px}' +
    '.rp-box{border:1px solid #eee;border-radius:10px;padding:12px;margin-bottom:12px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.05)}' +
    '.rp-wrap textarea{width:100%;box-sizing:border-box;border:1px solid #ccc;border-radius:6px;padding:8px;font-size:14px;font-family:inherit;resize:vertical}' +
    '.rp-wrap input[type=text]{border:1px solid #ccc;border-radius:4px;padding:4px 6px;font-size:13px;width:150px}' +
    '.rp-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}' +
    '.rp-btn{border:1px solid #e8505b;background:#fff;color:#e8505b;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:13px}' +
    '.rp-btn:hover{background:#fdecee}' +
    '.rp-btn.rp-main{background:#e8505b;color:#fff}' +
    '.rp-btn.rp-main:hover{background:#d3414c}' +
    '.rp-cats{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}' +
    '.rp-cat{border:1px solid #ddd;background:#fff;border-radius:16px;padding:4px 12px;cursor:pointer;font-size:13px}' +
    '.rp-cat.rp-on{background:#e8505b;border-color:#e8505b;color:#fff}' +
    '.rp-out{white-space:pre-wrap;background:#fafafa;border:1px solid #eee;border-radius:6px;padding:10px;font-size:14px;line-height:1.7}' +
    '.rp-zh{white-space:pre-wrap;background:#fff8f8;border:1px dashed #f0b6bb;border-radius:6px;padding:10px;font-size:13px;line-height:1.7;color:#666;margin-top:8px}' +
    '.rp-warn{background:#fff3cd;border:1px solid #ffe08a;color:#8a6d00;border-radius:6px;padding:10px;font-size:14px}' +
    '.rp-tip{color:#999;font-size:12px}' +
    '.rp-ok{color:#2e8b57;font-size:13px}';

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function render(el) {
    injectStyle();
    var templates = loadTemplates();
    var prod = loadJSON(KEY_ITEM, { name: '', size: '' });
    var state = { msg: '', cat: null, analyzed: false, editCat: CATS[0].id, flash: '' };

    function catName(id) {
      for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i].name;
      return '';
    }

    function replyHtml() {
      if (!state.analyzed) return '<div class="rp-tip">输入客户留言后点击“识别并生成回复”。</div>';
      if (!state.cat) {
        return '<div class="rp-warn">未能识别留言类别，请人工回复。也可以在上方手动选择一个类别生成草稿。</div>';
      }
      var t = templates[state.cat];
      return '<div class="rp-out" id="rp-ja">' + esc(fill(t.ja, prod.name, prod.size)) + '</div>' +
        '<div class="rp-zh"><b>中文翻译（仅供参考）：</b>\n' + esc(fill(t.zh, prod.name, prod.size)) + '</div>' +
        '<div class="rp-row"><button class="rp-btn rp-main" data-act="copy">复制日语回复</button>' +
        '<span class="rp-ok">' + esc(state.flash) + '</span></div>';
    }

    function draw() {
      var h = '<div class="rp-wrap"><h2>客户自动回复</h2>' +
        '<p class="rp-sub">粘贴客户的日语留言，自动识别类别并生成礼貌的日语回复草稿。数据仅保存在本浏览器。</p>' +
        '<div class="rp-box"><h3>客户留言</h3>' +
        '<textarea id="rp-msg" rows="4" placeholder="在此粘贴或输入客户的日语留言">' + esc(state.msg) + '</textarea>' +
        '<div class="rp-row"><button class="rp-btn rp-main" data-act="analyze">识别并生成回复</button>' +
        '<span class="rp-tip">示例留言：</span>';
      CATS.forEach(function (c, i) {
        h += '<button class="rp-btn" data-act="sample" data-i="' + i + '">' + esc(c.name) + '</button>';
      });
      h += '</div>' +
        '<div class="rp-row"><label>商品名 <input type="text" id="rp-pname" value="' + esc(prod.name) + '" placeholder="填入 {商品名}"></label>' +
        '<label>尺寸 <input type="text" id="rp-psize" value="' + esc(prod.size) + '" placeholder="填入 {尺寸}"></label></div></div>' +
        '<div class="rp-box"><h3>回复草稿' + (state.cat ? '（类别：' + esc(catName(state.cat)) + '）' : '') + '</h3>' +
        '<div class="rp-cats">';
      CATS.forEach(function (c) {
        h += '<button class="rp-cat' + (state.cat === c.id ? ' rp-on' : '') + '" data-act="cat" data-id="' + c.id + '">' + esc(c.name) + '</button>';
      });
      h += '</div><div id="rp-reply">' + replyHtml() + '</div></div>';

      var et = templates[state.editCat];
      h += '<div class="rp-box"><h3>编辑回复模板</h3><div class="rp-cats">';
      CATS.forEach(function (c) {
        h += '<button class="rp-cat' + (state.editCat === c.id ? ' rp-on' : '') + '" data-act="editcat" data-id="' + c.id + '">' + esc(c.name) + '</button>';
      });
      h += '</div><div class="rp-tip">可使用占位符 {商品名} {尺寸}</div>' +
        '<div class="rp-tip">日语文案</div><textarea id="rp-tja" rows="5">' + esc(et.ja) + '</textarea>' +
        '<div class="rp-tip">中文翻译参考</div><textarea id="rp-tzh" rows="4">' + esc(et.zh) + '</textarea>' +
        '<div class="rp-row"><button class="rp-btn rp-main" data-act="savetpl">保存模板</button>' +
        '<button class="rp-btn" data-act="resettpl">恢复此类别默认</button></div></div></div>';
      el.innerHTML = h;
    }

    function readMsg() {
      var m = el.querySelector('#rp-msg');
      if (m) state.msg = m.value;
    }
    function readProd() {
      var n = el.querySelector('#rp-pname'), s = el.querySelector('#rp-psize');
      if (n) prod.name = n.value.trim();
      if (s) prod.size = s.value.trim();
      saveJSON(KEY_ITEM, prod);
    }
    function readTplFields() {
      var a = el.querySelector('#rp-tja'), b = el.querySelector('#rp-tzh');
      return { ja: a ? a.value : '', zh: b ? b.value : '' };
    }
    function analyze() {
      readMsg();
      readProd();
      state.cat = state.msg.trim() ? detect(state.msg) : null;
      state.analyzed = true;
      state.flash = '';
    }
    function copyText(text) {
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) { /* 忽略 */ }
        document.body.removeChild(ta);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(fallback);
      } else {
        fallback();
      }
    }

    el.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-act]') : null;
      if (!t) return;
      var act = t.getAttribute('data-act');
      if (act === 'analyze') {
        analyze();
        draw();
      } else if (act === 'sample') {
        el.querySelector('#rp-msg').value = SAMPLES[+t.getAttribute('data-i')];
        analyze();
        draw();
      } else if (act === 'cat') {
        readMsg();
        readProd();
        state.cat = t.getAttribute('data-id');
        state.analyzed = true;
        state.flash = '';
        draw();
      } else if (act === 'copy') {
        var ja = el.querySelector('#rp-ja');
        if (ja) copyText(ja.textContent);
        state.flash = '已复制';
        var f = el.querySelector('.rp-ok');
        if (f) f.textContent = state.flash;
      } else if (act === 'editcat') {
        readMsg();
        readProd();
        state.editCat = t.getAttribute('data-id');
        draw();
      } else if (act === 'savetpl') {
        readMsg();
        readProd();
        var v = readTplFields();
        if (!v.ja.trim()) { window.alert('日语文案不能为空'); return; }
        templates[state.editCat] = v;
        saveJSON(KEY_TPL, templates);
        state.flash = '模板已保存';
        draw();
      } else if (act === 'resettpl') {
        readMsg();
        readProd();
        templates[state.editCat] = defaultTemplates()[state.editCat];
        saveJSON(KEY_TPL, templates);
        draw();
      }
    });
    el.addEventListener('change', function (e) {
      if (e.target.id === 'rp-pname' || e.target.id === 'rp-psize') {
        readMsg();
        readProd();
        draw();
      }
    });

    draw();
  }

  (window.ShopAppModules = window.ShopAppModules || []).push({ id: 'replies', title: '客户回复', render: render });
})();
