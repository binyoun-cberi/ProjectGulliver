# 그림 뚝딱 · PhotoCraft 셀프 호스팅

뚝딱교실의 **자료·기록 → 그림 뚝딱**은 ArtCraft의 오픈소스 이미지 편집기 PhotoCraft를
뚝딱교실 도메인 안에서 iframe으로 실행합니다. 외부 편집 사이트로 이동하는 링크는 제거했습니다.

## 사용자가 경험하는 동작

1. 뚝딱교실 홈의 **그림 뚝딱**을 엽니다.
2. 서버가 `/assets/artcraft/photocraft/gulliver-install.json`을 제공하면
   **그림 편집 시작** 버튼으로 자체 PhotoCraft를 실행합니다.
3. 이미지 열기, 편집 및 파일 저장/내보내기는 사용자 브라우저에서 처리됩니다.
   별도의 `.exe` 설치, 계정, 유료 크레딧이나 별도 서버 처리가 필요하지 않습니다.
4. WebGPU가 작동하지 않는 환경에서는 **화면이 검다면 호환 모드**를 눌러 WebGL2 모드(`?webgl`)를 시험합니다.
5. 배포 파일이 없는 경우 외부 사이트에 자동 연결하지 않고 오류 안내와 재시도 버튼을 보여 줍니다.

학생 사진·성명은 별도 외부 편집 사이트에 자동 업로드하지 않습니다.
PhotoCraft 자체에 클라우드 문서 저장은 없으므로 브라우저를 닫기 전에 Save/Export로 저장해야 합니다.

## 공식 웹 실행 파일의 제공 방식

- 릴리스: **PhotoCraft v0.7.0** `photocraft-web-0.7.0.zip`
- 출처: https://github.com/storytold/photocraft/releases/tag/v0.7.0
- ZIP SHA-256: `dfcbaac00f81f5d05ccffba36a14b320c1b1c7b23a4135fe54877f527e550eec`
- 경로: `assets/artcraft/photocraft/`
- 배포 구성: `index.html`, JS 모듈, `.wasm`, 기타 정적 파일, 라이선스, 설치 확인 JSON

### 자동 설치

`.github/workflows/vendor-photocraft-web.yml`은 처음 `main`에 추가될 때 실행되도록
구성했습니다. `scripts/install-photocraft-web.sh`이 변경될 때 또는 수동 실행할 때도
같은 작업을 수행합니다.

설치 액션은 공식 ZIP을 GitHub 릴리스에서 내려받아 SHA-256을 검증합니다.
검증을 통과해야만 압축을 풀고 원본 라이선스(MIT, Apache-2.0), NOTICE,
ATTRIBUTION을 포함합니다. 모든 정적 파일이 25 MiB 이하인지 점검합니다.
GitHub Actions 봇이 이 파일만 `main`에 커밋하도록 구성했습니다.
다른 뚝딱교실 HTML 도구와 Cloudflare Worker/API는 수정하지 않습니다.

**중요:** 액션의 성공, 커밋 완료, 실제 호스팅 배포/접속은 별개의 상태입니다.
Actions의 실행 로그와 사용하는 정적 호스팅 사이트의 배포 상태를 점검해야 합니다.
GitHub Actions 봇의 커밋은 GitHub Pages 등 다른 배포 흐름을 자동 트리거하지 않을 수도 있으므로
이 경우 별도 배포 트리거가 필요합니다. 이를 완료하기 전에는 자체 설치 완료라고 표현하면 안 됩니다.

### 로컬 수동 설치

```bash
bash scripts/install-photocraft-web.sh
python3 -m http.server 8765
```

`http://localhost:8765/그림%20뚝딱.html` 접속으로 개발 환경을 테스트합니다.
브라우저에서는 HTTP(S)로 열어야 하고, 직접 `file://`로 실행하면 WASM 로딩이 막힐 수 있습니다.

## 검증 사항

- [ ] GitHub Actions `Install PhotoCraft web into Gulliver` 성공
- [ ] `main`의 `assets/artcraft/photocraft/index.html`과 `.wasm`가 존재
- [ ] 서비스 URL에서 `gulliver-install.json`을 읽고 **그림 편집 시작** 표시
- [ ] 서비스 URL에서 `.wasm` 응답의 Content-Type이 `application/wasm`
- [ ] Windows Chrome/Edge, macOS Safari의 사진 열기, 한글 입력, PNG 저장
- [ ] 아이패드 Safari의 터치, 화면 전환, 저장 및 WebGL2 호환 모드
- [ ] 기존 홈 및 다른 도구 정상 실행

## 보안, 라이선스 및 주의사항

MIT 또는 Apache-2.0 라이선스를 준수하며 원본 NOTICE/ATTRIBUTION을 함께 배포합니다.
공식 설명서는 https://github.com/storytold/photocraft/blob/main/packaging/web/README.md 입니다.
PhotoCraft는 초기 개발 단계여서 기능과 편집 파일 호환성에 오류가 있을 수 있습니다.
이 앱의 WebAssembly 및 이미지 처리는 클라이언트에서 수행되며 별도의 서버 측 문서 저장은 없습니다.
서버에서 `.wasm`을 `application/wasm`으로 제공해야 하며 HTTPS, gzip/Brotli 압축을 권장합니다.
