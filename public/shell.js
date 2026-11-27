(function () {
  var ORDER = ['restock', 'replies', 'listing', 'video'];
  var view = document.getElementById('view');
  var tabbar = document.getElementById('tabbar');

  // 加载失败（404）一律忽略，照常继续
  function loadScript(src) {
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = s.onerror = function () { resolve(); };
      document.body.appendChild(s);
    });
  }

  function getModules() {
    var list = window.ShopAppModules || [];
    var out = [];
    ORDER.forEach(function (id) {
      list.forEach(function (m) {
        if (m && m.id === id && typeof m.render === 'function') out.push(m);
      });
    });
    return out;
  }

  function init() {
    var mods = getModules();
    if (!mods.length) {
      tabbar.hidden = true;
      view.innerHTML = '<div class="empty">功能模块正在准备中</div>';
      return;
    }
    var buttons = {};
    function show(id) {
      var mod = mods.filter(function (m) { return m.id === id; })[0] || mods[0];
      Object.keys(buttons).forEach(function (k) {
        buttons[k].classList.toggle('active', k === mod.id);
      });
      view.innerHTML = '';
      try {
        mod.render(view);
      } catch (e) {
        view.innerHTML = '<div class="empty">该功能加载出错</div>';
        if (window.console) console.error(e);
      }
    }
    mods.forEach(function (m) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tab';
      b.textContent = m.title || m.id;
      b.addEventListener('click', function () {
        if (location.hash !== '#' + m.id) location.hash = m.id;
        else show(m.id);
      });
      tabbar.appendChild(b);
      buttons[m.id] = b;
    });
    window.addEventListener('hashchange', function () {
      show(location.hash.replace('#', ''));
    });
    show(location.hash.replace('#', ''));
  }

  ORDER.reduce(function (p, id) {
    return p.then(function () { return loadScript('js/' + id + '.js'); });
  }, Promise.resolve()).then(init);
})();
