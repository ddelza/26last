// 광수 HERO(1·2학년) 퀘스트 페이지 공용 — lab.js 다음에 로드
// 데이터: hero/{반}/h{번호}/...  (자세한 경로는 lab.js 의 "광수 HERO" 주석)
// 입력 보존 원칙: 폴링은 입력칸을 절대 다시 그리지 않는다. 손대지 않은 칸만 새 값으로 바꾸고, 고치던 칸은 "다른 친구가 고쳤어요" 안내만 띄운다.
(function () {
  var H = window.HERO = {};
  var E = function (s) { return LAB.esc(s); };
  H.boot = function (opts) {
    return LAB.start(opts).then(function () { return LAB.resolveMyGroup(); }).then(function (r) {
      return LAB.heroCfg(r.ban).then(function (cfg) { r.cfg = cfg; r.base = r.group ? 'hero/' + r.ban + '/' + r.group.id : null; return r; });
    });
  };
  H.me = function () { return { id: LAB.student.id, name: LAB.student.isTeacher ? LAB.student.name + ' 선생님' : LAB.student.name }; };

  // ---------- 모둠이 함께 쓰는 한 칸 ----------
  // H.field(mount, { path, label, hint, ph, rows, src:function()→문자열(앞 퀘스트에서 가져오기) })
  var fields = [];
  H.field = function (mount, o) {
    var id = 'hf' + fields.length, f = { o: o, id: id, server: null, dirty: false };
    fields.push(f);
    mount.insertAdjacentHTML('beforeend',
      '<div class="hf" id="' + id + '">' + (o.label ? '<label class="field-label" for="' + id + '_t">' + o.label + '</label>' : '') +
      (o.hint ? '<div class="hf-hint">' + o.hint + '</div>' : '') +
      '<div class="notice" id="' + id + '_n"></div>' +
      '<textarea id="' + id + '_t" rows="' + (o.rows || 3) + '" maxlength="' + (o.max || 1000) + '" placeholder="' + LAB.escAttr(o.ph || '') + '"></textarea>' +
      '<div class="hf-row"><button class="btn small" id="' + id + '_s">💾 저장</button>' +
      (o.src ? '<button class="btn small ghost" id="' + id + '_src">⬇ 앞에서 쓴 내용 넣기</button>' : '') +
      '<span class="hf-last" id="' + id + '_l"></span></div>' +
      '<div class="error-msg" id="' + id + '_e"></div></div>');
    var ta = document.getElementById(id + '_t');
    ta.addEventListener('input', function () { f.dirty = ta.value !== ((f.server && f.server.text) || ''); });
    document.getElementById(id + '_s').onclick = function () { saveField(f); };
    if (o.src) document.getElementById(id + '_src').onclick = function () {
      var v = String(o.src() || '').trim();
      if (!v) return alert('아직 앞 퀘스트에 쓴 내용이 없어요.');
      if (ta.value.trim() && !confirm('지금 칸에 쓴 내용 뒤에 붙일까요?')) return;
      ta.value = ta.value.trim() ? ta.value.trim() + '\n' + v : v; f.dirty = true; ta.focus();
    };
    return f;
  };
  function paintField(f, d) {
    var ta = document.getElementById(f.id + '_t'), n = document.getElementById(f.id + '_n'), l = document.getElementById(f.id + '_l');
    var changed = JSON.stringify(d || null) !== JSON.stringify(f.server);
    f.server = d || null;
    if (!f.dirty) { ta.value = (d && d.text) || ''; n.classList.remove('show'); }
    else if (changed && d) { n.innerHTML = '✏️ <b>' + E(d.byName) + '</b>이(가) 방금 이 칸을 저장했어요. 내가 고치던 내용을 저장하면 덮어써요.'; n.classList.add('show'); }
    l.textContent = d && d.text ? '마지막 저장: ' + d.byName + ' · ' + LAB.fmtTime(d.at) : '아직 저장 안 함';
  }
  function saveField(f) {
    var ta = document.getElementById(f.id + '_t'), err = document.getElementById(f.id + '_e'), btn = document.getElementById(f.id + '_s');
    err.classList.remove('show');
    var me = H.me(), text = ta.value.trim();
    btn.disabled = true;
    return LAB.get(f.o.path).then(function (cur) {
      if (cur && f.server && cur.at !== f.server.at && cur.by !== me.id && !confirm(cur.byName + '이(가) 그사이 이 칸을 고쳤어요. 내 내용으로 덮어쓸까요?')) { paintField(f, cur); return; }
      if (cur && !f.server && cur.text && cur.by !== me.id && !confirm(cur.byName + '이(가) 먼저 이 칸을 저장했어요. 내 내용으로 덮어쓸까요?')) { paintField(f, cur); return; }
      var rec = text ? { text: text, by: me.id, byName: me.name, at: LAB.TS } : null;
      return (rec ? LAB.put(f.o.path, rec) : LAB.del(f.o.path)).then(function () { return LAB.get(f.o.path); }).then(function (d) { f.dirty = false; paintField(f, d); if (H.onSaved) H.onSaved(); });
    }).catch(function () { err.textContent = '저장하지 못했어요. 인터넷 연결을 확인해 주세요.'; err.classList.add('show'); })
      .then(function () { btn.disabled = false; });
  }
  H.refreshFields = function () {
    return Promise.all(fields.map(function (f) { return LAB.get(f.o.path).then(function (d) { paintField(f, d); }); }));
  };
  H.fieldText = function (f) { return (document.getElementById(f.id + '_t') || {}).value || ''; };

  // ---------- 모둠 기록 목록 (실천 기록·도움 받은 기록) ----------
  // H.list(mount, { path, cols:[{k,label,ph,short}], empty, title })
  H.list = function (mount, o) {
    var id = 'hl' + Math.random().toString(36).slice(2, 7), L = { o: o, id: id, data: {} };
    mount.insertAdjacentHTML('beforeend', '<div class="hl" id="' + id + '"><div class="hl-items" id="' + id + '_i"></div>' +
      '<div class="hl-form">' + o.cols.map(function (c) {
        return '<label class="field-label">' + c.label + '</label>' + (c.short ? '<input type="text" data-k="' + c.k + '" maxlength="80" placeholder="' + LAB.escAttr(c.ph || '') + '">'
          : '<textarea data-k="' + c.k + '" rows="2" maxlength="600" placeholder="' + LAB.escAttr(c.ph || '') + '"></textarea>');
      }).join('') + '<button class="btn small" id="' + id + '_add">＋ 기록 추가</button><div class="error-msg" id="' + id + '_e"></div></div></div>');
    var form = document.querySelector('#' + id + ' .hl-form');
    document.getElementById(id + '_add').onclick = function () {
      var rec = {}, me = H.me(), any = false;
      form.querySelectorAll('[data-k]').forEach(function (el) { rec[el.dataset.k] = el.value.trim(); if (rec[el.dataset.k]) any = true; });
      var err = document.getElementById(id + '_e');
      if (!any) { err.textContent = '내용을 써 주세요.'; err.classList.add('show'); return; }
      err.classList.remove('show');
      rec.by = me.id; rec.byName = me.name; rec.at = LAB.TS;
      LAB.post(o.path, rec).then(function () { form.querySelectorAll('[data-k]').forEach(function (el) { el.value = ''; }); return L.refresh(); })
        .catch(function () { err.textContent = '저장하지 못했어요.'; err.classList.add('show'); });
    };
    L.refresh = function () {
      return LAB.get(o.path).then(function (d) {
        L.data = d || {};
        var keys = Object.keys(L.data).sort(function (a, b) { return (L.data[a].at || 0) - (L.data[b].at || 0); });
        document.getElementById(id + '_i').innerHTML = keys.length ? keys.map(function (k, i) {
          var x = L.data[k];
          return '<div class="hl-item"><div class="hl-no">' + (i + 1) + '</div><div class="hl-body">' + o.cols.map(function (c) {
            return x[c.k] ? '<div><b>' + c.label.replace(/<[^>]+>/g, '') + '</b> ' + LAB.nl2br(x[c.k]) + '</div>' : '';
          }).join('') + '<div class="dc-muted" style="font-size:0.72rem">' + E(x.byName) + ' · ' + LAB.fmtTime(x.at) +
            (x.by === LAB.student.id || LAB.student.isTeacher ? ' · <a href="javascript:void 0" data-hldel="' + k + '">지우기</a>' : '') + '</div></div></div>';
        }).join('') : '<div class="empty-state" style="padding:10px">' + (o.empty || '아직 기록이 없어요.') + '</div>';
        document.querySelectorAll('#' + id + '_i [data-hldel]').forEach(function (a) {
          a.onclick = function () { if (confirm('이 기록을 지울까요?')) LAB.del(o.path + '/' + a.dataset.hldel).then(L.refresh); };
        });
      });
    };
    L.items = function () { return Object.keys(L.data).sort(function (a, b) { return (L.data[a].at || 0) - (L.data[b].at || 0); }).map(function (k) { return L.data[k]; }); };
    return L;
  };

  // 15초마다 다른 모둠원이 쓴 것 반영 (입력 중인 칸은 건드리지 않음)
  H.poll = function (fn, ms) { setInterval(function () { if (!document.hidden) fn(); }, ms || 15000); };
  H.leaderOk = function (g) { return LAB.student.isTeacher || !g.leader || g.leader === LAB.student.id; };
})();
