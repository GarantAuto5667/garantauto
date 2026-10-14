// ГарантАвто — публичный сайт: загрузка контента и отрисовка
(function () {
  'use strict';

  // --- Утилиты ---
  function deepMerge(base, over) {
    if (Array.isArray(over)) return over.slice();
    if (over && typeof over === 'object') {
      var out = Object.assign({}, base);
      Object.keys(over).forEach(function (k) {
        out[k] = deepMerge(base ? base[k] : undefined, over[k]);
      });
      return out;
    }
    return over === undefined ? base : over;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  var ICON = {
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    tag: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    users: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
  };
  var FEATURE_ICONS = [ICON.shield, ICON.wrench, ICON.tag, ICON.users];

  function svg(inner) {
    return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + inner + '</svg>';
  }

  // --- Отрисовка ---
  function render(c) {
    var b = c.business || {};

    // Привязки по data-bind
    document.querySelectorAll('[data-bind]').forEach(function (node) {
      var keys = node.getAttribute('data-bind').split(/\s+/);
      keys.forEach(function (key) {
        if (key === 'phoneLink') { node.setAttribute('href', 'tel:' + (b.phoneRaw || '')); }
        else if (key === 'phone') { node.textContent = b.phone || ''; }
        else if (key === 'phoneBtn') { node.textContent = 'Позвонить: ' + (b.phone || ''); }
        else if (key === 'phone2Link') { if (b.phone2Raw) node.setAttribute('href', 'tel:' + b.phone2Raw); }
        else if (key === 'phone2') { node.textContent = b.phone2 || ''; }
        else if (key === 'address') { node.textContent = b.address || ''; }
        else if (key === 'hours') { node.textContent = b.hours || ''; }
        else if (key === 'metro') { node.textContent = b.metro || ''; }
        else if (key === 'payment') { node.textContent = b.payment || ''; }
        else if (key === 'parts') { node.textContent = b.parts || ''; }
        else if (key === 'yandexUrl') { if (b.yandexUrl) node.setAttribute('href', b.yandexUrl); }
      });
    });

    // Hero
    var h = c.hero || {};
    var heroEl = document.getElementById('heroTitle');
    if (heroEl && h.title) {
      var safe = h.title.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      var bname = (b.name || 'ГарантАвто').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      heroEl.innerHTML = safe.replace(bname, '<span>' + bname + '</span>');
    }
    setText('heroLead', h.lead);
    setSrc('heroImg', h.image);
    setText('stat1num', h.stat1num); setText('stat1lbl', h.stat1lbl);
    setText('stat2num', h.stat2num); setText('stat2lbl', h.stat2lbl);
    setText('stat3num', h.stat3num); setText('stat3lbl', h.stat3lbl);

    // About
    var a = c.about || {};
    setText('aboutTitle', a.title);
    setText('aboutSubtitle', a.subtitle);
    setSrc('aboutImg', a.image);
    var fg = document.getElementById('featuresGrid');
    if (fg && a.features) {
      fg.innerHTML = '';
      a.features.forEach(function (f, i) {
        var card = el('div', 'feature');
        var ico = el('div', 'ico');
        ico.innerHTML = svg(FEATURE_ICONS[i % FEATURE_ICONS.length]);
        card.appendChild(ico);
        card.appendChild(el('h3', null, f.title));
        card.appendChild(el('p', null, f.text));
        fg.appendChild(card);
      });
    }

    // Услуги / цены
    var pg = document.getElementById('priceGrid');
    if (pg && c.services) {
      pg.innerHTML = '';
      c.services.forEach(function (s) {
        var card = el('div', 'price-card');
        card.appendChild(el('h3', null, s.title));
        card.appendChild(el('p', null, s.desc));
        var tag = el('div', 'price-tag');
        tag.appendChild(el('span', 'amount', s.price));
        card.appendChild(tag);
        var btn = el('a', 'btn btn-ghost btn-block', 'Записаться');
        btn.setAttribute('href', '#contacts');
        card.appendChild(btn);
        pg.appendChild(card);
      });
    }

    // Виды работ
    fillChips('worksList', c.works, 'chip');
    // Марки
    fillChips('brandsList', c.brands, 'brand-chip');

    // Галерея
    var gg = document.getElementById('galleryGrid');
    if (gg && c.gallery) {
      gg.innerHTML = '';
      c.gallery.forEach(function (g) {
        if (!g.image) return;
        var item = el('div', 'gallery-item');
        var img = el('img');
        img.src = g.image;
        img.alt = g.caption || 'ГарантАвто';
        img.loading = 'lazy';
        item.appendChild(img);
        if (g.caption) item.appendChild(el('div', 'cap', g.caption));
        gg.appendChild(item);
      });
    }

    // Отзывы
    var rg = document.getElementById('reviewsGrid');
    if (rg && c.reviews) {
      rg.innerHTML = '';
      c.reviews.forEach(function (r) {
        var card = el('div', 'review-card');
        card.appendChild(el('div', 'review-stars', '★★★★★'));
        card.appendChild(el('p', null, '«' + r.text + '»'));
        var author = el('div', 'review-author');
        author.appendChild(el('div', 'review-avatar', r.initial || (r.name || '?').charAt(0)));
        var meta = el('div');
        meta.appendChild(el('div', 'name', r.name));
        meta.appendChild(el('div', 'role', r.role));
        author.appendChild(meta);
        card.appendChild(author);
        rg.appendChild(card);
      });
    }

    // Карта
    if (b.mapSrc) setSrc('mapFrame', b.mapSrc);

    // Год в подвале
    var y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  }

  function setText(id, val) {
    var node = document.getElementById(id);
    if (!node || val == null) return;
    node.textContent = val;
  }
  function setSrc(id, val) {
    var node = document.getElementById(id);
    if (node && val) node.setAttribute('src', val);
  }
  function fillChips(id, arr, cls) {
    var box = document.getElementById(id);
    if (!box || !arr) return;
    box.innerHTML = '';
    arr.forEach(function (t) { box.appendChild(el('span', cls, t)); });
  }

  // --- Загрузка контента ---
  // Обычные посетители видят content.json (опубликованную версию).
  // Режим предпросмотра (index.html?preview=1) показывает черновик из админки.
  function loadContent() {
    var fallback = window.DEFAULT_CONTENT || {};
    var isPreview = /[?&]preview=1/.test(location.search);
    if (isPreview) {
      try {
        var draft = localStorage.getItem('garantavto_content');
        if (draft) { return Promise.resolve(deepMerge(fallback, JSON.parse(draft))); }
      } catch (e) { /* ignore */ }
    }
    return fetch('content.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (json) { return json ? deepMerge(fallback, json) : fallback; })
      .catch(function () { return fallback; });
  }

  // --- Интерактив ---
  function initUI() {
    var burger = document.getElementById('burger');
    var navLinks = document.getElementById('navLinks');
    if (burger && navLinks) {
      burger.addEventListener('click', function () { navLinks.classList.toggle('open'); });
      navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () { navLinks.classList.remove('open'); });
      });
    }

    // Форма заявки. ВНИМАНИЕ: статический сайт без бэкенда — данные никуда
    // не отправляются автоматически. Подключите серверный обработчик (см. README).
    var form = document.getElementById('leadForm');
    var msg = document.getElementById('formMsg');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = form.name.value.trim();
        var phone = form.phone.value.trim();
        var consent = document.getElementById('consent').checked;
        if (name.length < 2) { alert('Пожалуйста, укажите ваше имя.'); form.name.focus(); return; }
        if (phone.replace(/\D/g, '').length < 10) { alert('Пожалуйста, укажите корректный номер телефона.'); form.phone.focus(); return; }
        if (!consent) { alert('Необходимо согласие на обработку персональных данных.'); return; }
        if (msg) {
          msg.classList.add('ok');
          msg.textContent = 'Спасибо! Заявка принята. Мы перезвоним вам в ближайшее время.';
        }
        form.reset();
      });
    }
  }

  // --- Старт ---
  document.addEventListener('DOMContentLoaded', function () {
    initUI();
    loadContent().then(render);
  });
})();
