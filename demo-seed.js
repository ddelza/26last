// 체험판(demo/) 예시 데이터 — last26demo 아래에 통째로 만든다. 실제 데이터(last26)는 절대 건드리지 않는다.
//   3-1반: 4단계까지 진행된 모습 (모둠·질문·설문 결과·보고서 일부·포스터)
//   3-2반: 2단계 진행 중 (모둠은 정해졌고 질문을 만드는 중)
//   3-3반: 1단계 (문제 게시판만 — 선생님이 직접 주제를 고르고 선착순을 열어 볼 수 있음)
//   3-4·3-5반: 비어 있음
(function () {
  if (!window.LAB || !LAB.DEMO) return;
  var rnd = (function () { var s = 20261125; return function () { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; })();
  var pick = function (a) { return a[Math.floor(rnd() * a.length)]; };
  var weighted = function (w) { var t = w.reduce(function (a, b) { return a + b; }, 0), r = rnd() * t; for (var i = 0; i < w.length; i++) { r -= w[i]; if (r < 0) return i; } return w.length - 1; };
  var T0 = Date.now() - 6 * 86400000; // 6일 전부터 활동한 것처럼
  var at = function (h) { return T0 + Math.round(h * 3600000); };
  var sid = function (ban, n) { return ban.replace('-', '') + (n < 10 ? '0' : '') + n; };
  var nm = function (id) { return LAB.fakeName(id); };

  // [갈래, 한 문장, 상황, 왜 함께]
  var P31 = [
    ['school', '쉬는 시간 10분, 화장실 줄 때문에 늘 수업에 늦어요', '3층 화장실은 칸이 3개뿐이라 쉬는 시간마다 줄이 복도까지 서요. 기다리다 종이 쳐서 수업에 늦은 적이 이번 주만 두 번이에요.', '3층을 쓰는 모든 학년이 겪어요. 늦으면 혼나기도 하고, 아예 참는 친구도 있어서 건강에도 안 좋아요.'],
    ['daily', '밤에 폰 보다 늦게 자서 아침마다 너무 피곤해요', '숏폼 하나만 보고 자려다가 정신 차리면 새벽 1시예요. 1교시엔 거의 졸아요.', '반 친구들 절반은 1교시에 엎드려 있어요. 성적이랑 건강 모두에 영향이 있어요.'],
    ['town', '퇴촌 버스가 너무 안 와서 학원·약속에 자꾸 늦어요', '학교 앞 버스가 30~40분에 한 대라 한 대 놓치면 학원에 지각이에요. 겨울엔 기다리기도 너무 추워요.', '퇴촌에 사는 학생 대부분이 버스를 타요. 부모님이 매번 태워 주실 수도 없어요.'],
    ['school', '급식 잔반이 많은데 왜 남기는지 아무도 안 물어봐요', '식판 반납할 때 보면 잔반통이 금방 차요. 맛없어서인지, 양이 많아서인지, 시간이 없어서인지 궁금해요.', '음식이 버려지는 건 환경 문제이기도 하고, 급식실 선생님들도 힘드실 것 같아요.'],
    ['digital', '단톡방에서 생기는 말다툼과 따돌림이 무서워요', '반 단톡방에서 농담이 싸움으로 번지고, 누군가 말없이 나가는 걸 몇 번 봤어요.', '단톡방은 거의 모두가 쓰지만 선생님은 잘 모르세요. 상처받아도 말할 곳이 없어요.'],
    ['earth', '여름마다 교실이 너무 더워 공부가 안 돼요', '에어컨이 있어도 창가 쪽은 햇빛 때문에 너무 더워요. 땀 때문에 집중이 안 돼요.', '기후 위기로 여름이 더 더워지고 있어요. 모든 교실의 문제예요.'],
    ['future', '고등학교를 정보 없이 고르는 것 같아요', '어떤 고등학교가 나한테 맞는지 잘 모르겠어요. 친구 따라 가는 경우가 많아요.', '3학년 모두가 곧 결정해야 하는 문제예요.'],
    ['daily', '고민이 있어도 털어놓을 곳이 마땅치 않아요', '친구한테 말하면 소문날까 봐, 부모님께는 걱정하실까 봐 혼자 끙끙 앓아요.', '마음 건강은 누구에게나 중요해요.'],
    ['school', '매점이 쉬는 시간에만 열어서 늘 사람이 몰려요', '쉬는 시간 10분 동안 매점에 가면 줄 서다가 끝나요.', '매점을 쓰는 학생이 많아요.'],
    ['town', '청소년이 마음 편히 갈 만한 곳이 없어요', '방과 후에 친구들이랑 있을 곳이 편의점 앞이나 PC방뿐이에요.', '퇴촌 청소년 모두의 문제예요.'],
    ['digital', '숏폼만 보다 보니 긴 글이 안 읽혀요', '책을 펴면 3분도 못 버티고 폰을 찾게 돼요.', '공부와 생각하는 힘에 영향을 줘요.'],
    ['earth', '일회용 페트병 쓰레기, 우리 학교만 해도 얼마나 될까?', '분리수거함이 매일 페트병으로 넘쳐요.', '환경 문제는 모두의 문제예요.'],
  ];
  var P32 = [
    ['earth', '교실 분리수거가 엉망이라 결국 다 일반 쓰레기가 돼요', '분리수거함에 음식물이 묻은 컵이 섞여 있어서 당번이 그냥 한꺼번에 버려요.', '학교 전체 쓰레기 문제예요.'],
    ['school', '체육복 갈아입을 곳이 마땅치 않아요', '탈의실이 멀어서 화장실에서 갈아입다 보니 늦어요.', '체육 시간마다 모두가 겪어요.'],
    ['daily', '시험 기간마다 스트레스 때문에 잠을 못 자요', '시험 일주일 전부터 불안해서 잠이 안 와요.', '많은 친구들이 비슷하다고 해요.'],
    ['future', 'AI가 일자리를 바꾸면 우리는 무엇을 준비해야 하지?', '뉴스에서 AI가 직업을 없앤다는 얘기를 들으면 불안해요.', '우리 세대 모두의 미래 문제예요.'],
    ['town', '학교 가는 길 인도가 좁고 차가 너무 쌩쌩 달려요', '아침마다 차랑 학생이 뒤엉켜서 위험해요.', '등굣길 안전은 모두의 문제예요.'],
    ['digital', '게임 과금 때문에 친구 사이가 서먹해져요', '과금 많이 한 친구만 같이 노는 분위기가 있어요.', '게임을 하는 친구가 많아요.'],
    ['school', '도서관이 점심시간에만 열어서 이용하기 어려워요', '책을 빌리고 싶어도 점심에는 밥 먹고 나면 시간이 없어요.', '책 읽고 싶은 학생 모두의 문제예요.'],
    ['daily', '아침을 못 먹고 와서 3교시면 배가 너무 고파요', '늦게 일어나서 아침을 거르는 날이 많아요.', '건강과 집중력 문제예요.'],
    ['earth', '학교에 그늘진 쉼터가 없어요', '운동장에 나무 그늘이 거의 없어서 여름엔 나갈 수가 없어요.', '모두가 쓰는 공간이에요.'],
    ['digital', '개인정보가 담긴 사진을 함부로 올리는 일이 많아요', '친구 얼굴이 나온 사진을 허락 없이 스토리에 올려요.', '누구나 피해자가 될 수 있어요.'],
  ];
  var P33 = [
    ['school', '사물함이 너무 작아서 교과서가 다 안 들어가요', '교과서랑 체육복을 넣으면 꽉 차서 문이 안 닫혀요.', '모든 학생이 매일 겪어요.'],
    ['daily', '주말에도 학원 때문에 쉴 시간이 없어요', '토요일에도 학원 두 개를 가요. 쉬는 날이 없어요.', '많은 친구들이 그래요.'],
    ['town', '밤에 학원 끝나고 오는 길이 너무 어두워요', '가로등이 띄엄띄엄 있어서 무서워요.', '밤길 안전 문제예요.'],
    ['digital', '가짜 뉴스를 그대로 믿고 퍼뜨리는 친구들이 많아요', '숏폼에서 본 걸 사실처럼 말해요.', '누구나 속을 수 있어요.'],
    ['earth', '급식에 고기가 너무 많아 탄소가 걱정돼요', '고기 반찬이 매일 나와요. 채식 메뉴는 거의 없어요.', '기후 위기와 연결된 문제예요.'],
    ['future', '진로 체험이 너무 형식적이에요', '체험 날 영상만 보고 끝나서 별로 도움이 안 돼요.', '진로를 정해야 하는 모두의 문제예요.'],
    ['school', '복도에서 뛰는 친구들 때문에 부딪힐 뻔해요', '쉬는 시간마다 복도가 운동장 같아요.', '안전 문제예요.'],
    ['daily', '용돈이 금방 떨어져서 친구들과 놀기 어려워요', '편의점·노래방 몇 번 가면 끝이에요.', '친구 관계와도 연결돼요.'],
    ['school', '수행평가가 한 주에 몰려서 너무 힘들어요', '어떤 주는 수행평가가 다섯 개나 겹쳐요.', '모든 학년이 겪어요.'],
    ['digital', '잘 때도 알림이 계속 와서 잠을 깨요', '단톡방 알림이 새벽에도 와요.', '수면 건강 문제예요.'],
  ];
  var CMTS = ['나도 진짜 공감해!', '이거 매일 겪는 일이야 ㅠㅠ', '설문으로 진짜 몇 명인지 알아보면 좋겠다', '해결 방법 같이 생각해 보자', '1학년 때부터 그랬어', '선생님들도 아실까?', '우리 반만 그런 줄 알았는데', '이건 꼭 모둠 주제가 됐으면 좋겠다'];

  function board(tree, ban, list, likeW) {
    var probs = {}, likes = {}, cmts = {}, keys = [];
    list.forEach(function (p, i) {
      var n = (i * 2) % 25 + 1, id = sid(ban, n), k = 'demo_' + ban.replace('-', '') + '_' + (i < 9 ? '0' : '') + (i + 1);
      probs[k] = { id: id, name: nm(id), num: n, cat: p[0], title: p[1], story: p[2], who: p[3], createdAt: at(i * 1.3), updatedAt: at(i * 1.3) };
      keys.push(k);
      var nL = Math.max(0, Math.round(likeW(i) + rnd() * 3)), L = {};
      for (var j = 0; j < nL; j++) { var who = sid(ban, (n + 3 + j * 4) % 25 + 1); if (who !== id) L[who] = true; }
      if (Object.keys(L).length) likes[k] = L;
      var nC = Math.floor(rnd() * 3) + (i < 5 ? 1 : 0), C = {};
      for (var c = 0; c < nC; c++) { var cw = sid(ban, (n + 7 + c * 5) % 25 + 1); C['c' + c] = { id: cw, name: nm(cw), text: pick(CMTS), ts: at(i * 1.3 + 2 + c) }; }
      if (nC) cmts[k] = C;
    });
    tree.problems[ban] = probs; tree.likes[ban] = likes; tree.comments[ban] = cmts;
    return keys;
  }
  // 모둠 만들기: 주제 5개, 제안자를 뺀 나머지 20명을 4명씩
  function groups(tree, ban, topics, open) {
    var probs = tree.problems[ban], authors = topics.map(function (k) { return probs[k].id; });
    var rest = []; for (var n = 1; n <= 25; n++) { var id = sid(ban, n); if (authors.indexOf(id) < 0) rest.push(id); }
    var pk = { _config: { topics: topics, open: !!open, cap: 5 } };
    rest.forEach(function (id, i) { pk[id] = { topic: topics[i % 5], name: nm(id), num: +id.slice(2), ts: at(30 + i * 0.01) }; });
    tree.pick[ban] = pk;
    return topics.map(function (k, i) { return { id: k, no: i + 1, title: probs[k].title, members: [authors[i]].concat(rest.filter(function (x, j) { return j % 5 === i; })) }; });
  }

  // 3-1반 모둠별 질문 [실태 파악, 문제 해결, 내보낸 쪽, 고른 이유, 보여 주기, 보충 설명]
  var Q31 = [
    [{ focus: 'serious', q: '지난 일주일 동안 쉬는 시간에 화장실 줄 때문에 수업에 늦은 적이 몇 번인가요?', type: 'choice', options: ['한 번도 없다', '1~2번', '3~4번', '5번 이상'], multi: false, etc: false },
     { focus: 'pref', q: '화장실 줄을 줄이는 방법 중 가장 마음에 드는 것은 무엇인가요?', type: 'choice', options: ['층별로 덜 붐비는 시간 알려 주기', '쉬는 시간을 1~2분 늘리기', '수업 중에 조용히 다녀오게 허락하기', '화장실 칸 늘리기 건의'], multi: false, etc: true },
     'survey', '우리 반에서는 다들 공감했지만 1·2학년도 그런지는 몰랐다. 해결책을 묻기 전에 문제가 얼마나 퍼져 있는지 먼저 확인하기로 했다.', 'problem', ''],
    [{ focus: 'cause', q: '평일에 늦게 자게 되는 가장 큰 이유는 무엇인가요?', type: 'choice', options: ['휴대폰·영상 보기', '게임', '공부·숙제', '학원 끝나는 시간이 늦어서', '잠이 잘 안 와서'], multi: false, etc: true },
     { focus: 'idea', q: '잠자기 전에 휴대폰을 덜 보려면 어떤 방법이 도움이 될까요?', type: 'open' },
     'survey', '늦게 자는 건 다 아는데, 이유가 폰 때문인지 공부 때문인지에 따라 해결 방법이 완전히 달라져서 원인부터 알아보기로 했다.', 'q', ''],
    [{ focus: 'serious', q: '지난 한 달 동안 버스를 기다리다 학원이나 약속에 늦은 적이 몇 번인가요?', type: 'choice', options: ['버스를 안 탄다', '없다', '1~2번', '3~5번', '6번 이상'], multi: false, etc: false },
     { focus: 'pref', q: '퇴촌 버스 문제를 풀려면 무엇이 가장 필요하다고 생각하나요? (여러 개 골라도 돼요)', type: 'choice', options: ['배차 간격 줄이기 건의', '정류장에 실시간 도착 안내판', '따뜻한 버스 쉼터', '같은 방향 친구끼리 함께 다니기'], multi: true, etc: true },
     'solution', '버스가 안 온다는 건 모두 알고 있어서, 어떤 해결책을 원하는지 알아보고 그걸로 군청에 건의하기로 했다.', 'full', '퇴촌 학교 앞 정류장은 버스가 30~40분에 한 대 와요. 한 대를 놓치면 학원이나 약속에 늦기 쉬워요.'],
    [{ focus: 'cause', q: '급식을 남기는 가장 큰 이유는 무엇인가요?', type: 'choice', options: ['양이 너무 많아서', '입맛에 안 맞아서', '먹을 시간이 부족해서', '배가 안 고파서', '거의 안 남긴다'], multi: false, etc: true },
     { focus: 'idea', q: '급식 잔반을 줄이려면 급식실에 어떤 변화가 있으면 좋을까요? 자유롭게 써 주세요.', type: 'open' },
     'solution', '잔반이 많은 건 눈으로 보이니까, 학생들이 직접 낸 아이디어를 모아서 급식실 선생님께 전해 드리고 싶었다.', 'problem', ''],
    [{ focus: 'serious', q: '지난 한 달 동안 단톡방에서 불편하거나 상처받은 일이 있었나요?', type: 'choice', options: ['자주 있었다', '가끔 있었다', '거의 없었다', '전혀 없었다'], multi: false, etc: false },
     { focus: 'pref', q: '단톡방 문제를 줄이는 데 가장 효과 있을 것 같은 방법은 무엇인가요?', type: 'choice', options: ['반 단톡방 규칙 함께 만들기', '밤 10시 이후 알림 끄기 약속', '익명 고민 상담 창구', '선생님께 쉽게 알리는 방법'], multi: false, etc: true },
     'survey', '선생님들은 단톡방 문제가 얼마나 있는지 잘 모르신다. 숫자로 보여 줘야 함께 해결할 수 있다고 생각했다.', 'full', '단톡방은 선생님이 볼 수 없는 공간이에요. 솔직하게 답해 주면 우리 학교가 더 편한 곳이 될 수 있어요. (이름은 보이지 않아요)'],
  ];
  var W31 = [[30, 38, 20, 12], [52, 14, 14, 10, 10], [18, 12, 30, 26, 14], null, [10, 28, 40, 22]]; // 객관식 응답 비율
  var W31m = [[44, 54, 30, 22]]; // 3모둠 문제 해결(여러 개)
  var IDEA_SLEEP = ['폰을 거실에 두고 자기', '잠금 앱으로 밤 11시 이후 막기', '친구들끼리 일찍 자기 챌린지', '자기 전에 책 읽기', '알림 끄기', '알람을 폰 말고 시계로 맞추기'];
  var IDEA_FOOD = ['양을 내가 고를 수 있게 해 주세요', '좋아하는 메뉴 투표', '먹는 시간을 늘려 주세요', '다 먹으면 스티커 주기', '맛있는 메뉴를 더 자주', '잔반 없는 날 이벤트', '반찬 조금만 받기 줄 따로 만들기'];
  var ETC = ['잘 모르겠어요', '둘 다요', '그냥 그래요'];

  LAB.seedDemo = function () {
    var tree = { problems: {}, likes: {}, comments: {}, pick: {}, q: {}, final: {}, report: {}, contrib: {}, poster: {}, resp: {},
      survey: { _config: { open: true, results: true } }, _seeded: Date.now() };
    // 교사 도움카드 예시 (실제 사이트와 같은 김병선 선생님 카드)
    tree.helpcards = { fd7cbd5e2c08584de05a: { name: '김병선', role: '과학', subjects: ['과학'], grades: ['3'], updatedAt: Date.now(), items: [
      '문제를 해결하는 데 필요한 과학적 근거 검증 및 보충', 'AI 활용한 웹 앱 발표자료 제작', 'AI를 활용한 설문 결과 데이터 정리 (주관식, 객관식 모두 포함)',
      '그외 고오급 AI의 도움이 필요한 모든 것들에 도움 제공 가능', '미래 사회, AI, 기술 관련된 논제 무한 토론 가능'] } };

    // ----- 3-1: 끝까지 -----
    var k31 = board(tree, '3-1', P31, function (i) { return [14, 12, 11, 10, 9][i] || Math.max(0, 7 - i * 0.6); });
    var G31 = groups(tree, '3-1', k31.slice(0, 5), false);
    tree.q['3-1'] = {}; tree.final['3-1'] = {};
    G31.forEach(function (g, i) {
      var Q = Q31[i], drafts = {};
      g.members.forEach(function (m, j) {
        if (j > 3) return;
        drafts[m] = { survey: Object.assign({}, Q[0], { q: j === 0 ? Q[0].q : Q[0].q.replace('인가요?', '일까요?') }), solution: j % 2 ? Q[1] : { focus: Q[1].focus, q: '', type: 'open' }, name: nm(m), updatedAt: at(50 + j) };
      });
      tree.q['3-1'][g.id] = drafts;
      var by = g.members[0], which = Q[2], q = Q[which === 'survey' ? 0 : 1];
      tree.final['3-1'][g.id] = {
        survey: Object.assign({ by: by, byName: nm(by), at: at(60) }, Q[0]),
        solution: Object.assign({ by: by, byName: nm(by), at: at(61) }, Q[1]),
        out: { which: which, reason: Q[3], show: Q[4], note: Q[5], hasImg: false, q: q, no: g.no, title: g.title, story: tree.problems['3-1'][g.id].story, submitted: true, by: by, byName: nm(by), at: at(62) },
      };
    });
    // 3-1 보고서·포스터 (1모둠은 다 씀, 2모둠은 쓰는 중)
    var g1 = G31[0], g2 = G31[1];
    var rep = function (txt, who) { return { text: txt, by: who, byName: nm(who), at: at(120) }; };
    tree.report['3-1'] = {};
    tree.report['3-1'][g1.id] = {
      problem: rep('3층 화장실은 칸이 3개뿐이라 쉬는 시간마다 줄이 복도까지 선다. 기다리다 수업에 늦는 일이 잦아서, 이 문제가 우리 반만의 일인지 학교 전체의 일인지 알아보고 싶었다.', g1.members[0]),
      method: rep('전교생에게 "지난 일주일 동안 화장실 줄 때문에 수업에 늦은 적이 몇 번인가요?"를 물었다(① 심각성 질문). 해결책보다 문제가 얼마나 퍼져 있는지 먼저 확인하는 게 중요하다고 모둠에서 결정했다.', g1.members[1]),
      data: rep('(예시) 응답자의 약 70%가 일주일에 한 번 이상 늦은 적이 있다고 답했다. 특히 "3~4번", "5번 이상"이라고 답한 학생도 셋 중 하나쯤 되었다.', g1.members[2]),
      insight: rep('예상보다 훨씬 많은 학생이 겪고 있었다. 문제는 칸 수보다 "모두 같은 시간에 몰린다"는 점이라고 생각한다. 다만 몇 층을 쓰는지는 묻지 않아서 층별 차이는 알 수 없었다.', g1.members[3]),
      solution: rep('[우리 힘으로] 층별 화장실이 덜 붐비는 시간을 조사해 화장실 앞에 붙인다. [학교 도움으로] 학생회를 통해 점심시간 화장실 이용 캠페인을 건의한다.', g1.members[4]),
      spread: rep('포스터를 층별 화장실 앞과 급식실 입구에 붙이고, 학생회 회의에 결과표를 들고 가서 건의한다.', g1.members[0]),
    };
    tree.report['3-1'][g2.id] = {
      problem: rep('밤늦게까지 휴대폰을 보다 잠을 못 자서 1교시에 조는 친구가 많다.', g2.members[0]),
      method: rep('늦게 자는 원인을 알아야 해결책이 달라지므로 "늦게 자게 되는 가장 큰 이유"를 물었다(② 원인 질문).', g2.members[1]),
    };
    tree.contrib['3-1'] = {}; tree.contrib['3-1'][g1.id] = {};
    g1.members.forEach(function (m, j) { tree.contrib['3-1'][g1.id][m] = { text: ['문제 상황 정리와 사진 찍기', '설문 질문 다듬기', '결과 표 정리', '실태 분석 토의 진행', '해결 방안 아이디어 정리'][j], name: nm(m), at: at(125) }; });
    tree.poster['3-1'] = {}; tree.poster['3-1'][g1.id] = { link: 'https://www.canva.com/', title: '화장실 줄, 3분만 비켜 가요!', by: g1.members[0], byName: nm(g1.members[0]), at: at(130) };

    // ----- 3-2: 질문 만드는 중 -----
    var k32 = board(tree, '3-2', P32, function (i) { return [11, 10, 9, 8, 8][i] || Math.max(0, 6 - i * 0.5); });
    var G32 = groups(tree, '3-2', k32.slice(0, 5), false);
    tree.q['3-2'] = {}; tree.final['3-2'] = {};
    var s32 = { focus: 'serious', q: '우리 반 분리수거함에 다른 쓰레기가 섞여 있는 걸 얼마나 자주 보나요?', type: 'choice', options: ['거의 매일', '일주일에 2~3번', '가끔', '본 적 없다'], multi: false, etc: false };
    G32.forEach(function (g, i) {
      var d = {}; g.members.slice(0, i < 2 ? 4 : 2).forEach(function (m, j) {
        d[m] = { survey: { focus: 'serious', q: g.title.replace(/요$/, '') + ' — 얼마나 자주 겪나요?', type: 'choice', options: ['매일', '자주', '가끔', '없다'] }, solution: { focus: 'idea', q: '', type: 'open' }, name: nm(m), updatedAt: at(70 + j) };
      });
      tree.q['3-2'][g.id] = d;
    });
    var b32 = G32[0].members[0];
    tree.final['3-2'][G32[0].id] = { survey: Object.assign({ by: b32, byName: nm(b32), at: at(80) }, s32),
      out: { which: 'survey', reason: '분리수거가 안 된다는 걸 숫자로 보여 줘야 캠페인에 힘이 실린다고 생각했다.', show: 'problem', note: '', hasImg: false, q: s32, no: 1, title: G32[0].title, story: tree.problems['3-2'][G32[0].id].story, submitted: true, by: b32, byName: nm(b32), at: at(81) } };

    // ----- 3-3: 문제 게시판만 -----
    board(tree, '3-3', P33, function (i) { return [9, 8, 7, 7, 6, 5, 5, 4, 3, 2][i] || 1; });

    // ----- 전교생 설문 응답 (1~3학년, 반마다 몇 명씩) -----
    var items = [];
    G31.forEach(function (g, i) { items.push({ key: '3-1_' + g.id, q: tree.final['3-1'][g.id].out.q, i: i }); });
    items.push({ key: '3-2_' + G32[0].id, q: s32, i: 9 });
    var roster = LAB.fakeRoster();
    Object.keys(roster).forEach(function (id) {
      var s = roster[id];
      if (rnd() < (s.grade === 3 ? 0.55 : 0.4)) {
        var ans = {};
        items.forEach(function (it) {
          if (rnd() < 0.05) return; // 몇 개는 건너뜀
          var q = it.q;
          if (q.type === 'open') ans[it.key] = it.i === 1 ? pick(IDEA_SLEEP) : pick(IDEA_FOOD);
          else if (q.multi) { var sel = []; W31m[0].forEach(function (w, j) { if (rnd() * 100 < w) sel.push(j); }); if (!sel.length) sel.push(0); ans[it.key] = { sel: sel }; }
          else {
            var w = it.i === 9 ? [35, 30, 25, 10] : W31[it.i];
            var o = { sel: [weighted(w)] }; if (q.etc && rnd() < 0.06) o = { sel: [], etc: pick(ETC) }; ans[it.key] = o;
          }
        });
        tree.resp[id] = { grade: s.grade, ban: s.ban, answers: ans, done: rnd() < 0.93, updatedAt: at(100 + rnd() * 20) };
      }
    });
    return LAB.put('', tree);
  };
  // 체험 데이터가 없으면 한 번 만들어 둔다 (처음 들어온 선생님이 빈 화면을 보지 않게)
  LAB.ensureDemo = function () {
    return LAB.get('_seeded').then(function (v) { return v ? null : LAB.seedDemo(); });
  };
  LAB.resetDemo = function () { return LAB.del('').then(function () { return LAB.seedDemo(); }); };
})();
