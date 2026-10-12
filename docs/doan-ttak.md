# 도안 뚝딱 · 교실용 인쇄 도안 제작실

뚝딱교실 홈 **자료·기록 → 도안 뚝딱**에 두 가지 기능을 제공합니다.

## 한글 간편 제작실

HTML5 / SVG / JavaScript로 구현했으며, 외부 네트워크·로그인·유료 서비스를 사용하지 않습니다.

- 여섯 가지 시작 도안: 낱말 그림카드, 좋아요·싫어요 감정카드, 하루 순서표, 이름표, 도형 탐험 활동지, 빈 A4
- 요소(글씨, 사각형, 원, 삼각형, 별, 직선) 추가 / 터치 또는 마우스 드래그
- 선택한 요소의 위치·크기·색·테두리·글씨 편집, 앞·뒤 순서 변경, 복제 및 삭제
- 실행 취소·다시 실행 (최대 40단계), 화살표 키와 Shift+화살표로 이동 (PC)
- 결과물: A4 인쇄 / 브라우저 'PDF로 저장' / 투명하지 않은 PNG / 편집 가능한 SVG
- JSON 원본 내보내기 / 불러오기 (180KB 한도). 자동 클라우드 업로드 없음
- 사용자 입력 텍스트를 SVG/XML에 안전하게 이스케이프하고 불러온 원본의 요소 유형과 색상을 검증
- A4 가로 210mm × 세로 297mm 한 페이지 도안만 지원
- 학교 공용 기기에서 학생 실명 자료는 사용자 스스로 보관·삭제 필요

도안의 예시 그림은 SVG 기본 도형으로 그린 것입니다. 외부 캐릭터/로고 에셋이나 AI 이미지 생성에 의존하지 않습니다.

## VectorCraft 고급 편집기

오픈소스 VectorCraft v0.10.0 공식 웹 빌드(WebAssembly)를 같은 출처에서 iframe으로 제공합니다.
`?lang=ko` 쿼리를 이용해 기존 한국어 번역을 우선합니다. 공식 한국어 번역 카탈로그는 있으나, 아직 일부 메뉴·한글 표시·모바일에서의 실행이 모두 검증된 것은 아닙니다.

간편 제작실의 작업은 원본 VectorCraft 문서 형식으로 자동 전송되지 않습니다. SVG 파일로 내보낸 뒤 VectorCraft에서 열어야 합니다. 웹 버전 기능에 따라 SVG 가져오기가 제한될 수 있으므로 시험이 필요합니다.

## 설치

`.github/workflows/vendor-vectorcraft-web.yml`가 `main`에 병합되면 자동으로 공식 릴리스를 내려받고 검사한 후 **VectorCraft만** `assets/artcraft/vectorcraft/` 폴더에 저장합니다.

- 공식 릴리스: https://github.com/storytold/vectorcraft/releases/tag/v0.10.0
- 웹 파일: `vectorcraft-web-0.10.0.zip`
- 검증값 SHA-256: `aaf1136d4e76606085294942563207111ab7f57cbe6d5f97f03573fa14d37968`
- LICENSE-MIT, LICENSE-APACHE, NOTICE 포함. 별도 설치 스크립트: `bash scripts/install-vectorcraft-web.sh`
- WASM 및 JS는 상대 경로를 사용하여 GitHub Pages 프로젝트 하위 경로에서 실행
- 일부 파일이 GitHub Pages 배포 크기 및 비용에 영향을 줄 수 있으므로 Actions 배포 확인 필요

## 검수 항목

- [ ] `npm test`의 도안 테스트와 기존 테스트 모두 통과
- [ ] GitHub Actions의 공식 VectorCraft 검증·설치 성공
- [ ] `main`에 벡터 편집기 index.html/JS/WASM/라이선스 업로드 확인
- [ ] GitHub Pages 게시 성공
- [ ] iPhone/태블릿에서 드래그, 글씨 입력, PNG 및 SVG 저장
- [ ] PC에서 인쇄 미리보기 A4 한 장, PDF 저장
- [ ] 불러온 JSON에 인라인 HTML이 있어도 화면에 실행되지 않음
- [ ] VectorCraft 고급 편집기 메뉴 언어·폰트 및 SVG 열기/저장 수동 확인

## 라이선스

- VectorCraft 원본: https://github.com/storytold/vectorcraft
- SVG 간편 제작실 코드: ProjectGulliver 자체 개발
