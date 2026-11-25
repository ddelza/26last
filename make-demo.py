# 체험판 만들기: 루트의 html 을 demo/ 폴더로 복사하면서 공용 파일 경로만 ../ 로 바꾼다.
#   python make-demo.py      (html 을 고친 뒤 커밋 전에 한 번 실행)
# demo/ 페이지는 lab.js 가 경로(/demo/)를 보고 last26demo 데이터 + 가짜 학생 명단을 쓴다.
import glob, os, re
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, 'demo'); os.makedirs(out, exist_ok=True)
for f in glob.glob(os.path.join(out, '*.html')): os.remove(f)
n = 0
for src in sorted(glob.glob(os.path.join(here, '*.html'))):
    s = open(src, encoding='utf-8').read()
    s = s.replace('href="common.css', 'href="../common.css').replace('src="session.js', 'src="../session.js')
    s, k = re.subn(r'<script src="lab\.js(\?v=\d+)?"></script>', lambda m: '<script src="../lab.js%s"></script>\n<script src="../demo-seed.js?v=1"></script>' % (m.group(1) or ''), s)
    assert k == 1, src
    s = s.replace('<head>', '<head>\n<!-- 자동 생성(make-demo.py) — 여기 말고 상위 폴더 원본을 고칠 것 -->\n<meta name="robots" content="noindex">', 1)
    open(os.path.join(out, os.path.basename(src)), 'w', encoding='utf-8', newline='\n').write(s); n += 1
print('demo/ 에', n, '개 생성')
