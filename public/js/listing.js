/* 商品介绍模块：日语商品介绍与海报图文生成（演示版） */
(function () {
  'use strict';

  var PREFIX = 'shop.listing.';
  var KEY_RECORDS = PREFIX + 'records';
  var KEY_DRAFT = PREFIX + 'draft';
  var KEY_PUBLISHED = PREFIX + 'published';
  var CLS = 'shopls-';

  // ---------- 关键词词典（演示级） ----------
  var DICT = {
    // 商品类
    '黑色小熊玩偶': 'ブラックベアぬいぐるみ',
    '小熊玩偶': 'クマのぬいぐるみ',
    '羊毛袜套': 'ウールレッグウォーマー',
    '袜套': 'レッグウォーマー',
    '喇叭裤': 'フレアパンツ',
    '玩偶': 'ぬいぐるみ',
    '裤': 'パンツ',
    // 颜色
    '黑色': 'ブラック', '白色': 'ホワイト', '米色': 'ベージュ', '灰色': 'グレー',
    '粉色': 'ピンク', '棕色': 'ブラウン', '咖啡色': 'コーヒーブラウン',
    // 材质
    '羊毛': 'ウール', '棉': 'コットン', '涤纶': 'ポリエステル', '聚酯纤维': 'ポリエステル',
    '氨纶': 'スパンデックス', '弹力': 'ストレッチ', '针织': 'ニット', '毛绒': 'ぬいぐるみ素材のふわふわ生地',
    '短毛绒': 'ショートプラッシュ', 'PP棉': 'PP綿', '填充': '詰め物', '绒': 'ボア',
    // 特点
    '高腰': 'ハイウエスト', '显瘦': '着痩せ効果', '显腿长': '脚長効果', '修身': 'スリム',
    '百搭': 'コーデしやすい', '四季可穿': 'オールシーズン着用可', '上身': '着用すると', '左右': '前後', '保暖': '暖かい', '柔软': 'やわらか', '透气': '通気性が良い',
    '防滑': '滑り止め付き', '不起球': '毛玉になりにくい', '可爱': 'かわいい', '治愈': '癒やし系',
    '手感': '手触り', '礼物': 'ギフト', '送礼': 'ギフト', '秋冬': '秋冬', '四季': '四季',
    '耐穿': '丈夫で長持ち', '不易变形': '型崩れしにくい', '可机洗': '洗濯機OK', '可水洗': '水洗いOK',
    '脚踝': '足首', '小腿': 'ふくらはぎ', '膝盖': '膝', '腰': 'ウエスト', '身高': '身長',
    '长度': '丈', '腰围': 'ウエスト', '臀围': 'ヒップ', '高': '高さ', '长': '長さ', '宽': '幅',
    '舒服': '快適', '舒适': '快適', '好看': '見た目がきれい', '喜欢': '気に入っています',
    '很': 'とても', '非常': 'とても', '特别': '特に', '不会': 'ません',
    '厘米': 'cm', '女生': '女性', '男生': '男性', '孩子': 'お子様', '朋友': 'お友達', '陪睡': '一緒に寝る'
  };
  var DICT_KEYS = Object.keys(DICT).sort(function (a, b) { return b.length - a.length; });

  function translate(text) {
    var out = String(text || '');
    DICT_KEYS.forEach(function (k) { out = out.split(k).join(DICT[k]); });
    return out;
  }
  // 无法翻译的汉字片段保留原文，并在结果中提示
  function untranslated(text) {
    var m = translate(text).match(/[一-鿿]+/g);
    return m ? m : [];
  }

  // ---------- 示例 ----------
  var SAMPLES = [
    { label: '喇叭裤', name: '黑色喇叭裤', material: '涤纶、氨纶 弹力针织', features: ['高腰显瘦', '显腿长', '百搭 四季可穿', '不易变形'],
      size: '腰围 64cm / 长度 98cm / 身高 160cm 左右', feel: '很舒服，手感柔软，上身显腿长，非常百搭', price: 1850 },
    { label: '羊毛袜套', name: '羊毛袜套', material: '羊毛 棉 氨纶', features: ['保暖 柔软', '防滑', '不起球', '秋冬 送礼'],
      size: '长度 45cm / 脚踝到小腿', feel: '很暖和，柔软舒适，不会滑落，秋冬特别好用', price: 980 },
    { label: '黑色小熊玩偶', name: '黑色小熊玩偶', material: '短毛绒 PP棉填充', features: ['可爱 治愈', '毛绒手感柔软', '陪睡 送礼', '可水洗'],
      size: '高 30cm / 宽 22cm', feel: '手感柔软，非常可爱，孩子和朋友都很喜欢', price: 3300 }
  ];

  // ---------- 配色风格 ----------
  var STYLES = [
    { id: 'rose', label: '玫红', c1: '#e8505b', c2: '#f9a08b', text: '#ffffff', accent: '#fff3c4' },
    { id: 'sky', label: '天蓝', c1: '#2f80ed', c2: '#8fd3f4', text: '#ffffff', accent: '#fff9b0' },
    { id: 'mint', label: '薄荷', c1: '#1e9e83', c2: '#b8f0cf', text: '#12362d', accent: '#e8505b' },
    { id: 'night', label: '夜幕', c1: '#1f1c2c', c2: '#5b4b8a', text: '#ffffff', accent: '#ffd36e' }
  ];
  function styleById(id) { for (var i = 0; i < STYLES.length; i++) if (STYLES[i].id === id) return STYLES[i]; return STYLES[0]; }

  // ---------- 存储 ----------
  function load(key, def) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch (e) { return def; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; }
  }

  // ---------- 文案生成 ----------
  function yen(n) { return '¥' + Number(n || 0).toLocaleString('ja-JP'); }

  function generate(input) {
    var name = translate(input.name).trim() || '商品名未入力';
    var feats = input.features.map(translate).filter(Boolean);
    var material = translate(input.material);
    var size = translate(input.size);
    var feel = translate(input.feel);
    var catchCopy = feats.length ? feats.slice(0, 3).join('・') : 'こだわりの一品';
    var intro = ['【商品名】' + name];
    if (material) intro.push('【素材】' + material);
    if (feats.length) {
      intro.push('【特徴】');
      feats.forEach(function (f) { intro.push('・' + f); });
    }
    if (size) intro.push('【サイズ】' + size);
    intro.push('【価格】' + yen(input.price) + '（税込）');
    var review = feel
      ? '実際に使ってみた感想：' + feel + '。毎日の暮らしにぴったりの' + name + 'です。ギフトにもおすすめです。'
      : '毎日の暮らしにぴったりの' + name + 'です。ぜひお試しください。';
    var miss = untranslated([input.name, input.material, input.size, input.feel].concat(input.features).join(' '));
    return { name: name, catchCopy: catchCopy, features: feats, intro: intro.join('\n'), review: review, price: Number(input.price) || 0, missing: miss };
  }

  // ---------- 海报 ----------
  function wrapLines(ctx, text, maxW) {
    var lines = [], cur = '';
    String(text).split('\n').forEach(function (para) {
      cur = '';
      for (var i = 0; i < para.length; i++) {
        var t = cur + para[i];
        if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = para[i]; } else cur = t;
      }
      lines.push(cur);
    });
    return lines;
  }
  function drawWrapped(ctx, text, x, y, maxW, lh, maxLines) {
    var lines = wrapLines(ctx, text, maxW);
    if (maxLines && lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + '…';
    }
    lines.forEach(function (l, i) { ctx.fillText(l, x, y + i * lh); });
    return y + lines.length * lh;
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  var FONT = '"Hiragino Sans","Yu Gothic","Meiryo","Microsoft YaHei",sans-serif';

  function drawPoster(canvas, result, styleId) {
    var st = styleById(styleId), W = 750, H = 1000;
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, st.c1); g.addColorStop(1, st.c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 装饰圆
    ctx.globalAlpha = 0.15; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(W - 90, 110, 150, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(70, H - 160, 190, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    // 标签
    ctx.fillStyle = st.accent; roundRect(ctx, 50, 50, 190, 46, 23); ctx.fill();
    ctx.fillStyle = st.id === 'mint' ? '#fff' : '#333';
    ctx.font = 'bold 24px ' + FONT; ctx.fillText('NEW ARRIVAL', 72, 59);
    // 商品名
    ctx.fillStyle = st.text; ctx.font = 'bold 66px ' + FONT;
    var y = drawWrapped(ctx, result.name, 50, 140, W - 100, 82, 3);
    // 卖点
    y += 30;
    ctx.font = 'bold 32px ' + FONT;
    var pts = result.features.length ? result.features : [result.catchCopy];
    pts.slice(0, 4).forEach(function (p) {
      var lines = wrapLines(ctx, p, W - 190);
      var h = lines.length * 44 + 20;
      ctx.fillStyle = 'rgba(255,255,255,0.88)'; roundRect(ctx, 50, y, W - 100, h, 16); ctx.fill();
      ctx.fillStyle = st.c1 === '#1f1c2c' ? st.c2 : st.c1;
      ctx.beginPath(); ctx.arc(86, y + h / 2, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#333'; ctx.font = 'bold 32px ' + FONT;
      lines.forEach(function (l, i) { ctx.fillText(l, 118, y + 10 + i * 44); });
      y += h + 16;
    });
    // 价格
    var py = H - 170;
    ctx.fillStyle = st.accent; roundRect(ctx, 50, py, W - 100, 120, 24); ctx.fill();
    ctx.fillStyle = st.id === 'mint' ? '#fff' : '#333';
    ctx.font = 'bold 28px ' + FONT; ctx.fillText('特別価格（税込）', 80, py + 16);
    ctx.fillStyle = st.id === 'mint' ? '#fff' : '#d6303b';
    if (st.id === 'rose' || st.id === 'night' || st.id === 'sky') ctx.fillStyle = st.id === 'night' ? '#7a4b00' : '#d6303b';
    ctx.font = 'bold 66px ' + FONT; ctx.textAlign = 'right';
    ctx.fillText(yen(result.price), W - 80, py + 40);
    ctx.textAlign = 'left';
  }

  // ---------- 上身图示意 ----------
  function drawTryOn(canvas, result, input, styleId) {
    var st = styleById(styleId), W = 420, H = 560;
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f4f1ee'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e4dfda'; ctx.fillRect(0, H - 70, W, 70);
    var sil = '#b9b2ab';
    ctx.fillStyle = sil;
    ctx.beginPath(); ctx.arc(W / 2, 110, 48, 0, Math.PI * 2); ctx.fill();           // 头
    ctx.fillRect(W / 2 - 14, 150, 28, 24);                                           // 颈
    ctx.beginPath(); ctx.moveTo(W / 2 - 78, 180); ctx.lineTo(W / 2 + 78, 180);        // 肩身
    ctx.lineTo(W / 2 + 62, 330); ctx.lineTo(W / 2 - 62, 330); ctx.closePath(); ctx.fill();
    ctx.fillRect(W / 2 - 104, 184, 24, 150); ctx.fillRect(W / 2 + 80, 184, 24, 150); // 手臂
    ctx.fillRect(W / 2 - 60, 330, 52, 175); ctx.fillRect(W / 2 + 8, 330, 52, 175);   // 腿
    // 商品色块，按商品类型放置在不同部位
    var n = input.name || '';
    ctx.fillStyle = st.c1; ctx.globalAlpha = 0.9;
    if (/袜|套/.test(n)) {
      ctx.fillRect(W / 2 - 60, 400, 52, 90); ctx.fillRect(W / 2 + 8, 400, 52, 90);
    } else if (/玩偶|熊/.test(n)) {
      ctx.beginPath(); ctx.arc(W / 2, 270, 46, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(W / 2 - 34, 232, 16, 0, Math.PI * 2); ctx.arc(W / 2 + 34, 232, 16, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(W / 2 - 62, 300); ctx.lineTo(W / 2 + 62, 300);
      ctx.lineTo(W / 2 + 74, 505); ctx.lineTo(W / 2 + 8, 505); ctx.lineTo(W / 2, 350);
      ctx.lineTo(W / 2 - 8, 505); ctx.lineTo(W / 2 - 74, 505); ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#555'; ctx.font = 'bold 26px ' + FONT; ctx.fillText('上身图示意', W / 2, 20);
    ctx.font = '18px ' + FONT; ctx.fillStyle = '#777';
    ctx.fillText(result.name.length > 18 ? result.name.slice(0, 17) + '…' : result.name, W / 2, H - 50);
    ctx.textAlign = 'left';
  }

  // ---------- 样式 ----------
  var CSS = [
    '.shopls-root{font-family:-apple-system,"Microsoft YaHei",sans-serif;color:#333;max-width:1100px;margin:0 auto;padding:12px}',
    '.shopls-root h2{margin:0 0 4px;color:#e8505b;font-size:22px}',
    '.shopls-root h3{margin:0 0 10px;font-size:16px;border-left:4px solid #e8505b;padding-left:8px}',
    '.shopls-tip{font-size:12px;color:#888;margin:0 0 12px}',
    '.shopls-card{background:#fff;border:1px solid #eee;border-radius:10px;padding:14px;margin-bottom:14px;box-shadow:0 1px 3px rgba(0,0,0,.04)}',
    '.shopls-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}',
    '@media(max-width:800px){.shopls-grid{grid-template-columns:1fr}}',
    '.shopls-field{margin-bottom:10px}',
    '.shopls-field label{display:block;font-size:13px;color:#666;margin-bottom:3px}',
    '.shopls-field input,.shopls-field textarea{width:100%;box-sizing:border-box;padding:7px 9px;border:1px solid #ddd;border-radius:6px;font-size:14px;font-family:inherit}',
    '.shopls-field input:focus,.shopls-field textarea:focus{outline:none;border-color:#e8505b}',
    '.shopls-btn{background:#e8505b;color:#fff;border:0;border-radius:6px;padding:8px 16px;font-size:14px;cursor:pointer;margin:0 6px 6px 0}',
    '.shopls-btn:hover{opacity:.9}',
    '.shopls-btn.shopls-ghost{background:#fff;color:#e8505b;border:1px solid #e8505b}',
    '.shopls-btn.shopls-small{padding:3px 10px;font-size:12px}',
    '.shopls-out{white-space:pre-wrap;background:#fff8f8;border:1px solid #f6d5d8;border-radius:6px;padding:10px;font-size:14px;line-height:1.7;margin:0 0 10px}',
    '.shopls-lbl{font-size:12px;color:#e8505b;margin-bottom:3px}',
    '.shopls-canvaswrap{text-align:center}',
    '.shopls-canvaswrap canvas{max-width:100%;height:auto;border:1px solid #eee;border-radius:8px}',
    '.shopls-styles span{margin-right:8px;font-size:13px;cursor:pointer}',
    '.shopls-warn{font-size:12px;color:#b26a00;background:#fff6e0;border-radius:6px;padding:6px 8px;margin-bottom:10px}',
    '.shopls-rec{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f0f0f0;padding:7px 0;font-size:14px}',
    '.shopls-rec small{color:#999;margin-left:8px}',
    '.shopls-empty{color:#aaa;font-size:13px;padding:8px 0}'
  ].join('\n');

  function injectStyle() {
    if (document.getElementById('shopls-style')) return;
    var s = document.createElement('style'); s.id = 'shopls-style'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ---------- DOM 辅助 ----------
  function h(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // ---------- 渲染 ----------
  function render(el) {
    injectStyle();
    el.innerHTML = '';
    var root = h('div', CLS + 'root'); el.appendChild(root);
    root.appendChild(h('h2', '', '商品介绍'));
    root.appendChild(h('p', CLS + 'tip', '演示版，正式版可接入 AI 翻译。输入中文商品信息，生成日语商品名、介绍、使用感受与海报。数据仅保存在本浏览器。'));

    var state = { result: null, input: null, style: 'rose' };

    // 表单
    var formCard = h('div', CLS + 'card'); root.appendChild(formCard);
    formCard.appendChild(h('h3', '', '商品信息（中文）'));
    var samples = h('div'); formCard.appendChild(samples);
    samples.appendChild(h('span', '', '示例：'));
    var fields = {};
    function field(key, label, multi, ph) {
      var w = h('div', CLS + 'field'); w.appendChild(h('label', '', label));
      var i = h(multi ? 'textarea' : 'input'); if (multi) i.rows = 3;
      if (key === 'price') i.type = 'number';
      if (ph) i.placeholder = ph;
      w.appendChild(i); formCard.appendChild(w); fields[key] = i;
    }
    field('name', '商品名', false, '例：黑色喇叭裤');
    field('material', '材质', false, '例：羊毛 棉 氨纶');
    field('features', '特点（每行一条）', true, '例：\n高腰显瘦\n百搭');
    field('size', '尺寸', false, '例：长度 45cm');
    field('feel', '使用感受', true, '例：很舒服，手感柔软');
    field('price', '价格（日元）', false, '例：1850');

    function fill(d) {
      fields.name.value = d.name; fields.material.value = d.material;
      fields.features.value = d.features.join('\n'); fields.size.value = d.size;
      fields.feel.value = d.feel; fields.price.value = d.price;
    }
    function read() {
      return {
        name: fields.name.value.trim(), material: fields.material.value.trim(),
        features: fields.features.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean),
        size: fields.size.value.trim(), feel: fields.feel.value.trim(), price: Number(fields.price.value) || 0
      };
    }
    SAMPLES.forEach(function (s) {
      var b = h('button', CLS + 'btn ' + CLS + 'ghost ' + CLS + 'small', s.label); b.type = 'button';
      b.onclick = function () { fill(s); run(); };
      samples.appendChild(b);
    });
    var genBtn = h('button', CLS + 'btn', '生成'); genBtn.type = 'button';
    var clrBtn = h('button', CLS + 'btn ' + CLS + 'ghost', '清空'); clrBtn.type = 'button';
    formCard.appendChild(genBtn); formCard.appendChild(clrBtn);
    var msg = h('div', CLS + 'tip'); formCard.appendChild(msg);

    // 结果区
    var resWrap = h('div'); root.appendChild(resWrap);
    var textCard = h('div', CLS + 'card');
    textCard.appendChild(h('h3', '', '日语商品介绍'));
    var warn = h('div', CLS + 'warn'); warn.style.display = 'none'; textCard.appendChild(warn);
    textCard.appendChild(h('div', CLS + 'lbl', '商品名'));
    var outName = h('div', CLS + 'out'); textCard.appendChild(outName);
    textCard.appendChild(h('div', CLS + 'lbl', '性能介绍'));
    var outIntro = h('div', CLS + 'out'); textCard.appendChild(outIntro);
    textCard.appendChild(h('div', CLS + 'lbl', '使用感受'));
    var outFeel = h('div', CLS + 'out'); textCard.appendChild(outFeel);
    var saveBtn = h('button', CLS + 'btn', '保存记录'); saveBtn.type = 'button';
    textCard.appendChild(saveBtn);
    var pubBtn = h('button', CLS + 'btn', '上架到メルカリShops'); pubBtn.type = 'button';
    textCard.appendChild(pubBtn);
    var pubMsg = h('div', CLS + 'tip'); textCard.appendChild(pubMsg);

    var grid = h('div', CLS + 'grid');
    var posterCard = h('div', CLS + 'card');
    posterCard.appendChild(h('h3', '', '海报'));
    var stylesBar = h('div', CLS + 'styles'); posterCard.appendChild(stylesBar);
    var pWrap = h('div', CLS + 'canvaswrap'); var posterCv = h('canvas'); pWrap.appendChild(posterCv);
    posterCard.appendChild(pWrap);
    var dlBtn = h('button', CLS + 'btn', '下载 PNG'); dlBtn.type = 'button'; dlBtn.style.marginTop = '8px';
    posterCard.appendChild(dlBtn);

    var tryCard = h('div', CLS + 'card');
    tryCard.appendChild(h('h3', '', '原创上身图'));
    tryCard.appendChild(h('p', CLS + 'tip', '此处为占位示意（剪影 + 商品色块）。正式版将由 AI 生成真实的原创上身图。'));
    var tWrap = h('div', CLS + 'canvaswrap'); var tryCv = h('canvas'); tWrap.appendChild(tryCv);
    tryCard.appendChild(tWrap);
    grid.appendChild(posterCard); grid.appendChild(tryCard);

    resWrap.appendChild(textCard); resWrap.appendChild(grid);
    resWrap.style.display = 'none';

    // 配色选择
    STYLES.forEach(function (s) {
      var lab = h('label'); lab.className = ''; lab.style.marginRight = '10px'; lab.style.fontSize = '13px'; lab.style.cursor = 'pointer';
      var r = h('input'); r.type = 'radio'; r.name = 'shopls-style-' + Math.random().toString(36).slice(2, 6);
      r.value = s.id; r.checked = s.id === state.style;
      r.onchange = function () { state.style = s.id; redraw(); };
      lab.appendChild(r);
      var dot = h('span'); dot.style.cssText = 'display:inline-block;width:12px;height:12px;border-radius:50%;margin:0 4px;vertical-align:middle;background:linear-gradient(135deg,' + s.c1 + ',' + s.c2 + ')';
      lab.appendChild(dot); lab.appendChild(document.createTextNode(s.label));
      stylesBar.appendChild(lab);
      s._radio = r;
    });
    function syncRadios() { STYLES.forEach(function (s) { s._radio.checked = s.id === state.style; }); }

    // 记录列表
    var recCard = h('div', CLS + 'card'); root.appendChild(recCard);
    recCard.appendChild(h('h3', '', '生成记录'));
    var recList = h('div'); recCard.appendChild(recList);

    // 上架记录
    var pubCard = h('div', CLS + 'card'); root.appendChild(pubCard);
    pubCard.appendChild(h('h3', '', '上架记录'));
    var pubList = h('div'); pubCard.appendChild(pubList);

    function redraw() {
      if (!state.result) return;
      drawPoster(posterCv, state.result, state.style);
      drawTryOn(tryCv, state.result, state.input, state.style);
    }
    function run() {
      var inp = read();
      if (!inp.name) { msg.textContent = '请先填写商品名，或选择一个示例。'; return; }
      msg.textContent = '';
      state.input = inp; state.result = generate(inp);
      outName.textContent = state.result.name;
      outIntro.textContent = state.result.intro;
      outFeel.textContent = state.result.review;
      if (state.result.missing.length) {
        warn.style.display = ''; warn.textContent = '演示词典未收录：' + state.result.missing.join('、') + '（已保留原文，正式版接入 AI 翻译后可自动处理）';
      } else warn.style.display = 'none';
      resWrap.style.display = '';
      redraw();
      save(KEY_DRAFT, { input: inp, style: state.style });
    }
    genBtn.onclick = run;
    clrBtn.onclick = function () {
      fill({ name: '', material: '', features: [], size: '', feel: '', price: '' });
      resWrap.style.display = 'none'; state.result = null; msg.textContent = '';
    };
    dlBtn.onclick = function () {
      if (!state.result) return;
      var fname = 'poster-' + state.style + '-' + Date.now() + '.png';
      function go(url, revoke) {
        var a = document.createElement('a'); a.href = url; a.download = fname;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        if (revoke) setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      }
      if (posterCv.toBlob) posterCv.toBlob(function (b) { if (b) go(URL.createObjectURL(b), true); }, 'image/png');
      else go(posterCv.toDataURL('image/png'), false);
    };
    saveBtn.onclick = function () {
      if (!state.result) return;
      var list = load(KEY_RECORDS, []);
      list.unshift({ id: Date.now().toString(36), time: new Date().toLocaleString('zh-CN'), style: state.style, input: state.input, title: state.result.name });
      if (list.length > 50) list.length = 50;
      msg.textContent = save(KEY_RECORDS, list) ? '已保存到记录。' : '保存失败（浏览器存储不可用）。';
      renderRecords();
    };

    function renderRecords() {
      var list = load(KEY_RECORDS, []);
      recList.innerHTML = '';
      if (!list.length) { recList.appendChild(h('div', CLS + 'empty', '暂无记录。生成后点击“保存记录”。')); return; }
      list.forEach(function (r) {
        var row = h('div', CLS + 'rec');
        var left = h('div', '', r.title); left.appendChild(h('small', '', r.time));
        var ops = h('div');
        var v = h('button', CLS + 'btn ' + CLS + 'ghost ' + CLS + 'small', '查看'); v.type = 'button';
        v.onclick = function () { fill(r.input); state.style = r.style || 'rose'; syncRadios(); run(); root.scrollIntoView && root.scrollIntoView({ behavior: 'smooth' }); };
        var d = h('button', CLS + 'btn ' + CLS + 'small', '删除'); d.type = 'button';
        d.onclick = function () {
          save(KEY_RECORDS, load(KEY_RECORDS, []).filter(function (x) { return x.id !== r.id; }));
          renderRecords();
        };
        ops.appendChild(v); ops.appendChild(d);
        row.appendChild(left); row.appendChild(ops); recList.appendChild(row);
      });
    }
    renderRecords();

    function renderPublished() {
      var list = load(KEY_PUBLISHED, []);
      pubList.innerHTML = '';
      if (!Array.isArray(list) || !list.length) { pubList.appendChild(h('div', CLS + 'empty', '暂无上架记录')); return; }
      list.forEach(function (r) {
        var row = h('div', CLS + 'rec');
        var left = h('div', '', r.title); left.appendChild(h('small', '', r.time));
        row.appendChild(left);
        row.appendChild(h('small', '', '商品ID：' + r.productId));
        pubList.appendChild(row);
      });
    }
    renderPublished();

    var publishing = false;
    pubBtn.onclick = function () {
      if (publishing) return;
      if (!state.result) { pubMsg.textContent = '请先点击生成'; return; }
      var name = String(state.result.name).slice(0, 40);
      var price = state.result.price;
      if (!isFinite(price) || Math.floor(price) !== price || price < 300) { pubMsg.textContent = '价格需为300日元以上'; return; }
      if (!window.confirm('确认上架到メルカリShops？\n商品名：' + name + '\n价格：' + yen(price))) return;
      var body = JSON.stringify({ name: name, description: state.result.intro + '\n\n' + state.result.review, price: price });
      publishing = true; pubBtn.disabled = true; pubBtn.textContent = '上架中…'; pubMsg.textContent = '';
      function done(text) {
        publishing = false; pubBtn.disabled = false; pubBtn.textContent = '上架到メルカリShops';
        pubMsg.textContent = text;
      }
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/mercari/listing');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onload = function () {
        var data = null;
        try { data = JSON.parse(xhr.responseText); } catch (e) { data = null; }
        if (data && data.ok === true && data.productId != null) {
          var list = load(KEY_PUBLISHED, []);
          if (!Array.isArray(list)) list = [];
          list.unshift({ time: new Date().toLocaleString('zh-CN'), title: name, productId: String(data.productId) });
          if (list.length > 50) list.length = 50;
          save(KEY_PUBLISHED, list);
          renderPublished();
          done('已上架到メルカリShops（商品ID：' + data.productId + '）');
        } else if (data && data.error) {
          done(String(data.error));
        } else {
          done('网络异常，请稍后再试');
        }
      };
      xhr.onerror = function () { done('网络异常，请稍后再试'); };
      xhr.ontimeout = xhr.onerror;
      try { xhr.send(body); } catch (e) { done('网络异常，请稍后再试'); }
    };

    // 恢复上次草稿（不自动生成）
    var draft = load(KEY_DRAFT, null);
    if (draft && draft.input) { fill(draft.input); state.style = draft.style || 'rose'; syncRadios(); }
  }

  (window.ShopAppModules = window.ShopAppModules || []).push({ id: 'listing', title: '商品介绍', render: function (el) { render(el); } });
})();
