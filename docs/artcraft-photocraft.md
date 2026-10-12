# 그림 뚝딱: PhotoCraft 도입 1단계

뚝딱교실의 `그림 뚝딱.html`은 ArtCraft의 PhotoCraft 이미지 편집기를 연결하는 페이지입니다.

## 현재 상태

- 뚝딱교실 홈에 **똑똑 제작실 → 그림 뚝딱** 메뉴가 추가됩니다.
- 사이트의 `assets/artcraft/photocraft/gulliver-install.json`이 정상 설치된 릴리스임을 확인하면 **동일 출처 iframe으로 실행**합니다.
- 설치되지 않았으면 '웹 편집기 체험하기'로 표시하고 사용자가 명시적으로 누를 때만 **비공식 독립 호스트**인 `https://photocraftweb.com/editor/`로 이동합니다. iframe 자동 연결이나 학생 이미지 업로드는 하지 않습니다.
- 자료는 브라우저에서 편집하며, 저장은 PhotoCraft의 Save As / Export를 사용합니다. 자동 백업이나 계정 저장은 제공되지 않습니다.

## 원본 바이너리 로컬 설치

저장소 루트에서 실행:

```bash
bash scripts/install-photocraft-web.sh
```

설치 스크립트는 웹 실행 파일과 라이선스를 배치하고 `gulliver-install.json` 확인 파일을 생성합니다. PhotoCraft **v0.7.0** 공식 웹용 ZIP을 지정된 SHA-256
`dfcbaac00f81f5d05ccffba36a14b320c1b1c7b23a4135fe54877f527e550eec`
로 검증하고, 파일을 `assets/artcraft/photocraft/`에 복사합니다.
MIT/Apache-2.0 라이선스와 NOTICE/ATTRIBUTION 원문도 함께 포함합니다.
스크립트는 **자동 실행되지 않으며**, 원격 코드 실행이나 서버 API를 요구하지 않습니다.

설치 결과를 반영하려면 대용량 WASM 파일의 호스팅 한도와 GitHub 저장소/배포 비용을 확인하고 **별도로 커밋/배포**하세요.
정적 호스트에서 `.wasm` 콘텐츠 타입은 `application/wasm`이어야 하고 HTTPS 환경에서 테스트해야 합니다.
Cloudflare 25 MiB/파일 제한을 확인하세요. PhotoCraft는 WebGPU 또는 WebGL2를 사용하며, `?webgl` 또는 `?cpu`로 호환 모드를 시험할 수 있습니다.

## 간단 검수 항목

1. 설치 전: 그림 뚝딱 카드 표시, 외부 편집기 링크 동작, 자체 설치라고 오해할 문구 없는지 확인.
2. 설치 후: PC Chrome/Edge/Safari에서 실행·파일 열기·한글 입력·PNG 저장 확인.
3. 태블릿 Safari에서 화면·터치·키보드·저장, 브라우저 새로고침 전 저장 안내 확인.
4. 실패 시 기존 뚝딱교실 도구와 API가 정상 유지되는지 확인.
5. 사진·학생 이름 같은 개인정보는 독립 외부 호스팅 사이트에서 다루지 않도록 안내.

## 출처 및 라이선스

- PhotoCraft upstream: https://github.com/storytold/photocraft
- Hosting guide: https://github.com/storytold/photocraft/blob/main/packaging/web/README.md
- 배포 파일: https://github.com/storytold/photocraft/releases/tag/v0.7.0
- ArtCraft: https://getartcraft.com/apps/photocraft
