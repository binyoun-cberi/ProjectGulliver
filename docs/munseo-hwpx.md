# 문서 뚝딱 · HWPX 저장 확장

## 제공되는 기능
문서 뚝딱의 기존 가정통신문·학급 소식·수업 활동계획·놀이 관찰기록·협의회 기록·빈 문서 6종에 **HWPX 저장**을 추가합니다.

저장 버튼:
- **HWPX 저장**: 국내 한글 문서의 개방형 포맷(O​WPML/ZIP+XML). 브라우저 안에서 문서를 만들어 내려받습니다.
- **DOCX 저장**: 기존 Word/한글 호환 DOCX 저장 유지.
- **PDF / 인쇄**: 기존 브라우저 인쇄·PDF 저장 유지.
- **편집 원본 JSON**: 기존 문서 뚝딱에서 다시 불러와 수정.

HWPX로 내보내는 내용: 제목, 부제목, 본문 줄 바꿈, 소제목, 글머리표 목록, 표, PNG/JPEG 이미지와 사진 설명, 구분선.
원본 JSON에서 유효성 검사를 완료한 데이터만 넘기며 HTML 문자열로 만들 때 XML/HTML 특수문자를 이스케이프합니다. 외부 이미지 URL은 포함하지 않습니다.

## 사용한 오픈소스와 한컴 공식 자료

**한글과컴퓨터 공식 코드/문서 참조**
- https://github.com/hancom-io/hwpx-owpml-model (OWPML의 문서 구성/추출/저장 모델, Apache-2.0, C++)
- https://tech.hancom.com/hwpxformat/ (HWPX 형식 및 ZIP/XML 패키지 설명)

**브라우저 변환 모듈**
- https://github.com/ssabro/hwpxjs 의 `@ssabrojs/hwpxjs` v0.4.0
- 라이선스: MIT (별도 `vendor/hwpxjs/LICENSE` 포함)
- 인라인 의존성을 포함한 공식 브라우저 ESM 번들 `dist/browser/hwpxjs.browser.mjs` 사용
- 설치 위치: `vendor/hwpxjs/hwpxjs.browser.mjs`

중요: **실제 HWPX 생성에는 한컴 공식 C++ 라이브러리를 웹용으로 이식한 것이 아니라, 공식 규격을 참조한 독립적인 오픈소스 JavaScript 구현을 사용**합니다. 한컴에서 발행한 완성형 HWP 웹 편집기라고 표현해서는 안 됩니다.

## 구현 방식
- 문서 모델(`munseo-core.js`) 검증 → `munseo-hwpx-core.js`가 텍스트·표·사진을 안전한 HTML로 변환 → `munseo-hwpx.js`가 자체 호스팅된 `htmlToHwpx`로 OWPML ZIP 바이트를 생성.
- 모든 처리는 사용자 브라우저 내부에서 실행. 외부 API·클라우드 업로드·계정 불필요.
- 저장 버튼을 누를 때에만 0.4.0 ESM 런타임을 불러오므로 기존 DOCX/PDF 편집 성능에 영향 최소화.
- npm 고정 버전을 `npm pack --ignore-scripts`로 받아 npm SHA-512 integrity를 재검사한 후에만 `vendor/hwpxjs/`에 반영. CI가 실제 생성·읽기/쓰기·XML ZIP 구조 검사를 통과해야만 `main`에 자산 커밋.

## 파일 호환성 범위

| 형식 | 저장 | 기존 파일 불러와 편집 |
|---|---|---|
| HWPX | 추가 | 아직 지원하지 않음 |
| DOCX | 기존 | 아직 지원하지 않음 |
| PDF | 인쇄 대화상자 이용 | PDF 뚝딱 별도 |
| 기존 바이너리 HWP | 지원하지 않음 | 지원하지 않음 |
| 뚝딱교실 JSON | 기존 | 기존 |

**한컴오피스에서 직접 파일을 열어 검사하는 과정은 별도 수동 검수로 남습니다.**
자동 검증은 유효한 ZIP/OWPML 구조, 주요 XML, 한글 내용 포함, 라이브러리의 다시 읽기 등을 확인합니다.
표 셀 병합, 쪽 여백, 머리글·꼬리글, 표 선·서식, 이미지 크기와 줄 간격은 원본 브라우저 미리보기와 완전히 일치하지 않을 수 있습니다.
한컴오피스 특정 버전에서 열리지 않는다면 정상 저장이라 단정하지 않고 호환성 문제로 추적해야 합니다.

## 검증 절차

- [ ] GitHub Actions `Install and validate 문서 뚝딱 HWPX export` 성공.
- [ ] 생성된 `.hwpx`의 첫 ZIP 엔트리 mimetype은 STORE/무압축, XML 파싱·manifest/spine 검사.
- [ ] 6종 템플릿, 특수문자 XML 이스케이프, 본문·표·사진 OWPML 확인.
- [ ] `main`의 `vendor/hwpxjs/`에 JS 및 MIT 라이선스 설치, Pages 배포 성공.
- [ ] Windows 한컴오피스에서 가정통신문·관찰기록·사진·표 파일을 열어 검수.
- [ ] 기존 `DOCX 저장`, `PDF / 인쇄`, 문서 원본 JSON 및 다른 제작실 회귀 검수.

