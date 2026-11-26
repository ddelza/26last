// 2026 광수중 전교생(1~3학년) 학기말 프로젝트 — 공용 라이브러리 (session.js 다음에 로드)
// cell-genetics/cg.js(→digital-citizen/dc.js) 패턴을 이어받았다. Firebase RTDB REST, 빌드 없음.
//
// 데이터 경로: years/{year}/last26/...
//   problems/{반}/{문제키}          = { id(쓴 학생 학번), name, num, cat, title, story, who, updatedAt }   1단계 내 삶의 문제
//                                     한 사람이 여러 개 올릴 수 있다. 문제키 = push 키 (2026-11-24 전에 올린 글은 학번 그대로)
//   likes/{반}/{문제키}/{누른 사람}  = true
//   comments/{반}/{문제키}/{pushKey} = { id, name, text, ts }
//   pick/{반}/_config               = { topics:[문제키 ×5], open, cap(기본 5) }   교사가 선정·선착순 시작
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
//   ({모둠} = 뽑힌 문제의 문제키 — cg/sr-exhibition의 topicId와 같은 발상. 제안자 = problems[문제키].id)
//
// 질문 형태 q = { q:'질문', type:'choice'|'open', options:['보기',...], multi:bool, max:N(여러 개일 때 최대 개수, 없으면 모두), etc:bool }
// 설문 답 = 객관식 { sel:[보기 번호...], etc:'기타 내용' } / 주관식 '문자열'
(function () {
  var DB_URL = 'https://gwangsu-on-default-rtdb.firebaseio.com';
  // 체험판: /demo/ 폴더 페이지는 실제 데이터와 완전히 분리된 last26demo 를 쓰고, 학생 명단도 가짜 이름을 쓴다.
  var DEMO = /\/demo\//.test(location.pathname);
  var ROOT = DEMO ? 'last26demo' : 'last26';
  var TEACHER_BAN = 'T';
  var LAB = window.LAB = { DB_URL: DB_URL, ROOT: ROOT, DEMO: DEMO, cfg: null, student: null };

  // ★ 프로젝트 이름(가칭) — 여기만 바꾸면 모든 페이지 제목이 바뀐다
  LAB.NAME = '광수 HERO';
  LAB.SUB = '이번엔 우리가 HERO · 데이터로 우리 학교의 진짜 문제를 찾고 바꿔요';
  LAB.ICON = '🦸';

  LAB.STAGES = [
    { no: 1, icon: '🔍', name: '문제 찾기', color: '#f76707', soft: '#fff4e6',
      goal: '내 삶에서 진짜 문제를 찾아 올리고, 친구들이 가장 공감한 문제 5개로 모둠을 만들어요.',
      pages: [{ href: 's1-board.html', label: '① 내 삶의 문제 올리고 공감 나누기' }, { href: 's1-pick.html', label: '② 모둠 정하기 (선착순 신청)' }] },
    { no: 2, icon: '🎯', name: '질문 다듬기', color: '#1c7ed6', soft: '#e7f5ff',
      goal: '전교생에게 물어볼 질문을 각자 만들고, 모둠 토의로 딱 하나를 골라 설문에 내보내요.',
      pages: [{ href: 's2-question.html', label: '설문 질문 만들기 → 하나 골라 내보내기' }] },
    { no: 3, icon: '📡', name: '광수에게 묻다', color: '#0ca678', soft: '#e6fcf5',
      goal: '모든 학년이 만든 질문에 전교생이 함께 답해요. 그다음 우리 모둠 질문에 어떤 답이 모였는지 확인해요.',
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
    { id: 'future', icon: '🔮', name: '우리 세대의 미래', desc: '우리가 고등학생·대학생·어른이 되면 겪게 될 문제',
      ex: ['AI가 일자리를 바꾸면 우리는 무엇을 준비해야 하지?', '고등학교·진로를 정보 없이 고르는 것 같아요'] },
    { id: 'town', icon: '🏘️', name: '우리 동네 퇴촌', desc: '우리가 사는 지역(퇴촌)에서 겪는 문제',
      ex: ['청소년이 마음 편히 갈 만한 곳이 없어요', '버스가 자주 안 와서 학원·약속에 늦어요'] },
    { id: 'digital', icon: '📱', name: '디지털·온라인 세상', desc: 'SNS·게임·숏폼·가짜뉴스·개인정보·AI처럼 화면 속에서 생기는 문제',
      ex: ['단톡방에서 생기는 말다툼과 따돌림', '숏폼만 보다 보니 긴 글이 안 읽혀요'] },
    { id: 'earth', icon: '🌏', name: '지구와 사회', desc: '기후 위기·환경·차별·안전처럼 모두가 함께 풀어야 하는 문제',
      ex: ['여름마다 교실이 너무 더워 공부가 안 돼요', '일회용 컵·페트병 쓰레기, 우리 학교만 해도 얼마나 될까?'] },
    { id: 'etc', icon: '✨', name: '그 밖의 문제', desc: '위 어디에도 딱 맞지 않지만 꼭 다루고 싶은 문제', ex: [] },
  ];
  LAB.cat = function (id) { return LAB.CATS.filter(function (c) { return c.id === id; })[0] || LAB.CATS[LAB.CATS.length - 1]; };

  LAB.QTYPES = {
    survey: { icon: '📊', name: '실태 파악 질문', short: '실태 파악',
      desc: '이 문제가 <b>지금 실제로 얼마나 심각한지, 왜 생기는지</b> 알아보는 질문이에요. "진짜 문제가 맞나?"를 숫자로 확인할 수 있어요.',
      subs: ['serious', 'cause'] },
    solution: { icon: '💡', name: '문제 해결 질문', short: '문제 해결',
      desc: '이 문제를 <b>어떻게 풀면 좋을지</b> 알아보는 질문이에요. 친구들이 원하는 것, 좋은 아이디어를 모아 우리 해결 방안이 "먹힐지" 미리 확인해요.',
      subs: ['pref', 'idea'] },
  };
  // 질문 유형을 한 단계 더 쪼갠 "무엇을 알아보는 질문인가" (①~④) + 선택 ⑤
  LAB.FOCUS = {
    serious: { no: '①', name: '심각성', ask: '얼마나 자주 겪나? 얼마나 문제라고 느끼나?', kind: 'survey',
      ex: '예) 지난 일주일 동안 쉬는 시간 화장실 줄 때문에 수업에 늦은 적이 몇 번인가요?' },
    cause: { no: '②', name: '원인', ask: '왜 생길까?', kind: 'survey',
      ex: '예) 평일에 늦게 자게 되는 가장 큰 이유는 무엇인가요?' },
    pref: { no: '③', name: '선호·의견', ask: '친구들은 무엇을 원할까?', kind: 'solution',
      ex: '예) 다음 중 쉬는 시간 화장실 줄을 줄이는 방법으로 가장 마음에 드는 것은?' },
    idea: { no: '④', name: '아이디어', ask: '어떻게 바꾸면 좋을까?', kind: 'solution',
      ex: '예) 단톡방 말다툼을 줄이려면 어떤 규칙이 있으면 좋을까요? 자유롭게 써 주세요.' },
  };
  LAB.CHECK = { no: '⑤', name: '효과 확인', ask: '해 본 뒤 같은 질문을 다시 물어 비교해요', opt: true };
  LAB.focusTag = function (id) { var f = LAB.FOCUS[id]; return f ? f.no + ' ' + f.name : ''; };
  LAB.SHOWS = {
    q: { icon: '❓', name: '질문만 보여 주기', desc: '응답자는 질문만 봐요. 문제를 미리 알려 주지 않아 솔직한 답을 받을 수 있어요.' },
    note: { icon: '📝', name: '질문 + 보충 설명·사진', desc: '문제는 밝히지 않고 설명 글이나 사진만 붙여요. 상황은 알려 주되 답을 한쪽으로 이끌지 않아요.' },
    problem: { icon: '📌', name: '우리 문제 + 질문', desc: '우리 모둠이 고른 문제를 함께 보여 줘요. 왜 묻는지 알고 답할 수 있어요.' },
    full: { icon: '🖼️', name: '문제 + 질문 + 보충 설명·사진', desc: '설명 글이나 사진까지 붙여요. 상황을 잘 모르는 다른 학년도 이해하기 쉬워요.' },
  };

  LAB.showProb = function (sh) { return sh === 'problem' || sh === 'full'; };   // 우리 문제를 보여 주는가
  LAB.showExtra = function (sh) { return sh === 'full' || sh === 'note'; };     // 보충 설명·사진을 붙이는가

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
    if (s.isTeacher) return LAB.qs('ban') || (DEMO ? '3-1' : TEACHER_BAN); // 교사는 ?ban=3-2 로 그 반 학생 화면을 볼 수 있다
    return s.grade + '-' + s.ban;
  };
  LAB.TEACHER_BAN = TEACHER_BAN;
  LAB.banLabel = function (b) { if (b === TEACHER_BAN) return '교사 테스트'; var p = String(b).split('-'); return p.length === 2 ? p[0] + '학년 ' + p[1] + '반' : b; };
  LAB.banShort = function (b) { if (b === TEACHER_BAN) return '교사'; var p = String(b).split('-'); return p.length === 2 ? p[0] + '-' + p[1] + '반' : b; };
  var rosterP = null;
  LAB.roster = function () {
    if (DEMO) return Promise.resolve(LAB.fakeRoster());
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
  // 실제 학급(2026): 1학년 4반, 2·3학년 5반. 체험판 가짜 명단은 학년마다 5반.
  LAB.BANS = DEMO ? ['1-1', '1-2', '1-3', '1-4', '1-5', '2-1', '2-2', '2-3', '2-4', '2-5', '3-1', '3-2', '3-3', '3-4', '3-5']
    : ['1-1', '1-2', '1-3', '1-4', '2-1', '2-2', '2-3', '2-4', '2-5', '3-1', '3-2', '3-3', '3-4', '3-5'];
  LAB.gradeOf = function (ban) { return String(ban).split('-')[0]; };
  // 체험판용 가짜 명단: 1~3학년 × 5반 × 25명, 학번마다 늘 같은 이름
  var fakeR = null;
  LAB.fakeName = function (id) {
    var F = '김이박최정강조윤장임한오서신권황안송류홍전고문양손배백허남심노하곽성차주우구민유나진지엄채원천방공현함변염여추도소석선설마길연위표명기반왕금옥육인맹제모탁국어은편용';
    var G1 = '서민지하준도윤수현예우시주유은채건태연소다승아재정나영가세동혜경진성원희';
    var G2 = '준연윤우진아은서민현호빈원희영수린율하후';
    var h = 0, s = String(id); for (var i = 0; i < s.length; i++) h = (h * 131 + s.charCodeAt(i) * 7 + 13) % 1000003;
    return F.charAt(h % 40) + G1.charAt((h >> 3) % G1.length) + G2.charAt((h >> 7) % G2.length);
  };
  LAB.fakeRoster = function () {
    if (fakeR) return fakeR; fakeR = {};
    for (var g = 1; g <= 3; g++) for (var b = 1; b <= 5; b++) for (var n = 1; n <= 25; n++) {
      var id = '' + g + b + (n < 10 ? '0' : '') + n; fakeR[id] = { grade: g, ban: b, num: n, name: LAB.fakeName(id) };
    }
    return fakeR;
  };

  // ---------- 모둠 ----------
  // 모둠 = 교사가 고른 문제(제안자 학번). 모둠원 = 제안자(고정) + 선착순 신청자(서버 시각 순)
  LAB.buildGroups = function (pickAll, problems) {
    var picks = Object.assign({}, pickAll || {}); var conf = picks._config || {}; delete picks._config;
    problems = problems || {};
    var topics = []; var t = conf.topics || [];
    Object.keys(t).sort(function (a, b) { return a - b; }).forEach(function (k) { if (t[k]) topics.push(t[k]); });
    var groups = topics.map(function (tid, i) {
      var pr = problems[tid] || {};
      var author = pr.id || tid;
      var list = Object.keys(picks).map(function (k) { return Object.assign({ id: k }, picks[k]); })
        .filter(function (p) { return p.topic === tid && p.id !== author; })
        .sort(function (a, b) { return (a.ts - b.ts) || String(a.id).localeCompare(String(b.id)); });
      return { id: tid, no: i + 1, title: pr.title || '(삭제된 문제)', cat: pr.cat, story: pr.story, who: pr.who,
        author: author, members: [{ id: author, name: pr.name, num: pr.num, proposer: true }].concat(list) };
    });
    return { conf: conf, picks: picks, problems: problems, groups: groups, cap: conf.cap || 5 };
  };
  LAB.loadGroups = function (ban) {
    if (LAB.isHero(ban)) return Promise.all([LAB.get('team/' + ban), LAB.get('hero/' + ban)]).then(function (r) { return LAB.buildHeroGroups(r[0], r[1]); });
    return Promise.all([LAB.get('pick/' + ban), LAB.get('problems/' + ban)]).then(function (r) { return LAB.buildGroups(r[0], r[1]); });
  };

  // ---------- 광수 HERO (1·2학년) — 3학년은 위의 문제→선착순 구조 그대로 ----------
  // team/{반}/_config = { n:모둠 수(기본 5), leaders:{ 모둠번호: 학번 } }   team/{반}/m/{학번} = { no:모둠번호, name, num }   (선생님이 편성)
  // hero/{반}/h{번호}/ q1/{학번}={problem,evidence,name,at} · area={cat,title,story,byTeacher,by,byName,at}
  //   memo={num,meaning,key,by,byName,at} · declare={problem,evidence,by,byName,at} · names/{학번}={name,why,at} · vote/{학번}=후보학번 · heroName={name,by,at}
  //   practice/{push}={date,what,change,by,byName,at} · method={text,...} · help/{push}={date,card,help,by,byName,at} · canva/{칸}={text,by,byName,at}
  // heroCfg/{학년} = { mode:'A'|'B'|'C', theme, period, updatedAt }
  LAB.isHero = function (ban) { return /^[12]-/.test(String(ban || '')); };
  LAB.HERO_N = 5;
  LAB.HERO_MODES = {
    A: { name: '선생님이 주제를 정해 줘요', desc: '모둠마다 선생님이 정한 주제로 시작해요.' },
    B: { name: '설문 결과 + 학년 핵심 주제를 보고 골라요', desc: '학교평가 설문 결과와 우리 학년 핵심 주제를 함께 보고 골라요.' },
    C: { name: '설문 결과만 보고 자유롭게 골라요', desc: '학교평가 설문 결과를 보고 모둠이 자유롭게 골라요.' },
  };
  // HERO 문제 영역 (우리 학교 안의 문제)
  LAB.HERO_AREAS = [
    { id: 'talk', icon: '💬', name: '말과 관계', ex: '복도·단톡방에서 오가는 말, 친구 사이' },
    { id: 'space', icon: '🏫', name: '함께 쓰는 공간·규칙', ex: '교실·화장실·도서관·체육관 쓰는 규칙' },
    { id: 'team', icon: '🤝', name: '모둠·함께 배우기', ex: '모둠 활동, 수업 시간 분위기' },
    { id: 'safety', icon: '🚸', name: '안전', ex: '복도·계단에서 부딪히기, 뛰어다니기' },
    { id: 'green', icon: '🍱', name: '급식·환경', ex: '잔반, 분리수거, 물·전기 아끼기' },
    { id: 'break', icon: '⏰', name: '쉬는 시간·학교생활', ex: '쉬는 시간 보내기, 등하교, 시끄러움' },
    { id: 'etc', icon: '✨', name: '그 밖의 문제', ex: '위에 없는 우리 학교 문제' },
  ];
  LAB.heroArea = function (id) { return LAB.HERO_AREAS.filter(function (c) { return c.id === id; })[0] || null; };
  LAB.SCHOOL_FACTS = [
    { icon: '💬', t: '말', d: "올해 가장 마음에 걸린 행동은 '말'이었어요" },
    { icon: '🏫', t: '공간·규칙', d: "바꾸고 싶은 일 1위는 '함께 쓰는 공간과 규칙'이에요" },
    { icon: '🤝', t: '모둠', d: '모둠은 할 일을 모르거나 생각이 다를 때 멈춰요' },
  ];
  LAB.buildHeroGroups = function (team, hero) {
    team = team || {}; hero = hero || {};
    var conf = team._config || {}, m = team.m || {}, n = conf.n || LAB.HERO_N, leaders = conf.leaders || {};
    var groups = [];
    for (var i = 1; i <= n; i++) {
      var gid = 'h' + i, H = hero[gid] || {}, A = H.area || {};
      var mem = Object.keys(m).filter(function (sid) { return m[sid] && +m[sid].no === i; }).map(function (sid) {
        return { id: sid, name: m[sid].name || '', num: m[sid].num || 0, leader: leaders[i] === sid };
      }).sort(function (a, b) { return a.num - b.num; });
      groups.push({ id: gid, no: i, title: A.title || '(아직 문제를 정하는 중)', cat: A.cat, story: A.story, hasArea: !!A.title,
        heroName: (H.heroName && H.heroName.name) || '', leader: leaders[i] || '', members: mem, hero: H, author: null });
    }
    return { hero: true, conf: conf, team: m, groups: groups, cap: 99 };
  };
  LAB.HERO_STAGES = [
    { no: 1, icon: '🔍', name: '문제 찾기', color: '#f76707', soft: '#fff4e6', q: '퀘스트 ❶',
      goal: '학교평가 설문 결과를 보고 우리 학교에서 불편한 점을 찾아요. 모둠이 해결할 문제 영역을 골라요.',
      pages: [{ href: 'h1-problem.html', label: '❶ 문제 찾기 (문제 + 근거, 모둠 문제 정하기)' }] },
    { no: 2, icon: '📊', name: '조사하기', color: '#1c7ed6', soft: '#e7f5ff', q: '퀘스트 ❷❸❹❺',
      goal: '설문 문항을 만들고, 전교생이 함께 답하고, 결과를 읽고, 숫자를 근거로 해결할 문제를 선언해요.',
      pages: [{ href: 's2-question.html', label: '❷ 설문 문항 만들기' }, { href: 'survey.html', label: '❸ 전교생 설문 답하기' },
        { href: 's3-result.html', label: '❹ 설문 결과 읽기' }, { href: 'h5-declare.html', label: '❺ 해결할 문제 선언 · HERO 그룹 명' }] },
    { no: 3, icon: '🛠️', name: '해 보기', color: '#0ca678', soft: '#e6fcf5', q: '퀘스트 ❻',
      goal: '고른 해결 방법을 학교에서 직접 해 보고, 과정과 달라진 점을 기록해요. (사진은 캔바에 바로 넣어요)',
      pages: [{ href: 'h6-practice.html', label: '❻ 해 본 방법과 실천 기록' }] },
    { no: 4, icon: '🎤', name: '돌아보기', color: '#d6336c', soft: '#fff0f6', q: '퀘스트 ❼',
      goal: '앞에서 쓴 내용을 모아 캔바 발표 틀을 채우고, 배운 점을 돌아봐요.',
      pages: [{ href: 'h7-canva.html', label: '❼ 돌아보고 캔바 틀 채우기' }] },
  ];
  LAB.stagesFor = function (ban) { return LAB.isHero(ban) ? LAB.HERO_STAGES : LAB.STAGES; };
  LAB.heroCfg = function (ban) { return LAB.get('heroCfg/' + LAB.gradeOf(ban)).then(function (c) { return c || {}; }); };
  // 학생이 쓴 문제들 (문제키 목록)
  LAB.problemsBy = function (problems, sid) {
    return Object.keys(problems || {}).filter(function (k) { return problems[k] && (problems[k].id || k) === sid; });
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
    if (LAB.isHero(ban)) {
      var hc = LAB.heroArea(g.cat);
      return '<div class="grp-banner"><div class="grp-no">' + g.no + '모둠</div><div class="grp-txt">' +
        '<div class="grp-cat">' + (g.heroName ? '🦸 ' + LAB.esc(g.heroName) : '🦸 HERO 그룹') + (hc ? ' · ' + hc.icon + ' ' + LAB.esc(hc.name) : '') + (LAB.student.isTeacher ? ' · ' + LAB.esc(LAB.banLabel(ban)) : '') + '</div>' +
        '<div class="grp-title">' + LAB.esc(g.title) + '</div>' +
        '<div class="grp-mem">' + g.members.map(function (m) {
          return '<span class="' + (m.id === LAB.student.id ? 'me' : '') + '">' + (m.leader ? '👑' : '') + LAB.esc(m.name || m.id) + '</span>';
        }).join(' · ') + '</div></div></div>';
    }
    var c = LAB.cat(g.cat);
    return '<div class="grp-banner"><div class="grp-no">' + g.no + '모둠</div><div class="grp-txt">' +
      '<div class="grp-cat">' + c.icon + ' ' + LAB.esc(c.name) + (LAB.student.isTeacher ? ' · ' + LAB.esc(LAB.banLabel(ban)) : '') + '</div>' +
      '<div class="grp-title">' + LAB.esc(g.title) + '</div>' +
      '<div class="grp-mem">' + g.members.map(function (m) {
        return '<span class="' + (m.id === LAB.student.id ? 'me' : '') + '">' + (m.proposer ? '📌' : '') + LAB.esc(m.name || m.id) + '</span>';
      }).join(' · ') + '</div></div></div>';
  };
  LAB.noGroupHtml = function () {
    if (LAB.student && !LAB.student.isTeacher && LAB.isHero(LAB.myBan()))
      return '<div class="card center"><div style="font-size:2rem">🧭</div><b>아직 모둠이 정해지지 않았어요.</b>' +
        '<p class="hint" style="margin-top:6px">선생님이 모둠을 짜 주시면 여기에서 바로 시작할 수 있어요.</p></div>';
    return '<div class="card center"><div style="font-size:2rem">🧭</div><b>아직 모둠이 정해지지 않았어요.</b>' +
      '<p class="hint" style="margin-top:6px">1단계 <a href="s1-pick.html">② 모둠 정하기</a>에서 먼저 모둠을 신청해 주세요.<br>신청을 못 했다면 선생님께 말씀드려요.</p></div>';
  };
  // 교사용: 반·모둠 바꿔 보기 바
  LAB.teacherPickerHtml = function (ban, data, g) {
    if (!LAB.student.isTeacher) return '';
    return '<div class="t-bar">👩‍🏫 교사 보기 · <select onchange="location.search=\'?ban=\'+this.value">' +
      (DEMO ? [] : ['T']).concat(LAB.BANS).map(function (b) { return '<option value="' + b + '"' + (b === ban ? ' selected' : '') + '>' + LAB.banLabel(b) + '</option>'; }).join('') +
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
      var heroP = LAB.student && opts.heroStage && LAB.isHero(LAB.myBan());
      var st = heroP ? LAB.HERO_STAGES[opts.heroStage - 1] : opts.stage ? LAB.STAGES[opts.stage - 1] : null;
      if (st) document.documentElement.style.setProperty('--stage', st.color), document.documentElement.style.setProperty('--stage-soft', st.soft);
      if (DEMO && !document.getElementById('demo-ribbon')) document.body.insertAdjacentHTML('afterbegin', '<div id="demo-ribbon" class="demo-ribbon">🧪 <b>체험판</b> · 실제 학생 데이터와 분리돼 있고, 학생 이름은 모두 가짜예요. 마음껏 눌러 보세요!</div>');
      if (head) {
        head.innerHTML =
          '<div class="topline"><a href="index.html">' + LAB.ICON + ' ' + LAB.esc(LAB.NAME) + '</a>' +
          (LAB.student ? '<span>' + LAB.esc(window.srWhoLabel(LAB.student)) + '</span>' : '') + '</div>' +
          (st ? '<div class="stage-tag">' + st.no + '단계 · ' + st.icon + ' ' + LAB.esc(st.name) + (st.q ? ' · ' + st.q : '') + '</div>' : '') +
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
    var ty = v.type === 'open' || v.type === 'scale' ? v.type : 'choice';
    return { q: v.q || '', type: ty, options: (ty === 'choice' && v.options && v.options.length ? v.options.slice() : (v.keepOpts || ['', ''])),
      lo: v.lo !== undefined ? v.lo : '전혀 아니다', hi: v.hi !== undefined ? v.hi : '매우 그렇다',
      multi: !!v.multi, max: Math.max(0, parseInt(v.max, 10) || 0), etc: !!v.etc, focus: LAB.FOCUS[v.focus] ? v.focus : '' };
  }
  LAB.cleanQ = function (v) {
    v = normQ(v);
    var o = { q: v.q.trim(), type: v.type };
    if (v.focus) o.focus = v.focus;
    if (v.type === 'scale') { o.lo = String(v.lo || '').trim(); o.hi = String(v.hi || '').trim(); o.options = LAB.scaleOpts(o); }
    if (v.type === 'choice') { o.options = v.options.map(function (x) { return String(x || '').trim(); }).filter(Boolean); o.multi = v.multi; if (v.multi && v.max) o.max = v.max; o.etc = v.etc; }
    return o;
  };
  // 1~6점 문항: 보기 6개를 자동으로 만든다 (응답·집계는 객관식과 똑같이 { sel:[번호] })
  LAB.scaleOpts = function (v) { return [1, 2, 3, 4, 5, 6].map(function (k) { return k + '점' + (k === 1 && v.lo ? ' · ' + v.lo : k === 6 && v.hi ? ' · ' + v.hi : ''); }); };
  LAB.checkQ = function (v, needFocus) {
    v = LAB.cleanQ(v);
    if (v.type === 'scale' && (!v.lo || !v.hi)) return '1~6점 문항은 1점과 6점이 무슨 뜻인지 써 주세요.';
    if (needFocus && !v.focus) return '무엇을 알아보는 질문인지(①~④) 먼저 골라 주세요.';
    if (!v.q) return '질문을 써 주세요.';
    if (v.type === 'choice' && v.options.length < 2) return '객관식은 보기가 2개 이상 있어야 해요.';
    if (v.type === 'choice' && v.max && v.max >= v.options.length + (v.etc ? 1 : 0)) return '고를 수 있는 개수가 보기 수와 같거나 많아요. "해당하는 것 모두 고르기"로 바꾸거나 개수를 줄여 주세요.';
    return '';
  };
  LAB.qEditor = function (root, val, opts) {
    opts = opts || {};
    var uid = 'qe' + (++qeSeq), st = normQ(val);
    function readDom() {
      var t = root.querySelector('.qe-q'); if (!t) return;
      st.q = t.value;
      var r = root.querySelector('input[name="' + uid + '"]:checked'); st.type = r ? r.value : 'choice';
      var lo = root.querySelector('.qe-lo'), hi = root.querySelector('.qe-hi'); if (lo) st.lo = lo.value; if (hi) st.hi = hi.value;
      var ops = root.querySelectorAll('.qe-opt input');
      if (ops.length) st.options = Array.prototype.map.call(ops, function (e) { return e.value; });
      var m = root.querySelector('.qe-multi'); if (m) st.multi = m.checked;
      var mx = root.querySelector('.qe-max'); if (mx) st.max = parseInt(mx.value, 10) || 0;
      var e = root.querySelector('.qe-etc'); if (e) st.etc = e.checked;
      var f = root.querySelector('input[name="' + uid + 'f"]:checked'); if (f) st.focus = f.value;
    }
    function draw(focusIdx) {
      var subs = opts.subs || [], fo = LAB.FOCUS[st.focus];
      var h = (subs.length ? '<div class="qe-focus"><div class="qe-fh">무엇을 알아보는 질문인가요?</div>' + subs.map(function (id) {
          var f = LAB.FOCUS[id];
          return '<label class="chip"><input type="radio" name="' + uid + 'f" value="' + id + '"' + (st.focus === id ? ' checked' : '') + '><span><b>' + f.no + ' ' + f.name + '</b> <small>' + f.ask + '</small></span></label>';
        }).join('') + '</div>' : '') +
        '<textarea class="qe-q" rows="2" placeholder="' + LAB.escAttr(fo ? fo.ex : (opts.placeholder || '전교생에게 물어볼 질문을 써요')) + '">' + LAB.esc(st.q) + '</textarea>' +
        '<div class="qe-type">' +
        '<label class="chip"><input type="radio" name="' + uid + '" value="choice"' + (st.type === 'choice' ? ' checked' : '') + '><span>☑️ 객관식 (보기 중에 고르기)</span></label>' +
        '<label class="chip"><input type="radio" name="' + uid + '" value="scale"' + (st.type === 'scale' ? ' checked' : '') + '><span>🔢 1~6점 고르기</span></label>' +
        '<label class="chip"><input type="radio" name="' + uid + '" value="open"' + (st.type === 'open' ? ' checked' : '') + '><span>✍️ 주관식 (직접 쓰기)</span></label></div>';
      if (st.type === 'choice') {
        h += '<div class="qe-opts">' + st.options.map(function (o, i) {
          return '<div class="qe-opt"><span class="n">' + LAB.circled(i) + '</span><input type="text" value="' + LAB.escAttr(o) + '" placeholder="보기 ' + (i + 1) + '">' +
            (st.options.length > 2 ? '<button type="button" data-rm="' + i + '" title="이 보기 지우기">✕</button>' : '') + '</div>';
        }).join('') +
          (st.options.length < 8 ? '<button type="button" class="qe-add" data-add="1">＋ 보기 추가</button>' : '') + '</div>' +
          '<div class="qe-flags"><label><input type="checkbox" class="qe-multi"' + (st.multi ? ' checked' : '') + '> 여러 개 고를 수 있게</label>' +
          (st.multi ? (function () {
            var tot = st.options.length + (st.etc ? 1 : 0), o = '<option value="0"' + (!st.max ? ' selected' : '') + '>해당하는 것 모두 고르기</option>';
            for (var k = 2; k < Math.max(tot, 3); k++) o += '<option value="' + k + '"' + (st.max === k ? ' selected' : '') + '>가장 가까운 것 최대 ' + k + '개까지</option>';
            if (st.max && st.max >= Math.max(tot, 3)) o += '<option value="' + st.max + '" selected>최대 ' + st.max + '개 (보기 수보다 많아요)</option>';
            return '<label class="qe-maxl">↳ 몇 개까지? <select class="qe-max">' + o + '</select></label>';
          })() : '') +
          '<label><input type="checkbox" class="qe-etc"' + (st.etc ? ' checked' : '') + '> 맨 끝에 "기타(직접 쓰기)" 넣기</label></div>';
      } else if (st.type === 'scale') {
        h += '<div class="qe-scale"><div class="qe-sc-row">' + [1, 2, 3, 4, 5, 6].map(function (k) { return '<span>' + k + '</span>'; }).join('') + '</div>' +
          '<div class="qe-sc-lab"><label>1점 = <input type="text" class="qe-lo" value="' + LAB.escAttr(st.lo) + '" placeholder="전혀 아니다"></label>' +
          '<label>6점 = <input type="text" class="qe-hi" value="' + LAB.escAttr(st.hi) + '" placeholder="매우 그렇다"></label></div>' +
          '<div class="hint" style="margin:6px 0 0">🔢 얼마나 그런지 1~6점으로 골라요. 결과는 "4점 이상 ○%"처럼 숫자로 말하기 좋아요. 가운데(3.5점)가 없어서 한쪽을 고르게 돼요.</div></div>';
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
      if (e.target.name === uid || e.target.classList.contains('qe-multi') || e.target.classList.contains('qe-etc')) { readDom(); draw(); }
      if (e.target.name === uid + 'f') { readDom(); var ta = root.querySelector('.qe-q'); if (ta) ta.placeholder = LAB.FOCUS[st.focus].ex; }
      if (opts.onInput) opts.onInput();
    });
    root.addEventListener('input', function () { if (opts.onInput) opts.onInput(); });
    draw();
    return {
      get: function () { readDom(); return LAB.cleanQ(st); },
      set: function (v) { st = normQ(v); draw(); },
    };
  };
  LAB.multiLabel = function (v) { return v.max ? '가장 가까운 것 최대 ' + v.max + '개' : '해당하는 것 모두 선택'; };
  // 질문 미리보기 (읽기 전용)
  LAB.qViewHtml = function (v, small) {
    if (!v || !v.q) return '<div class="dc-muted">(아직 없음)</div>';
    var h = '<div class="qv' + (small ? ' small' : '') + '">' + (v.focus ? '<span class="qv-focus">' + LAB.focusTag(v.focus) + '</span>' : '') + '<div class="qv-q">' + LAB.nl2br(v.q) + '</div>';
    if (v.type === 'choice') {
      h += '<div class="qv-meta">☑️ 객관식' + (v.multi ? ' · ' + LAB.multiLabel(v) : '') + '</div><ol class="qv-opts">' +
        (v.options || []).map(function (o) { return '<li>' + LAB.esc(o) + '</li>'; }).join('') + (v.etc ? '<li class="etc">기타(직접 쓰기)</li>' : '') + '</ol>';
    } else if (v.type === 'scale') {
      h += '<div class="qv-meta">🔢 1~6점</div><div class="qv-scale"><span>1점 ' + LAB.esc(v.lo || '') + '</span><span class="dots">1 · 2 · 3 · 4 · 5 · 6</span><span>6점 ' + LAB.esc(v.hi || '') + '</span></div>';
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
    if (q.type === 'scale') {
      var hiN = t.counts[3] + t.counts[4] + t.counts[5], sum = 0; t.counts.forEach(function (c, i) { sum += c * (i + 1); });
      h += '<div class="sc-sum"><div><b>' + LAB.pct(hiN, t.n) + '%</b><small>4점 이상 (' + hiN + '명)</small></div><div><b>' + LAB.pct(t.n - hiN, t.n) + '%</b><small>3점 이하 (' + (t.n - hiN) + '명)</small></div><div><b>' + (Math.round(sum / t.n * 10) / 10) + '점</b><small>평균</small></div></div>';
    }
    if (q.type === 'choice' || q.type === 'scale') {
      var max = Math.max.apply(null, t.counts.concat([t.etcN, 1]));
      var rows = (q.options || []).map(function (o, i) { return [o, t.counts[i]]; });
      if (q.etc) rows.push(['기타(직접 쓰기)', t.etcN]);
      h += '<div class="bars">' + rows.map(function (r, i) {
        return '<div class="bar-row' + (r[1] === max ? ' top' : '') + '"><div class="bar-lab">' + (q.type === 'scale' ? '' : LAB.circled(i) + ' ') + LAB.esc(r[0]) + '</div>' +
          '<div class="bar-track"><div class="bar-fill" style="width:' + (r[1] / max * 100) + '%"></div></div>' +
          '<div class="bar-val"><b>' + LAB.pct(r[1], t.n) + '%</b> <small>' + r[1] + '명</small></div></div>';
      }).join('') + '</div>' + (q.multi ? '<div class="dc-muted">※ 여러 개 고를 수 있는 질문이라 비율을 더하면 100%가 넘을 수 있어요.</div>' : '');
      if (!opt.grade && opt.byGrade !== false) {
        var gt = [1, 2, 3].map(function (g) { return LAB.tally(q, resps, key, g); });
        h += '<details class="grade-table"><summary>📋 학년별로 비교해 보기</summary><table><tr><th>보기</th><th>1학년</th><th>2학년</th><th>3학년</th></tr>' +
          rows.map(function (r, i) {
            return '<tr><td>' + (q.type === 'scale' ? '' : LAB.circled(i) + ' ') + LAB.esc(r[0]) + '</td>' + gt.map(function (x) {
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
  // 답을 글로 (CSV·인쇄용)
  LAB.ansText = function (q, a) {
    if (!LAB.isAnswered(q, a)) return '';
    if (q.type === 'open') return String(a);
    if (q.type === 'scale') return String(((a.sel || [])[0] || 0) + 1);
    return (a.sel || []).map(function (i) { return q.options[i]; }).concat(a.etc && String(a.etc).trim() ? ['기타: ' + String(a.etc).trim()] : []).join(' / ');
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

  // ---------- 🙋 교사 도움카드 버튼 (모든 페이지 오른쪽 위에 따라다님) ----------
  function addHelpBtn() {
    if (/helpcards\.html$/.test(location.pathname) || document.getElementById('help-fab')) return;
    var a = document.createElement('a');
    a.id = 'help-fab'; a.className = 'help-fab'; a.href = 'helpcards.html';
    a.innerHTML = '🙋 <span>교사 도움카드</span>';
    a.title = '막히면 찾아가요 — 선생님들이 도와줄 수 있는 것';
    document.body.appendChild(a);
    document.body.classList.add('has-help-fab');
  }
  // ---------- ⚙️ 교사용 관리 페이지 버튼 (모든 페이지 아래쪽에 따라다님) ----------
  // 로그인 전 화면이거나 교사로 로그인했을 때만 보인다(학생 화면에는 숨김). 관리 페이지 자체는 비밀번호로 막혀 있다.
  function syncAdminBtn() {
    if (/admin\.html$/.test(location.pathname)) return;
    var s = null; try { s = window.getSrStudent ? getSrStudent() : null; } catch (e) {}
    var show = !s || !!s.isTeacher, a = document.getElementById('admin-fab');
    if (!a) {
      a = document.createElement('a');
      a.id = 'admin-fab'; a.className = 'admin-fab'; a.href = 'admin.html';
      a.innerHTML = '⚙️ <span>교사용 관리 페이지</span>';
      document.body.appendChild(a);
    }
    a.style.display = show ? '' : 'none';
    document.body.classList.toggle('has-admin-fab', show);
  }
  function addFabs() { addHelpBtn(); syncAdminBtn(); setInterval(syncAdminBtn, 1500); } // 같은 화면에서 로그인/로그아웃해도 따라 바뀌게
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addFabs); else addFabs();
})();
