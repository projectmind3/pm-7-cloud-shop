(function () {
  'use strict';

  var KEY_ITEMS = 'shop.restock.items';
  var KEY_AUTO = 'shop.restock.auto';
  var KEY_LOG = 'shop.restock.log';
  var LOG_MAX = 50;

  function defaults() {
    return [
      { id: 'p1', name: '喇叭裤 黑 S/M', price: 1850, stock: 6, line: 3, qty: 10 },
      { id: 'p2', name: '羊毛袜套', price: 980, stock: 8, line: 4, qty: 20 },
      { id: 'p3', name: '手套 暖手臂套', price: 980, stock: 5, line: 3, qty: 15 },
      { id: 'p4', name: '黑色小熊玩偶', price: 3300, stock: 4, line: 2, qty: 6 }
    ];
  }

  function load(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* 忽略存储失败 */ }
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function now() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
      pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }
  function toInt(v, min) {
    var n = parseInt(v, 10);
    if (isNaN(n) || n < min) n = min;
    return n;
  }

  var STYLE_ID = 'rs-restock-style';
  var CSS =
    '.rs-wrap{font-family:"Microsoft YaHei",sans-serif;color:#333;max-width:880px;margin:0 auto;padding:12px}' +
    '.rs-wrap h2{margin:0 0 4px;font-size:20px;color:#e8505b}' +
    '.rs-sub{color:#888;font-size:13px;margin:0 0 12px}' +
    '.rs-bar{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:12px}' +
    '.rs-sw{display:flex;align-items:center;gap:6px;cursor:pointer;font-size:14px}' +
    '.rs-btn{border:1px solid #e8505b;background:#fff;color:#e8505b;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:13px}' +
    '.rs-btn:hover{background:#fdecee}' +
    '.rs-btn.rs-main{background:#e8505b;color:#fff}' +
    '.rs-btn.rs-main:hover{background:#d3414c}' +
    '.rs-card{border:1px solid #eee;border-radius:10px;padding:12px;margin-bottom:10px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.05)}' +
    '.rs-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between}' +
    '.rs-name{font-weight:bold;font-size:15px}' +
    '.rs-price{color:#e8505b;margin-left:8px;font-size:14px}' +
    '.rs-stock{font-size:22px;font-weight:bold}' +
    '.rs-stock.rs-low{color:#e8505b}' +
    '.rs-tag{display:inline-block;background:#e8505b;color:#fff;border-radius:10px;padding:1px 8px;font-size:12px;margin-left:6px}' +
    '.rs-set{display:flex;flex-wrap:wrap;gap:12px;margin-top:8px;font-size:13px;color:#666;align-items:center}' +
    '.rs-set input{width:64px;padding:3px 5px;border:1px solid #ccc;border-radius:4px}' +
    '.rs-log{border:1px solid #eee;border-radius:10px;padding:10px;background:#fafafa}' +
    '.rs-log h3{margin:0 0 6px;font-size:15px}' +
    '.rs-log ul{list-style:none;margin:0;padding:0;max-height:220px;overflow:auto}' +
    '.rs-log li{font-size:13px;padding:4px 0;border-bottom:1px dashed #e5e5e5}' +
    '.rs-time{color:#999;margin-right:8px}' +
    '.rs-empty{color:#aaa;font-size:13px}';

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function render(el) {
    injectStyle();
    var items = load(KEY_ITEMS, null);
    if (!Array.isArray(items) || !items.length) { items = defaults(); save(KEY_ITEMS, items); }
    var auto = load(KEY_AUTO, true) !== false;
    var log = load(KEY_LOG, []);
    if (!Array.isArray(log)) log = [];

    function persist() {
      save(KEY_ITEMS, items);
      save(KEY_AUTO, auto);
      save(KEY_LOG, log);
    }
    function addLog(text) {
      log.unshift({ time: now(), text: text });
      if (log.length > LOG_MAX) log.length = LOG_MAX;
    }
    function find(id) {
      for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i];
      return null;
    }

    function draw() {
      var h = '<div class="rs-wrap">' +
        '<h2>自动补货提醒</h2>' +
        '<p class="rs-sub">演示数据，仅保存在本浏览器中。库存低于补货线时，自动按补货数量补货。</p>' +
        '<div class="rs-bar">' +
        '<label class="rs-sw"><input type="checkbox" data-act="auto"' + (auto ? ' checked' : '') + '> 自动补货：' + (auto ? '已开启' : '已关闭') + '</label>' +
        '<button class="rs-btn" data-act="reset">重置示例数据</button>' +
        '</div>';
      items.forEach(function (it) {
        var low = it.stock < it.line;
        h += '<div class="rs-card" data-id="' + esc(it.id) + '">' +
          '<div class="rs-row"><div><span class="rs-name">' + esc(it.name) + '</span>' +
          '<span class="rs-price">¥' + it.price.toLocaleString('ja-JP') + '</span>' +
          (low ? '<span class="rs-tag">库存不足，需补货</span>' : '') + '</div>' +
          '<div><span class="rs-stock' + (low ? ' rs-low' : '') + '">' + it.stock + '</span> 件库存 ' +
          '<button class="rs-btn rs-main" data-act="sell">模拟售出 1 件</button></div></div>' +
          '<div class="rs-set"><label>补货线 <input type="number" min="0" data-field="line" value="' + it.line + '"></label>' +
          '<label>补货数量 <input type="number" min="1" data-field="qty" value="' + it.qty + '"></label></div>' +
          '</div>';
      });
      h += '<div class="rs-log"><h3>补货日志</h3>';
      if (!log.length) {
        h += '<div class="rs-empty">暂无补货记录</div>';
      } else {
        h += '<ul>';
        log.forEach(function (l) {
          h += '<li><span class="rs-time">' + esc(l.time) + '</span>' + esc(l.text) + '</li>';
        });
        h += '</ul>';
      }
      h += '</div></div>';
      el.innerHTML = h;
    }

    el.addEventListener('click', function (e) {
      var t = e.target;
      var act = t.getAttribute && t.getAttribute('data-act');
      if (act === 'reset') {
        items = defaults();
        log = [];
        auto = true;
        persist();
        draw();
      } else if (act === 'sell') {
        var card = t.closest('.rs-card');
        var it = card && find(card.getAttribute('data-id'));
        if (!it || it.stock <= 0) return;
        it.stock -= 1;
        if (it.stock < it.line && auto) {
          var before = it.stock;
          it.stock += it.qty;
          addLog('已自动补货：' + it.name + '，库存 ' + before + ' → ' + it.stock + '（+' + it.qty + '）');
        }
        persist();
        draw();
      }
    });
    el.addEventListener('change', function (e) {
      var t = e.target;
      var act = t.getAttribute('data-act');
      if (act === 'auto') {
        auto = t.checked;
        persist();
        draw();
        return;
      }
      var field = t.getAttribute('data-field');
      if (!field) return;
      var card = t.closest('.rs-card');
      var it = card && find(card.getAttribute('data-id'));
      if (!it) return;
      it[field] = toInt(t.value, field === 'qty' ? 1 : 0);
      persist();
      draw();
    });

    draw();
  }

  (window.ShopAppModules = window.ShopAppModules || []).push({ id: 'restock', title: '补货', render: render });
})();
