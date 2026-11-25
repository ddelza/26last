# 물음표에서 느낌표로 (가칭) — 2026 광수중 3학년 학기말 프로젝트

정적 사이트(GitHub Pages) + Firebase RTDB(gwangsu-on) REST. 빌드 없음. 데이터 경로·구조는 `lab.js` 맨 위 주석 참고.
프로젝트 이름은 `lab.js`의 `LAB.NAME` / `LAB.SUB` 만 바꾸면 전체 반영.

| 단계 | 페이지 |
|---|---|
| 1 문제 찾기 | s1-board.html (문제 올리기 — 한 사람 최대 5개·공감·댓글), s1-pick.html (선착순 모둠) |
| 2 질문 다듬기 | s2-question.html |
| 3 광수에게 묻다 | survey.html (전교생), s3-result.html |
| 4 해결하고 퍼뜨리기 | s4-report.html, s4-poster.html |
| 교사 | admin.html (비번 별도) |

교사 계정(3000/김병선)으로 로그인하면 학생 페이지에 `?ban=3-2&g=학번`으로 아무 반·모둠 화면이나 볼 수 있음. 테스트는 반 'T'(교사 테스트)에서 하고 끝나면 `last26/*/T` 경로별로 삭제.

## 🧪 선생님 체험판 — https://ddelza.github.io/26last/demo/
- `demo/` 폴더는 **자동 생성**이에요. 루트 html 을 고친 뒤 `python make-demo.py` 를 한 번 돌리고 함께 커밋해요.
- 체험판은 `last26demo` 데이터를 써서 실제 수업 데이터(`last26`)와 완전히 분리돼 있어요. 학생 명단도 가짜 이름(`LAB.fakeRoster`).
- 예시 데이터는 `demo-seed.js` (3-1 끝까지 / 3-2 질문 중 / 3-3 게시판만). 관리 페이지 "🔄 체험 데이터 처음으로"로 되돌려요.
- 선생님은 이름만 넣으면 교사 권한(관리 페이지 비밀번호 없음), 또는 가짜 학생 한 명으로 들어가 학생 화면을 체험해요.
