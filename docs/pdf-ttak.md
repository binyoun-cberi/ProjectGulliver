# PDF 뚝딱 — 교사용 브라우저 PDF 제작실

뚝딱교실의 `자료·기록 → PDF 뚝딱` 페이지는 두 도구를 함께 제공합니다.

1. **한국어 간편 도구** — PDF 합치기, 선택 페이지 추출, 일정 페이지마다 나누기, 페이지 회전
2. **PdfCraft 고급 편집** — 공식 PdfCraft v0.7.1 WebAssembly를 동일 출처 iframe으로 실행

## 구현 범위

- 모든 간편 처리와 PdfCraft 편집은 사용자의 브라우저 내부에서 수행됩니다. 서버에 PDF가 전송되거나 저장되지 않습니다.
- 서버 라이브러리, 계정, 인공지능 API, 유료 크레딧이 필요 없습니다.
- 간편 도구는 pdf-lib v1.17.1로 PDF 페이지를 복사합니다. 원본 파일은 수정되지 않습니다.
- 합치기: 목록 순서대로 전체 페이지를 병합 (위/아래 버튼으로 순서 변경).
- 골라 저장: 입력한 페이지를 원하는 순서로 새로운 PDF에 복사. 예: `3,1-2`.
- 나누기: 1~20개 묶음으로 분할. 각 파일을 개별 링크에서 다운로드.
- 회전: 선택 페이지 또는 전체 페이지를 90°, 180°, 270° 회전.
- 완성 결과는 사용자 기기에서만 Blob URL로 잠시 유지. 페이지를 새로 열거나 다른 작업을 하면 폐기.
- PDF 원본이 가진 전자서명, 일부 양식, 주석/링크 등이 pdf-lib 구조 복사에 의해 완전히 보존되지 않을 수 있습니다. 민감한 공문서는 반드시 결과를 점검하세요.
- 암호화·손상된 PDF는 처리가 실패할 수 있습니다.
- 큰 파일(70MB 초과) 또는 합계 150MB 초과를 거부하며, 결과 파일 나누기는 최대 20개로 제한.
- PdfCraft 고급 편집기는 영어 UI입니다. **PdfCraft v0.7.1에는 공식 한국어 번역 카탈로그가 없습니다.** 한국어화했다고 표시하지 않습니다.
- iPhone Safari에서 고급 편집기 UI는 데스크톱 중심이라 사용성이 제한될 수 있습니다.

## 설치 및 배포

자동 설치 workflow: `.github/workflows/vendor-pdf-ttak.yml`.
수동 설치: 저장소 루트에서 `bash scripts/install-pdf-ttak.sh`.

고정된 2개 공급망 아카이브만 가져옵니다.

- PdfCraft v0.7.1 공식 웹 릴리스: `https://github.com/storytold/pdfcraft/releases/tag/v0.7.1`.
  SHA-256 `2e58067125b2c14d92d50888a6a03351302065ff4b99c0914892a078f05dfd66`.
  설치 위치: `assets/artcraft/pdfcraft/`.
  MIT 또는 Apache-2.0 라이선스, NOTICE, ATTRIBUTION 포함.
- pdf-lib 1.17.1 공식 npm 패키지: `https://registry.npmjs.org/pdf-lib/-/pdf-lib-1.17.1.tgz`.
  npm registry에서 발행된 SHA-512(integrity/base64) `V/mpyJAoTsN4cnP31vc0wfNA1+p20evqqnap0KLoRUN0Yk/p3wN52DOEsL4oBFcLdb76hlpKPtzJIgo67j/XLw==`.
  설치 위치: `vendor/pdf-lib/pdf-lib.min.js`.
  MIT LICENSE 포함.

설치 스크립트는 두 해시를 확인한 후에만 배포 경로로 파일을 옮깁니다. GitHub Actions는 파일 크기를 확인하고 **해당 자산 폴더만** main에 커밋합니다. 기존 `그림 뚝딱`, 수업도구, API/Worker 코드는 변경하지 않습니다.

## 검수 체크리스트

- [ ] `npm test` — `tests/pdf-ttak.test.cjs` 페이지 범위·나누기 테스트
- [ ] GitHub Actions `Install PDF Ttak web libraries` 성공 확인
- [ ] GitHub Pages 빌드 및 배포 성공, `vendor/pdf-lib/pdf-lib.min.js` 및 PdfCraft WASM URL 200
- [ ] PC: 2개 이상의 PDF 합치기 후 페이지 순서·총 페이지 확인
- [ ] PC: `3,1-2` 골라 저장, 2쪽씩 나누기, 90° 회전 결과 확인
- [ ] iPhone Safari: PDF 선택, 화살표 정렬, 파일 다운로드 확인
- [ ] PdfCraft 고급 편집: 열기, PDF 열람, 파일 저장 확인
- [ ] 과거 '그림 뚝딱' 정상 실행, 기존 교실 관리 기능 영향 없음

## 출처

- PdfCraft: https://github.com/storytold/pdfcraft
- pdf-lib: https://github.com/Hopding/pdf-lib
