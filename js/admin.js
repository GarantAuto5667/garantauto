// ГарантАвто — админ-панель. Управление контентом сайта без программиста.
(function () {
  'use strict';

  var KEY = 'garantavto_content';
  var data = {};

  // ---------- Утилиты ----------
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function getPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return (o == null ? undefined : o[k]); }, obj);
  }
  function setPath(obj, path, val) {
    var parts = path.split('.'), last = parts.pop();
    var t = parts.reduce(function (o, k) { if (o[k] == null) o[k] = {}; return o[k]; }, obj);
    t[last] = val;
  }

  function saveDraft(showToast) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      setStatus('Черновик сохранён', true);
      if (showToast) toast('Сохранено');
    } catch (e) {
      setStatus('Не удалось сохранить (мало места?)', false);
    }
  }

  function setStatus(msg, saved) {
    var s = document.getElementById('status');
    s.textContent = msg;
    s.className = 'status' + (saved ? ' saved' : '');
  }
  var toastTimer;
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 1600);
  }

  // Уменьшение и сжатие изображения перед сохранением (чтобы content.json был лёгким)
  function processImage(file, cb) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var maxW = 1400;
        var scale = Math.min(1, maxW / img.width);
        var w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        try { cb(canvas.toDataURL('image/jpeg', 0.82)); }
        catch (err) { cb(e.target.result); } // запасной вариант — оригинал
      };
      img.onerror = function () { cb(e.target.result); };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ---------- Привязка простых полей ----------
  function bindFields() {
    document.querySelectorAll('[data-path]').forEach(function (input) {
      var path = input.getAttribute('data-path');
      var val = getPath(data, path);
      input.value = val == null ? '' : val;
      input.addEventListener('input', function () {
        setPath(data, path, input.value);
        saveDraft(false);
      });
    });

    // Загрузка изображений (hero, about)
    document.querySelectorAll('input[data-img]').forEach(function (input) {
      var path = input.getAttribute('data-img');
      input.addEventListener('change', function () {
        if (!input.files || !input.files[0]) return;
        processImage(input.files[0], function (dataUrl) {
          setPath(data, path, dataUrl);
          refreshPreviews();
          saveDraft(true);
        });
      });
    });
  }

  function refreshPreviews() {
    var hero = getPath(data, 'hero.image');
    var about = getPath(data, 'about.image');
    if (hero) document.getElementById('prev_hero').src = hero;
    if (about) document.getElementById('prev_about').src = about;
  }

  // ---------- Преимущества ----------
  function renderFeatures() {
    var box = document.getElementById('featuresList');
    box.innerHTML = '';
    (data.about.features || []).forEach(function (f, i) {
      var item = document.createElement('div');
      item.className = 'row-item';
      item.appendChild(rowHead('Преимущество ' + (i + 1), function () {
        data.about.features.splice(i, 1); renderFeatures(); saveDraft(true);
      }));
      item.appendChild(labeledInput('Заголовок', f.title, function (v) { f.title = v; saveDraft(false); }));
      item.appendChild(labeledTextarea('Текст', f.text, function (v) { f.text = v; saveDraft(false); }));
      box.appendChild(item);
    });
  }

  // ---------- Услуги ----------
  function renderServices() {
    var box = document.getElementById('servicesList');
    box.innerHTML = '';
    (data.services || []).forEach(function (s, i) {
      var item = document.createElement('div');
      item.className = 'row-item';
      item.appendChild(rowHead('Услуга ' + (i + 1), function () {
        data.services.splice(i, 1); renderServices(); saveDraft(true);
      }));
      item.appendChild(labeledInput('Название', s.title, function (v) { s.title = v; saveDraft(false); }));
      item.appendChild(labeledTextarea('Описание', s.desc, function (v) { s.desc = v; saveDraft(false); }));
      item.appendChild(labeledInput('Цена (например «от 12 000 ₽» или «по запросу»)', s.price, function (v) { s.price = v; saveDraft(false); }));
      box.appendChild(item);
    });
  }

  // ---------- Галерея ----------
  function renderGallery() {
    var box = document.getElementById('galleryList');
    box.innerHTML = '';
    (data.gallery || []).forEach(function (g, i) {
      var item = document.createElement('div');
      item.className = 'row-item';
      item.appendChild(rowHead('Фото ' + (i + 1), function () {
        data.gallery.splice(i, 1); renderGallery(); saveDraft(true);
      }));

      var imgField = document.createElement('div');
      imgField.className = 'img-field';
      var prev = document.createElement('img');
      prev.className = 'img-prev';
      if (g.image) prev.src = g.image;
      imgField.appendChild(prev);

      var fileBtn = document.createElement('button');
      fileBtn.className = 'btn btn-line btn-sm file-btn';
      fileBtn.textContent = 'Выбрать фото';
      var fileInput = document.createElement('input');
      fileInput.type = 'file'; fileInput.accept = 'image/*';
      fileInput.addEventListener('change', function () {
        if (!fileInput.files || !fileInput.files[0]) return;
        processImage(fileInput.files[0], function (dataUrl) {
          g.image = dataUrl; prev.src = dataUrl; saveDraft(true);
        });
      });
      fileBtn.appendChild(fileInput);
      imgField.appendChild(fileBtn);
      item.appendChild(imgField);

      item.appendChild(labeledInput('Подпись под фото', g.caption, function (v) { g.caption = v; saveDraft(false); }));
      box.appendChild(item);
    });
  }

  // ---------- Отзывы ----------
  function renderReviews() {
    var box = document.getElementById('reviewsList');
    box.innerHTML = '';
    (data.reviews || []).forEach(function (r, i) {
      var item = document.createElement('div');
      item.className = 'row-item';
      item.appendChild(rowHead('Отзыв ' + (i + 1), function () {
        data.reviews.splice(i, 1); renderReviews(); saveDraft(true);
      }));
      item.appendChild(labeledTextarea('Текст отзыва', r.text, function (v) { r.text = v; saveDraft(false); }));
      item.appendChild(labeledInput('Имя', r.name, function (v) {
        r.name = v; r.initial = (v || '?').charAt(0); saveDraft(false);
      }));
      item.appendChild(labeledInput('Подпись (например «Клиент»)', r.role, function (v) { r.role = v; saveDraft(false); }));
      box.appendChild(item);
    });
  }

  // ---------- Списки текстом (виды работ, марки) ----------
  function bindListArea(areaId, key) {
    var area = document.getElementById(areaId);
    area.value = (data[key] || []).join('\n');
    area.addEventListener('input', function () {
      data[key] = area.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      saveDraft(false);
    });
  }

  // ---------- Конструкторы элементов ----------
  function rowHead(title, onRemove) {
    var head = document.createElement('div');
    head.className = 'row-head';
    var b = document.createElement('b'); b.textContent = title;
    var del = document.createElement('button');
    del.className = 'btn btn-danger btn-sm'; del.textContent = '✕ Удалить';
    del.addEventListener('click', onRemove);
    head.appendChild(b); head.appendChild(del);
    return head;
  }
  function labeledInput(labelText, value, onInput) {
    var l = document.createElement('label'); l.className = 'f';
    var s = document.createElement('span'); s.textContent = labelText;
    var inp = document.createElement('input'); inp.type = 'text'; inp.value = value == null ? '' : value;
    inp.addEventListener('input', function () { onInput(inp.value); });
    l.appendChild(s); l.appendChild(inp); return l;
  }
  function labeledTextarea(labelText, value, onInput) {
    var l = document.createElement('label'); l.className = 'f';
    var s = document.createElement('span'); s.textContent = labelText;
    var ta = document.createElement('textarea'); ta.value = value == null ? '' : value;
    ta.addEventListener('input', function () { onInput(ta.value); });
    l.appendChild(s); l.appendChild(ta); return l;
  }

  // ---------- Действия ----------
  function publish() {
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'content.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('Файл content.json скачан. Загрузите его на хостинг в папку сайта.');
  }

  function preview() {
    saveDraft(false);
    window.open('index.html?preview=1', '_blank');
  }

  function doImport(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var obj = JSON.parse(e.target.result);
        data = mergeDefaults(obj);
        rebuildAll();
        saveDraft(true);
        toast('Файл загружен');
      } catch (err) { alert('Не удалось прочитать файл. Убедитесь, что это content.json.'); }
    };
    reader.readAsText(file);
  }

  function resetAll() {
    if (!confirm('Сбросить все изменения и вернуть исходный контент? Это действие нельзя отменить.')) return;
    data = clone(window.DEFAULT_CONTENT);
    rebuildAll();
    saveDraft(true);
    toast('Сброшено к исходному');
  }

  // Дополняем недостающие поля из значений по умолчанию (на случай старого файла)
  function mergeDefaults(obj) {
    var d = clone(window.DEFAULT_CONTENT);
    function merge(base, over) {
      if (Array.isArray(over)) return over.slice();
      if (over && typeof over === 'object') {
        var out = Object.assign({}, base);
        Object.keys(over).forEach(function (k) { out[k] = merge(base ? base[k] : undefined, over[k]); });
        return out;
      }
      return over === undefined ? base : over;
    }
    return merge(d, obj || {});
  }

  function rebuildAll() {
    // простые поля
    document.querySelectorAll('[data-path]').forEach(function (input) {
      var val = getPath(data, input.getAttribute('data-path'));
      input.value = val == null ? '' : val;
    });
    refreshPreviews();
    renderFeatures();
    renderServices();
    renderGallery();
    renderReviews();
    document.getElementById('worksArea').value = (data.works || []).join('\n');
    document.getElementById('brandsArea').value = (data.brands || []).join('\n');
  }

  // ---------- Инициализация ----------
  function init(loaded) {
    data = mergeDefaults(loaded);
    bindFields();
    refreshPreviews();
    renderFeatures();
    renderServices();
    renderGallery();
    renderReviews();
    bindListArea('worksArea', 'works');
    bindListArea('brandsArea', 'brands');

    // Кнопки
    document.getElementById('btnPublish').addEventListener('click', publish);
    document.getElementById('btnPublish2').addEventListener('click', publish);
    document.getElementById('btnPreview').addEventListener('click', preview);
    document.getElementById('btnPreview2').addEventListener('click', preview);
    document.getElementById('btnReset').addEventListener('click', resetAll);
    document.getElementById('addService').addEventListener('click', function () {
      data.services.push({ title: 'Новая услуга', desc: 'Описание услуги', price: 'по запросу' });
      renderServices(); saveDraft(true);
    });
    document.getElementById('addGallery').addEventListener('click', function () {
      data.gallery.push({ image: '', caption: 'Подпись' });
      renderGallery(); saveDraft(true);
    });
    document.getElementById('addReview').addEventListener('click', function () {
      data.reviews.push({ text: 'Текст отзыва', name: 'Имя', role: 'Клиент', initial: 'И' });
      renderReviews(); saveDraft(true);
    });

    var importBtn = document.getElementById('btnImport');
    var importFile = document.getElementById('importFile');
    importBtn.addEventListener('click', function () { importFile.click(); });
    importFile.addEventListener('change', function () {
      if (importFile.files && importFile.files[0]) doImport(importFile.files[0]);
      importFile.value = '';
    });

    setStatus('Готово к работе', true);
  }

  // Загружаем: черновик из этого браузера → иначе опубликованный content.json → иначе значения по умолчанию
  document.addEventListener('DOMContentLoaded', function () {
    var draft = null;
    try { draft = localStorage.getItem(KEY); } catch (e) {}
    if (draft) {
      try { init(JSON.parse(draft)); return; } catch (e) {}
    }
    fetch('content.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (json) { init(json || window.DEFAULT_CONTENT); })
      .catch(function () { init(window.DEFAULT_CONTENT); });
  });
})();
