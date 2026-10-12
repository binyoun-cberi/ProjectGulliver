# 문서 뚝딱: 한글 문서 제작실과 WordCraft 고급 편집

뚝딱교실 **자료·기록 → 문서 뚝딱**으로 진입합니다.

## 교사에게 필요한 간편 문서

- 가정통신문, 학급 소식지, 수업 활동계획, 놀이 관찰기록, 협의회 기록, 빈 문서의 6가지 템플릿.
- A4 미리보기에서 소제목, 본문, 목록, 표, JPG·PNG 사진을 직접 클릭해 편집.
- 블록(문서 요소) 추가/삭제/정렬, 4가지 강조 색상, 실행 취소/다시 실행.
- 브라우저 인쇄의 PDF 저장/종이 인쇄, Word·한글에서 열 수 있는 `.docx` 저장.
- 다시 편집하기 위한 자체 `.json` 파일 저장·열기. 자동 저장/외부 파일 업로드 없음.
- 사진은 각각 최대 2 MB(원본 base64 3 MB 이내), 전체 약 20 MB 제한. 문서 요소 최대 90개. JSON 최대 25 MB.
- 텍스트는 DOM `textContent`로 표시하며 클립보드 붙여넣기는 서식 없는 글자만 허용.
- `.hwp` 파일 생성과 다른 Word 문서의 DOCX 편집/가져오기는 **지원하지 않습니다**.
- 긴 문서는 인쇄 시 여러 A4장에 걸쳐 출력될 수 있습니다.
- 생성된 DOCX와 웹 A4 편집 미리보기는 서로 다르게 배치될 수 있어 실제 파일을 확인해야 합니다.
- 사진을 DOCX로 내보낼 때 고정된 화면 상자 안에 들어가므로 원본 가로세로비가 다르면 늘어나 보일 수 있습니다. 향후 개선 대상입니다.
- 표, 글자 크기, 목록의 복잡한 Word 서식과 편집 중 상태는 완전히 1:1 호환되지 않습니다.

## WordCraft 고급 편집기

- 공식 ArtCraft WordCraft **v0.6.1**의 브라우저/WebAssembly 배포 파일을 프로젝트 자체 경로에 포함해 iframe으로 실행.
- 고급 편집기 원본에 한국어 번역 카탈로그가 없으므로 영어 UI 상태임을 정직하게 안내.
- 간편 제작실의 상태는 고급 편집기로 자동 전송되지 않음. DOCX를 저장한 뒤 고급 편집기에서 직접 열어야 함.
- PC 및 태블릿에서 사용 권장.

## 출처 및 라이선스

- WordCraft 공식 릴리스: https://github.com/storytold/wordcraft/releases/tag/v0.6.1
- `wordcraft-web-0.6.1.zip` SHA256 `85e458cb5adaa75afa871a9858c735ef7fd1e05741c6bf5d444dc09a1eb29e0a`
- WordCraft 배포 시 MIT/Apache-2.0 LICENSE, NOTICE, ATTRIBUTION 포함.
- DOCX 생성: `docx` v9.10.0 (MIT), https://github.com/dolanmiu/docx. 정확한 npm 버전과 레지스트리의 SHA-512 integrity 검증으로 가져온 브라우저 번들을 사용.
- 파일: `assets/artcraft/wordcraft/`, `vendor/docx/`
- 자동 설치: `.github/workflows/vendor-munseo-ttak.yml`, 수동: `bash scripts/install-munseo-ttak.sh`
- 외부 CDN 런타임 연결 없이 모두 GitHub Pages 정적 파일에서 제공.

## 기능 검수

- [ ] Node 단위 테스트 `node --test tests/munseo-ttak.test.cjs` 통과.
- [ ] GitHub Actions에서 실제 DOCX 생성 및 `word/document.xml` 한글 XML 검증 통과.
- [ ] GitHub Pages 최신 소스 배포 성공.
- [ ] PC 브라우저: 가정통신문 수정, 표 수정, DOCX 저장 후 Word에서 열기.
- [ ] PC 브라우저: PDF 인쇄에서 A4 여러 장 처리 확인.
- [ ] iPhone Safari: 한글 입력, 사진 첨부, DOCX 파일 다운로드.
- [ ] WordCraft 고급 편집기 웹 실행, 저장·열기.
- [ ] 기존 그림·PDF·도안·발표 제작실 회귀 검사.

주의: 학생 실명이 들어간 문서의 원본·DOCX·PDF는 사용자가 저장한 기기에서 관리해야 합니다.
