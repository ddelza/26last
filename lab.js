// 2026 3학년 학기말 프로젝트 — 공용 라이브러리 (session.js 다음에 로드)
// cell-genetics/cg.js(→digital-citizen/dc.js) 패턴을 이어받았다. Firebase RTDB REST, 빌드 없음.
//
// 데이터 경로: years/{year}/last26/...
//   problems/{반}/{학번}            = { id, name, num, cat, title, story, who, updatedAt }   1단계 내 삶의 문제 (한 사람 한 개)
//   likes/{반}/{글쓴이}/{누른 사람}  = true
//   comments/{반}/{글쓴이}/{pushKey} = { id, name, text, ts }
//   pick/{반}/_config               = { topics:[글쓴이 학번 ×5], open, cap(기본 5) }   교사가 선정·선착순 시작
//   pick/{반}/{학번}                = { topic, name, num, ts }   (제안자는 자기 문제에 자동 고정 — 기록 없음)
//   q/{반}/{모둠}/{학번}            = { survey:{질문}, solution:{질문}, updatedAt }   2단계 개인 질문 초안
//   final/{반}/{모둠}/survey|solution = { ...질문, by, byName, at }   모둠 최종 질문
//   final/{반}/{모둠}/out           = { which, reason, show, note, hasImg, q, no, title, story, submitted, by, byName, at }
//   img/{반}/{모둠}                 = dataURL (작게 줄인 jpg)
//   survey/_config                  = { open, results }   (전교 공통)
//   resp/{학번}                     = { grade, ban, answers:{ '반_모둠': 답 }, done, updatedAt }
//   report/{반}/{모둠}/{칸}         = { text, by, byName, at }
//   contrib/{반}/{모둠}/{학번}      = { text, name, at }
//   poster/{반}/{모둠}              = { link, title, by, byName, at }
//   ({모둠} = 그 문제를 제안한 학생의 학번 — cg/sr-exhibition의 topicId와 같은 발상)
//
// 질문 형태 q = { q:'질문', type:'choice'|'open', options:['보기',...], multi:bool, etc:bool }
// 설문 답 = 객관식 { sel:[보기 번호...], etc:'기타 내용' } / 주관식 '문자열'
(function () {
  var DB_URL = 'https://gwangsu-on-default-rtdb.firebaseio.com';
  var ROOT = 'last26';
  var TEACHER_BAN = 'T';
  var LAB = window.LAB = { DB_URL: DB_URL, ROOT: ROOT, cfg: null, student: null };

  // ★ 프로젝트 이름(가칭) — 여기만 바꾸면 모든 페이지 제목이 바뀐다
  LAB.NAME = '물음표에서 느낌표로';
  LAB.SUB = '광수중 3학년 학기말 프로젝트 · 우리 삶의 문제, 우리가 푼다';
  LAB.ICON = '❓❗';

  LAB.STAGES = [
    { no: 1, icon: '🔍', name: '문제 찾기', color: '#f76707', soft: '#fff4e6',
      goal: '내 삶에서 진짜 문제를 찾아 올리고, 친구들이 가장 공감한 문제 5개로 모둠을 만들어요.',
      pages: [{ href: 's1-board.html', label: '① 내 삶의 문제 올리고 공감 나누기' }, { href: 's1-pick.html', label: '② 모둠 정하기 (선착순 신청)' }] },
    { no: 2, icon: '🎯', name: '질문 다듬기', color: '#1c7ed6', soft: '#e7f5ff',
      goal: '전교생에게 물어볼 질문을 각자 만들고, 모둠 토의로 딱 하나를 골라 설문에 내보내요.',
      pages: [{ href: 's2-question.html', label: '설문 질문 만들기 → 하나 골라 내보내기' }] },
    { no: 3, icon: '📡', name: '광수에게 묻다', color: '#0ca678', soft: '#e6fcf5',
      goal: '전교생이 25개 질문에 답해요. 그다음 우리 모둠 질문에 어떤 답이 모였는지 확인해요.',
      pages: [{ href: 'survey.html', label: '① 전교생 설문 참여하기' }, { href: 's3-result.html', label: '② 설문 결과 확인하기' }] },
    { no: 4, icon: '❗', name: '해결하고 퍼뜨리기', color: '#d6336c', soft: '#fff0f6',
      goal: '데이터로 실태를 밝히고 실현 가능한 해결 방안을 보고서로 써요. 캔바 포스터로 학교에 퍼뜨려요.',
      pages: [{ href: 's4-report.html', label: '① 보고서 쓰기 (실태 파악 · 해결 방안)' }, { href: 's4-poster.html', label: '② 캔바 포스터 만들고 퍼뜨리기' }] },
  ];

  LAB.CATS = [
    { id: 'school', icon: '🏫', name: '우리 학교 속 문제', desc: '선생님은 잘 모르지만 학생들은 다 아는 우리 학교의 문제',
      ex: ['쉬는 시간 10분 동안 화장실·매점 줄이 너무 길어요', '급식 잔반이 많은데 왜 남기는지 아무도 안 물어봐요'] },
    { id: 'daily', icon: '🙋', name: '나와 친구들의 일상', desc: '내가 지금 겪고 있고, 친구들도 겪고 있을 것 같은 문제',
      ex: ['밤에 폰 보다가 늦게 자서 아침마다 너무 피곤해요', '고민이 있어도 털어놓을 곳이 마땅치 않아요'] },
    { id: 'future', icon: '🔮', name: '우리 세대의 미래', desc: '2011년생인 우리가 고등학생·대학생·어른이 되면 겪게 될 문제',
      ex: ['AI가 일자리를 바꾸면 우리는 무엇을 준비해야 하지?', '고등학교·진로를 정보 없이 고르는 것 같아요'] },
    { id: 'town', icon: '🏘️', name: '우리 동네 속초', desc: '우리가 사는 지역(속초·고성·양양)에서 겪는 문제',
      ex: ['청소년이 마음 편히 갈 만한 곳이 없어요', '버스가 자주 안 와서 학원·약속에 늦어요'] },
    { id: 'digital', icon: '📱', name: '디지털·온라인 세상', desc: 'SNS·게임·숏폼·가짜뉴스·개인정보·AI처럼 화면 속에서 생기는 문제',
      ex: ['단톡방에서 생기는 말다툼과 따돌림', '숏폼만 보다 보니 긴 글이 안 읽혀요'] },
    { id: 'earth', icon: '🌏', name: '지구와 사회', desc: '기후 위기·환경·차별·안전처럼 모두가 함께 풀어야 하는 문제',
      ex: ['여름마다 교실이 너무 더워 공부가 안 돼요', '일회용 컵·페트병 쓰레기, 우리 학교만 해도 얼마나 될까?'] },
    { id: 'etc', icon: '✨', name: '그 밖의 문제', desc: '위 어디에도 딱 맞지 않지만 꼭 다루고 싶은 문제', ex: [] },
  ];
  LAB.cat = function (id) { return LAB.CATS.filter(function (c) { return c.id === id; })[0] || LAB.CATS[LAB.CATS.length - 1]; };

  LAB.QTYPES = {
    survey: { icon: '📊', name: '실태 조사 질문', short: '실태 조사',
      desc: '이 문제가 <b>지금 실제로 얼마나, 누구에게, 어떻게</b> 일어나고 있는지 알아보는 질문이에요. "진짜 문제가 맞나? 얼마나 심각하지?"를 숫자로 확인할 수 있어요.',
      ex: '예) 평일에 잠드는 시각은 보통 언제인가요? / 지난 한 달 동안 단톡방에서 불편한 일을 겪은 적이 있나요?' },
    solution: { icon: '💡', name: '해법 탐색 질문', short: '해법 탐색',
      desc: '이 문제를 <b>어떻게 풀면 좋을지, 사람들이 어떤 해결책을 원하고 실제로 따라 줄지</b> 알아보는 질문이에요. 우리 해결 방안이 "먹힐지" 미리 확인할 수 있어요.',
      ex: '예) 잠자기 1시간 전 휴대폰 끄기 챌린지가 있다면 참여할 생각이 있나요? / 쉬는 시간 줄을 줄이려면 무엇이 가장 도움이 될까요?' },
  };
  LAB.SHOWS = {
    q: { icon: '❓', name: '질문만 보여 주기', desc: '응답자는 질문만 봐요. 문제를 미리 알려 주지 않아 솔직한 답을 받을 수 있어요.' },
    problem: { icon: '📌', name: '우리 문제 + 질문', desc: '우리 모둠이 고른 문제를 함께 보여 줘요. 왜 묻는지 알고 답할 수 있어요.' },
    full: { icon: '🖼️', name: '문제 + 질문 + 보충 설명·사진', desc: '설명 글이나 사진까지 붙여요. 상황을 잘 모르는 1·2학년도 이해하기 쉬워요.' },
  };

  // ---------- 유틸 ----------
  LAB.esc = function (s) { if (s === undefined || s === null) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  LAB.escAttr = function (s) { return LAB.esc(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;'); };
  LAB.nl2br = function (s) { return LAB.esc(s).replace(/\n/g, '<br>'); };
  LAB.fmtTime = function (ts) {
    if (!ts) return ''; var d = new Date(ts);
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
  };
  LAB.circled = function (i) { return '①②③④⑤⑥⑦⑧⑨⑩'.charAt(i) || (i + 1) + '.'; };
  LAB.qs = function (k) { return new URLSearchParams(location.search).get(k); };

  // ---------- Firebase REST ----------
  LAB.url = function (p) {
    var q = '', i = p.indexOf('?');
    if (i >= 0) { q = p.slice(i); p = p.slice(0, i); }
    return DB_URL + '/years/' + LAB.cfg.year + '/' + ROOT + '/' + p + '.json' + q;
  };
  function jfetch(p, opt) {
    return fetch(LAB.url(p), opt).then(function (r) { if (!r.ok) throw new Error(opt ? '저장 실패' : '불러오기 실패'); return r.json(); });
  }
  LAB.get = function (p) { return jfetch(p); };
  LAB.put = function (p, v) { return jfetch(p, { method: 'PUT', body: JSON.stringify(v) }); };
  LAB.patch = function (p, v) { return jfetch(p, { method: 'PATCH', body: JSON.stringify(v) }); };
  LAB.post = function (p, v) { return jfetch(p, { method: 'POST', body: JSON.stringify(v) }); };
  LAB.del = function (p) { return fetch(LAB.url(p), { method: 'DELETE' }); };
  LAB.TS = { '.sv': 'timestamp' };

  // 실시간 감시(EventSource). ⚠️ 브라우저 전체에서 같은 서버 연결은 6개까지 — 페이지당 1개만 쓸 것.
  // 탭이 안 보이면 연결을 끊고, 다시 보이면 재연결하면서 한 번 새로 불러온다.
  LAB.listen = function (p, onChange) {
    if (!window.EventSource) return null;
    var es = null, t = null, closed = false;
    var fire = function () { clearTimeout(t); t = setTimeout(onChange, 150); };
    function open() { if (es || closed) return; es = new EventSource(LAB.url(p)); es.addEventListener('put', fire); es.addEventListener('patch', fire); }
    function shut() { if (es) { es.close(); es = null; } }
    function onVis() { if (closed) return; if (document.hidden) shut(); else if (!es) { open(); fire(); } }
    document.addEventListener('visibilitychange', onVis);
    if (!document.hidden) open();
    return { close: function () { closed = true; shut(); document.removeEventListener('visibilitychange', onVis); } };
  };
  LAB.slowGuard = function (ms) {
    var timer = setTimeout(function () {
      if (document.getElementById('lab-slow')) return;
      var d = document.createElement('div'); d.id = 'lab-slow'; d.className = 'lab-slow';
      d.innerHTML = '⏳ <b>불러오기가 늦어지고 있어요.</b><br>이 사이트를 연 <b>다른 탭이나 창이 많으면</b> 멈출 수 있어요. 안 쓰는 탭을 닫고 <a href="javascript:location.reload()">새로고침</a>해 주세요.';
      document.body.appendChild(d);
    }, ms || 6000);
    return function () { clearTimeout(timer); var d = document.getElementById('lab-slow'); if (d) d.remove(); };
  };

  // ---------- 반 ----------
  LAB.myBan = function () {
    var s = LAB.student;
    if (s.isTeacher) return LAB.qs('ban') || TEACHER_BAN; // 교사는 ?ban=3-2 로 그 반 학생 화면을 볼 수 있다
    return s.grade + '-' + s.ban;
  };
  LAB.TEACHER_BAN = TEACHER_BAN;
  LAB.banLabel = function (b) { if (b === TEACHER_BAN) return '교사 테스트'; var p = String(b).split('-'); return p.length === 2 ? p[0] + '학년 ' + p[1] + '반' : b; };
  LAB.banShort = function (b) { if (b === TEACHER_BAN) return '교사'; var p = String(b).split('-'); return p.length === 2 ? p[0] + '-' + p[1] + '반' : b; };
  var rosterP = null;
  LAB.roster = function () {
    if (!rosterP) rosterP = fetch(DB_URL + '/years/' + LAB.cfg.year + '/students.json').then(function (r) { return r.json(); }).then(function (d) { return d || {}; });
    return rosterP;
  };
  LAB.classRoster = function (ban) {
    return LAB.roster().then(function (all) {
      var p = String(ban).split('-');
      return Object.keys(all).filter(function (k) { return String(all[k].grade) === p[0] && String(all[k].ban) === p[1]; })
        .map(function (k) { return Object.assign({ id: k }, all[k]); }).sort(function (a, b) { return a.num - b.num; });
    });
  };
  LAB.BANS = ['3-1', '3-2', '3-3', '3-4', '3-5'];

  // ---------- 모둠 ----------
  // 모둠 = 교사가 고른 문제(제안자 학번). 모둠원 = 제안자(고정) + 선착순 신청자(서버 시각 순)
  LAB.buildGroups = function (pickAll, problems) {
    var picks = Object.assign({}, pickAll || {}); var conf = picks._config || {}; delete picks._config;
    problems = problems || {};
    var topics = []; var t = conf.topics || [];
    Object.keys(t).sort(function (a, b) { return a - b; }).forEach(function (k) { if (t[k]) topics.push(t[k]); });
    var groups = topics.map(function (tid, i) {
      var pr = problems[tid] || {};
      var list = Object.keys(picks).map(function (k) { return Object.assign({ id: k }, picks[k]); })
        .filter(function (p) { return p.topic === tid && p.id !== tid; })
        .sort(function (a, b) { return (a.ts - b.ts) || String(a.id).localeCompare(String(b.id)); });
      return { id: tid, no: i + 1, title: pr.title || '(삭제된 문제)', cat: pr.cat, story: pr.story, who: pr.who,
        members: [{ id: tid, name: pr.name, num: pr.num, proposer: true }].concat(list) };
    });
    return { conf: conf, picks: picks, problems: problems, groups: groups, cap: conf.cap || 5 };
  };
  LAB.loadGroups = function (ban) {
    return Promise.all([LAB.get('pick/' + ban), LAB.get('problems/' + ban)]).then(function (r) { return LAB.buildGroups(r[0], r[1]); });
  };
  LAB.groupOf = function (data, sid) {
    return data.groups.filter(function (g) { return g.members.some(function (m) { return m.id === sid; }); })[0] || null;
  };
  LAB.groupName = function (g) { return g.no + '모둠 · ' + g.title; };
  // 학생 페이지에서 "내 모둠" 찾기. 교사는 ?ban=..&g=학번 으로 아무 모둠이나 볼 수 있다(없으면 첫 모둠).
  LAB.resolveMyGroup = function () {
    var ban = LAB.myBan();
    return LAB.loadGroups(ban).then(function (data) {
      var g = null;
      if (LAB.student.isTeacher) {
        var gq = LAB.qs('g');
        g = data.groups.filter(function (x) { return x.id === gq; })[0] || data.groups[0] || null;
      } else g = LAB.groupOf(data, LAB.student.id);
      return { ban: ban, data: data, group: g };
    });
  };
  LAB.groupBannerHtml = function (g, ban) {
    var c = LAB.cat(g.cat);
    return '<div class="grp-banner"><div class="grp-no">' + g.no + '모둠</div><div class="grp-txt">' +
      '<div class="grp-cat">' + c.icon + ' ' + LAB.esc(c.name) + (LAB.student.isTeacher ? ' · ' + LAB.esc(LAB.banLabel(ban)) : '') + '</div>' +
      '<div class="grp-title">' + LAB.esc(g.title) + '</div>' +
      '<div class="grp-mem">' + g.members.map(function (m) {
        return '<span class="' + (m.id === LAB.student.id ? 'me' : '') + '">' + (m.proposer ? '📌' : '') + LAB.esc(m.name || m.id) + '</span>';
      }).join(' · ') + '</div></div></div>';
  };
  LAB.noGroupHtml = function () {
    return '<div class="card center"><div style="font-size:2rem">🧭</div><b>아직 모둠이 정해지지 않았어요.</b>' +
      '<p class="hint" style="margin-top:6px">1단계 <a href="s1-pick.html">② 모둠 정하기</a>에서 먼저 모둠을 신청해 주세요.<br>신청을 못 했다면 선생님께 말씀드려요.</p></div>';
  };
  // 교사용: 반·모둠 바꿔 보기 바
  LAB.teacherPickerHtml = function (ban, data, g) {
    if (!LAB.student.isTeacher) return '';
    return '<div class="t-bar">👩‍🏫 교사 보기 · <select onchange="location.search=\'?ban=\'+this.value">' +
      ['T'].concat(LAB.BANS).map(function (b) { return '<option value="' + b + '"' + (b === ban ? ' selected' : '') + '>' + LAB.banLabel(b) + '</option>'; }).join('') +
      '</select>' + (data && data.groups.length ? ' <select onchange="location.search=\'?ban=' + ban + '&g=\'+this.value">' +
        data.groups.map(function (x) { return '<option value="' + x.id + '"' + (g && x.id === g.id ? ' selected' : '') + '>' + x.no + '모둠</option>'; }).join('') + '</select>' : '') + '</div>';
  };

  // ---------- 페이지 시작 ----------
  LAB.start = function (opts) {
    opts = opts || {};
    if (opts.needLogin !== false) {
      LAB.student = window.requireSrLogin();
      if (!LAB.student) return new Promise(function () {});
    }
    var done = LAB.slowGuard(6000);
    return fetch(DB_URL + '/config/current.json').then(function (r) { return r.json(); }).then(function (cfg) {
      done();
      LAB.cfg = cfg || { year: new Date().getFullYear(), sem: 2 };
      document.title = (opts.title ? opts.title + ' · ' : '') + LAB.NAME;
      var head = document.getElementById('lab-head');
      var st = opts.stage ? LAB.STAGES[opts.stage - 1] : null;
      if (st) document.documentElement.style.setProperty('--stage', st.color), document.documentElement.style.setProperty('--stage-soft', st.soft);
      if (head) {
        head.innerHTML =
          '<div class="topline"><a href="index.html">' + LAB.ICON + ' ' + LAB.esc(LAB.NAME) + '</a>' +
          (LAB.student ? '<span>' + LAB.esc(window.srWhoLabel(LAB.student)) + '</span>' : '') + '</div>' +
          (st ? '<div class="stage-tag">' + st.no + '단계 · ' + st.icon + ' ' + LAB.esc(st.name) + '</div>' : '') +
          '<h1 class="page-title">' + LAB.esc(opts.title || LAB.NAME) + '</h1>' +
          (opts.subtitle ? '<p class="page-sub">' + opts.subtitle + '</p>' : '');
      }
      return LAB.cfg;
    });
  };

  // ---------- 질문 편집기 ----------
  var qeSeq = 0;
  function normQ(v) {
    v = v || {};
    return { q: v.q || '', type: v.type === 'open' ? 'open' : 'choice', options: (v.options && v.options.length ? v.options.slice() : ['', '']),
      multi: !!v.multi, etc: !!v.etc };
  }
  LAB.cleanQ = function (v) {
    v = normQ(v);
    var o = { q: v.q.trim(), type: v.type };
    if (v.type === 'choice') { o.options = v.options.map(function (x) { return String(x || '').trim(); }).filter(Boolean); o.multi = v.multi; o.etc = v.etc; }
    return o;
  };
  LAB.checkQ = function (v) {
    v = LAB.cleanQ(v);
    if (!v.q) return '질문을 써 주세요.';
    if (v.type === 'choice' && v.options.length < 2) return '객관식은 보기가 2개 이상 있어야 해요.';
    return '';
  };
  LAB.qEditor = function (root, val, opts) {
    opts = opts || {};
    var uid = 'qe' + (++qeSeq), st = normQ(val);
    function readDom() {
      var t = root.querySelector('.qe-q'); if (!t) return;
      st.q = t.value;
      var r = root.querySelector('input[name="' + uid + '"]:checked'); st.type = r ? r.value : 'choice';
      var ops = root.querySelectorAll('.qe-opt input');
      if (ops.length) st.options = Array.prototype.map.call(ops, function (e) { return e.value; });
      var m = root.querySelector('.qe-multi'); if (m) st.multi = m.checked;
      var e = root.querySelector('.qe-etc'); if (e) st.etc = e.checked;
    }
    function draw(focusIdx) {
      var h = '<textarea class="qe-q" rows="2" placeholder="' + LAB.escAttr(opts.placeholder || '전교생에게 물어볼 질문을 써요') + '">' + LAB.esc(st.q) + '</textarea>' +
        '<div class="qe-type">' +
        '<label class="chip"><input type="radio" name="' + uid + '" value="choice"' + (st.type === 'choice' ? ' checked' : '') + '><span>☑️ 객관식 (보기 중에 고르기)</span></label>' +
        '<label class="chip"><input type="radio" name="' + uid + '" value="open"' + (st.type === 'open' ? ' checked' : '') + '><span>✍️ 주관식 (직접 쓰기)</span></label></div>';
      if (st.type === 'choice') {
        h += '<div class="qe-opts">' + st.options.map(function (o, i) {
          return '<div class="qe-opt"><span class="n">' + LAB.circled(i) + '</span><input type="text" value="' + LAB.escAttr(o) + '" placeholder="보기 ' + (i + 1) + '">' +
            (st.options.length > 2 ? '<button type="button" data-rm="' + i + '" title="이 보기 지우기">✕</button>' : '') + '</div>';
        }).join('') +
          (st.options.length < 8 ? '<button type="button" class="qe-add" data-add="1">＋ 보기 추가</button>' : '') + '</div>' +
          '<div class="qe-flags"><label><input type="checkbox" class="qe-multi"' + (st.multi ? ' checked' : '') + '> 여러 개 고를 수 있게</label>' +
          '<label><input type="checkbox" class="qe-etc"' + (st.etc ? ' checked' : '') + '> 맨 끝에 "기타(직접 쓰기)" 넣기</label></div>';
      } else {
        h += '<div class="hint" style="margin:6px 0 0">✍️ 응답자가 자유롭게 글로 답해요. 생생한 이유·경험을 모을 수 있지만, 숫자로 정리하기는 어려워요.</div>';
      }
      root.innerHTML = h;
      if (focusIdx !== undefined) { var ins = root.querySelectorAll('.qe-opt input'); if (ins[focusIdx]) ins[focusIdx].focus(); }
    }
    root.addEventListener('click', function (e) {
      var rm = e.target.closest('[data-rm]'), add = e.target.closest('[data-add]');
      if (!rm && !add) return;
      readDom();
      if (rm) st.options.splice(+rm.dataset.rm, 1);
      if (add) st.options.push('');
      draw(add ? st.options.length - 1 : undefined);
      if (opts.onInput) opts.onInput();
    });
    root.addEventListener('change', function (e) {
      if (e.target.name === uid) { readDom(); draw(); }
      if (opts.onInput) opts.onInput();
    });
    root.addEventListener('input', function () { if (opts.onInput) opts.onInput(); });
    draw();
    return {
      get: function () { readDom(); return LAB.cleanQ(st); },
      set: function (v) { st = normQ(v); draw(); },
    };
  };
  // 질문 미리보기 (읽기 전용)
  LAB.qViewHtml = function (v, small) {
    if (!v || !v.q) return '<div class="dc-muted">(아직 없음)</div>';
    var h = '<div class="qv' + (small ? ' small' : '') + '"><div class="qv-q">' + LAB.nl2br(v.q) + '</div>';
    if (v.type === 'choice') {
      h += '<div class="qv-meta">☑️ 객관식' + (v.multi ? ' · 여러 개 선택' : '') + '</div><ol class="qv-opts">' +
        (v.options || []).map(function (o) { return '<li>' + LAB.esc(o) + '</li>'; }).join('') + (v.etc ? '<li class="etc">기타(직접 쓰기)</li>' : '') + '</ol>';
    } else h += '<div class="qv-meta">✍️ 주관식</div>';
    return h + '</div>';
  };

  // ---------- 설문 ----------
  LAB.qkey = function (ban, g) { return ban + '_' + g; };
  // final 전체 → 설문 문항 목록 (반 → 모둠 번호 순). 교사 테스트 반(T)은 includeTest일 때만.
  LAB.surveyItems = function (finalAll, includeTest) {
    var out = [];
    Object.keys(finalAll || {}).sort().forEach(function (ban) {
      if (ban === TEACHER_BAN && !includeTest) return;
      var bg = finalAll[ban] || {};
      Object.keys(bg).forEach(function (g) {
        var o = bg[g] && bg[g].out;
        if (o && o.submitted && o.q) out.push({ key: LAB.qkey(ban, g), ban: ban, g: g, out: o, q: o.q });
      });
    });
    out.sort(function (a, b) { return a.ban.localeCompare(b.ban) || ((a.out.no || 0) - (b.out.no || 0)); });
    return out;
  };
  LAB.isAnswered = function (q, a) {
    if (a === undefined || a === null) return false;
    if (q.type === 'open') return String(a).trim() !== '';
    return !!((a.sel && a.sel.length) || (a.etc && String(a.etc).trim()));
  };
  LAB.tally = function (q, resps, key, grade) {
    var r = { n: 0, byGrade: { 1: 0, 2: 0, 3: 0 }, counts: (q.options || []).map(function () { return 0; }), etcN: 0, texts: [] };
    Object.keys(resps || {}).forEach(function (sid) {
      var rp = resps[sid]; if (!rp || !rp.answers) return;
      var a = rp.answers[key];
      if (!LAB.isAnswered(q, a)) return;
      if (grade && String(rp.grade) !== String(grade)) return;
      r.n++; r.byGrade[rp.grade] = (r.byGrade[rp.grade] || 0) + 1;
      if (q.type === 'open') r.texts.push({ grade: rp.grade, text: String(a).trim() });
      else {
        (a.sel || []).forEach(function (i) { if (r.counts[i] !== undefined) r.counts[i]++; });
        if (a.etc && String(a.etc).trim()) { r.etcN++; r.texts.push({ grade: rp.grade, text: String(a.etc).trim() }); }
      }
    });
    return r;
  };
  LAB.pct = function (a, b) { return b ? Math.round(a / b * 1000) / 10 : 0; };
  // 자주 나온 낱말 (아주 단순한 방식 — 참고용)
  var STOP = '그리고 그래서 하지만 그냥 너무 진짜 정말 조금 많이 좀 것 수 등 더 안 잘 못 거 게 나 저 제 내 우리 있는 있다 없다 같다 같아요 합니다 해요 있어요 없어요 생각 생각해요 하는 하고 되는 때 때문에 이런 그런 있음 없음 같음 함'.split(' ');
  LAB.topWords = function (texts, n) {
    var cnt = {};
    texts.forEach(function (t) {
      var seen = {};
      String(t.text || t).split(/[\s,.!?~"'()\[\]{}:;/\\\-·…]+/).forEach(function (w) {
        w = w.replace(/(은|는|이|가|을|를|도|에|의|요|고|로|으로|에서|이다|다|하고|해서|하면|이랑|랑|까지|부터|보다|처럼|만)$/, '');
        if (w.length < 2 || STOP.indexOf(w) >= 0 || /^\d+$/.test(w)) return;
        if (!seen[w]) { cnt[w] = (cnt[w] || 0) + 1; seen[w] = 1; }
      });
    });
    return Object.keys(cnt).map(function (k) { return [k, cnt[k]]; }).filter(function (x) { return x[1] > 1; })
      .sort(function (a, b) { return b[1] - a[1]; }).slice(0, n || 12);
  };
  // 결과 그리기 — 객관식: 막대 + 학년별 표 / 주관식: 자주 나온 낱말 + 답 목록
  LAB.resultHtml = function (q, resps, key, opt) {
    opt = opt || {};
    var all = LAB.tally(q, resps, key), t = opt.grade ? LAB.tally(q, resps, key, opt.grade) : all;
    var h = '<div class="res-n">응답 <b>' + t.n + '명</b>' + (opt.grade ? ' (' + opt.grade + '학년)' : ' · 1학년 ' + all.byGrade[1] + ' · 2학년 ' + all.byGrade[2] + ' · 3학년 ' + all.byGrade[3]) + '</div>';
    if (!t.n) return h + '<div class="empty-state">아직 응답이 없어요.</div>';
    if (q.type === 'choice') {
      var max = Math.max.apply(null, t.counts.concat([t.etcN, 1]));
      var rows = (q.options || []).map(function (o, i) { return [o, t.counts[i]]; });
      if (q.etc) rows.push(['기타(직접 쓰기)', t.etcN]);
      h += '<div class="bars">' + rows.map(function (r, i) {
        return '<div class="bar-row' + (r[1] === max ? ' top' : '') + '"><div class="bar-lab">' + LAB.circled(i) + ' ' + LAB.esc(r[0]) + '</div>' +
          '<div class="bar-track"><div class="bar-fill" style="width:' + (r[1] / max * 100) + '%"></div></div>' +
          '<div class="bar-val"><b>' + LAB.pct(r[1], t.n) + '%</b> <small>' + r[1] + '명</small></div></div>';
      }).join('') + '</div>' + (q.multi ? '<div class="dc-muted">※ 여러 개 고를 수 있는 질문이라 비율을 더하면 100%가 넘을 수 있어요.</div>' : '');
      if (!opt.grade && opt.byGrade !== false) {
        var gt = [1, 2, 3].map(function (g) { return LAB.tally(q, resps, key, g); });
        h += '<details class="grade-table"><summary>📋 학년별로 비교해 보기</summary><table><tr><th>보기</th><th>1학년</th><th>2학년</th><th>3학년</th></tr>' +
          rows.map(function (r, i) {
            return '<tr><td>' + LAB.circled(i) + ' ' + LAB.esc(r[0]) + '</td>' + gt.map(function (x) {
              var c = i < (q.options || []).length ? x.counts[i] : x.etcN; return '<td>' + LAB.pct(c, x.n) + '%<small> (' + c + ')</small></td>';
            }).join('') + '</tr>';
          }).join('') + '<tr class="sum"><td>응답 수</td>' + gt.map(function (x) { return '<td>' + x.n + '명</td>'; }).join('') + '</tr></table></details>';
      }
    }
    if (t.texts.length) {
      var words = LAB.topWords(t.texts);
      if (words.length) h += '<div class="words"><div class="words-t">🔤 자주 나온 낱말 <span class="dc-muted">(컴퓨터가 대충 센 것이라 참고만 해요)</span></div>' +
        words.map(function (w) { return '<span class="word" style="font-size:' + (0.78 + Math.min(w[1], 12) * 0.05) + 'rem">' + LAB.esc(w[0]) + ' <small>' + w[1] + '</small></span>'; }).join('') + '</div>';
      if (opt.texts !== false) {
        h += '<details class="texts"' + (q.type === 'open' ? ' open' : '') + '><summary>' + (q.type === 'open' ? '✍️ 모든 답 보기' : '✍️ "기타"에 쓴 답 보기') + ' (' + t.texts.length + '개)</summary><ul>' +
          t.texts.map(function (x) { return '<li><span class="g g' + x.grade + '">' + x.grade + '학년</span> ' + LAB.esc(x.text) + '</li>'; }).join('') + '</ul></details>';
      }
    }
    return h;
  };
  LAB.downloadCsv = function (filename, rows) {
    var csv = '﻿' + rows.map(function (r) { return r.map(function (c) { c = String(c === undefined || c === null ? '' : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = filename; a.click();
  };

  // 사진을 작게 줄여 dataURL로 (RTDB에 그대로 저장 — 설문 때 전교생이 내려받으니 작게)
  LAB.shrinkImage = function (file, maxSide, quality) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onload = function () {
        var img = new Image();
        img.onload = function () {
          var s = Math.min(1, (maxSide || 720) / Math.max(img.width, img.height));
          var c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL('image/jpeg', quality || 0.7));
        };
        img.onerror = function () { rej(new Error('사진을 읽지 못했어요.')); };
        img.src = fr.result;
      };
      fr.onerror = function () { rej(new Error('사진을 읽지 못했어요.')); };
      fr.readAsDataURL(file);
    });
  };
})();
