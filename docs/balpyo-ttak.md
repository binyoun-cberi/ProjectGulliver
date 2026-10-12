# 발표 뚝딱: 한글 수업 발표 제작실

뚝딱교실 **자료·기록 → 발표 뚝딱**에서 수업용 슬라이드를 만들고 발표합니다.

## 한국어 간편 제작실

- 제공하는 시작 자료: 수업 시작과 마무리, 그림으로 이야기하기, 우리 반 퀴즈, 하루 일과 소개, 빈 발표.
- 16:9 슬라이드 편집: 표지, 설명·목록, 질문, 사진, 마무리.
- 4가지 색상 테마, 슬라이드 복제·삭제·정렬, 제목과 내용, 작은 제목, 진행 메모.
- 기기 파일에서 선택한 JPG/PNG 이미지를 슬라이드에 삽입하고 발표할 수 있습니다. 사진은 사용자 브라우저 메모리에서 처리하며 서버로 업로드하지 않습니다.
- 발표 모드: 키보드 방향키/PageUp/PageDown/Esc, iPhone/태블릿 좌우 스와이프, 화면의 이전·다음 버튼.
- 편집 가능한 JSON 저장·불러오기 (자동 저장 없음, 공용 기기 학생 개인정보 취급 주의).
- `PPTX 저장`: 별도 CDN 없이 **자체 호스팅한 PptxGenJS**로 네이티브 편집 가능한 PowerPoint 슬라이드를 생성. 파워포인트와 파일 호환 가능하나 렌더링 차이가 있을 수 있으므로 검수합니다.
- `PDF / 인쇄`: 인쇄 창의 'PDF로 저장' 사용. 별도의 PDF 서버 처리 없음.
- 진행 메모는 자체 JSON에 포함되지만 **PPTX나 PDF 출력에 포함되지 않습니다**.
- 사용자 개인정보는 업로드/자동 저장하지 않으며, 텍스트 필드는 `textContent`만 사용해 화면에 표시합니다. 이미지 크기/URL/프로젝트 슬라이드 수를 검증합니다.
- 최대 40장, 이미지 각 2MiB, 발표 원본 JSON 45MiB 이내.

## 고급 프레젠테이션 편집

- ArtCraft DeckCraft v0.6.1 공식 WebAssembly 배포본을 같은 출처에 설치.
- 브라우저에서 `assets/artcraft/deckcraft/index.html?blank` 실행.
- 원본 DeckCraft는 데스크톱 중심이고 일부 웹 기능이 제한될 수 있습니다. **간편 제작실과 상태를 자동 공유하지 않으므로** PPTX 저장 후 DeckCraft에서 직접 파일을 열어야 합니다.
- DeckCraft 고급 편집기는 한국어 번역 적용을 보장하지 않습니다. 이번 작업에서 제공하는 완전한 한국어는 간편 제작실입니다.

## 공급망 및 파일 설치

`.github/workflows/vendor-balpyo-ttak.yml`은 `main`에 처음 병합될 때 실행됩니다.
`scripts/install-balpyo-ttak.sh`를 수동으로 실행해도 됩니다.

- DeckCraft **v0.6.1** ZIP: https://github.com/storytold/deckcraft/releases/tag/v0.6.1
- ZIP SHA-256 `dd76659f643fa98ff79c86bf439bcaeeaaf6bd3a4037a1dc6628c97366862ba1`.
- 설치 경로: `assets/artcraft/deckcraft/` (MIT/Apache-2.0, NOTICE, ATTRIBUTION 포함).
- PptxGenJS browser UMD bundle **v3.12.0**: https://github.com/gitbrent/PptxGenJS/tree/v3.12.0/dist
- 원본 `pptxgen.bundle.js` Git blob SHA-1 `1ff971b3a9684bf3d2592883f1832e6992043154` 확인 후에만 사용 (MIT LICENSE 포함).
- 설치 경로 `vendor/pptxgenjs/`, 외부 CDN 의존하지 않음.

검증을 통과해야 자동 GitHub Actions 봇이 위 2개 경로에만 파일을 커밋합니다. 기존 도구·Cloudflare Worker·학급 데이터는 수정하지 않습니다.

## 검수 확인

- [ ] `npm test` 전체 통과 (테스트는 `tests/balpyo-ttak.test.cjs` 포함)
- [ ] Actions 발표 도구 파일 설치 성공 및 `main` 반영
- [ ] GitHub Pages 빌드 및 게시 성공
- [ ] Chrome/Edge: 템플릿 선택, 슬라이드 편집, PPTX 파일 내려받기·파워포인트에서 열기
- [ ] Safari iPhone: 편집·사진 첨부·발표 좌우 스와이프 및 파일 저장
- [ ] 모든 슬라이드 PDF 인쇄(16:9) 확인
- [ ] DeckCraft 웹 실행, PPTX 가져오기, 인쇄·저장 별도 검증
- [ ] 기존 그림 뚝딱·PDF 뚝딱·도안 뚝딱 회귀 검사

## 오픈소스 출처

- https://github.com/storytold/deckcraft
- https://github.com/gitbrent/PptxGenJS
