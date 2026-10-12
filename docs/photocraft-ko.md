# PhotoCraft 0.7.0 · 대한민국 교사 대상 한국어 UI

## 배경
원본 PhotoCraft v0.7.0에는 `ko` 번역 카탈로그가 이미 포함되지만, WebAssembly 버전에서는 브라우저 언어 감지의 자동 선택이 영어로 돌아갑니다. 또한 egui는 일반 HTML 텍스트가 아닌 WebGPU/WebGL 캔버스 텍스트를 직접 그리므로 CSS `font-family`만 변경해도 한글 글리프가 생기지 않습니다.

## 실제 구현
- **첫 실행:** `photocraft.preferences`의 `interface.language`가 비어 있거나 `auto`면 `ko`로 설정합니다. 이전에 `en` 등 다른 언어를 선택한 이용자의 값과 나머지 브러시·도구·작업공간 설정은 그대로 둡니다.
- **기존 번역 사용:** PhotoCraft 0.7.0의 메뉴, 툴팁, 패널, 환경설정 등 한글 번역 데이터를 변경하지 않고 선택합니다. 번역되지 않은 일부 오류 문구와 사용자 작성 레이어 이름 등은 그대로 남을 수 있습니다.
- **캔버스 한글 글꼴:** 웹 빌드를 공식 0.7.0 태그(커밋 `79261615956ab21334e49ca1d384390272e647da`)로부터 재빌드할 때 `apps/photocraft-web/src/web.rs`에 네트워크에서 나눔고딕을 받아 UI의 후순위 글꼴로 등록하는 부분만 추가합니다. `egui`의 가족별 기본 라틴어 글꼴은 유지합니다. 언어 변경으로 글꼴 목록이 재설정되면 재등록합니다.
- **학습자료 텍스트:** `fonts/manifest.txt`에 나눔고딕 `Kore` 스크립트 폴백을 등록해, 문서 내부에서 입력되는 한글도 기본 글꼴이 미지원일 때 대체할 수 있게 합니다.
- **무료 자산:** Google Fonts의 나눔고딕 Regular와 OFL 라이선스를 동일 커밋에서 내려받아 Git blob 해시로 검증하고 사이트의 `fonts/nanumgothic/` 폴더에 함께 제공합니다. 한글 글꼴은 별도 정적 자산이어서 25MiB 제한에 근접한 WASM 파일 크기를 키우지 않습니다.

## 배포 절차
`main`에 `.github/workflows/build-photocraft-ko.yml`이 추가되면 GitHub Actions에서 다음을 수행합니다.
1. 외부 소스가 지정된 정확한 PhotoCraft v0.7.0 Git 커밋인지 검증.
2. `scripts/patch-photocraft-ko.py`로 Rust 웹 셸의 한글 글꼴 제공 코드를 추가.
3. Rust stable + wasm32 + Trunk 0.21.14로 웹 WASM 빌드.
4. `scripts/localize-photocraft-html.py`로 첫 실행 언어를 한국어로 설정.
5. `scripts/install-photocraft-ko-font.sh`로 OFL 나눔고딕 확보 및 검증.
6. 생성된 `index.html`, JS, WASM, 글꼴을 검사하고, 전부 성공한 경우에만 `assets/artcraft/photocraft/`에 커밋.

오류가 나면 기존에 배포된 영어판은 건드리지 않습니다. GitHub Actions 빌드 성공만으로 PC·태블릿에서 완전 검증됐다고 간주하지 않습니다.

## 사후 검수
- [ ] Actions 빌드와 GitHub Pages 배포가 성공.
- [ ] ‘그림 뚝딱’에서 편집기 최초 실행 시 파일·편집·이미지·레이어·문자·선택·필터·보기·창이 한국어로 표시.
- [ ] 브러시, 색상, 레이어, 환경설정, 저장창의 한글 글리프가 네모로 표시되지 않음.
- [ ] 기존 저장된 영어 설정은 유지되며, 언어 메뉴에서 한국어로 바꿀 수 있음.
- [ ] 파일을 열고 한글 글자를 입력한 뒤 PNG로 저장할 수 있음.
- [ ] iPhone Safari에서 UI 표시, 메뉴 터치, 화면 확대 동작 확인(디자인 자체는 원본 PhotoCraft의 데스크톱 중심 레이아웃).
- [ ] Windows/맥/아이패드에서도 동일한 기능 검증.
- [ ] 기존 뚝딱교실 도구 및 학급 데이터·Cloudflare Worker API에 영향 없음.

참고: 원본 https://github.com/storytold/photocraft/blob/v0.7.0/docs/localization.md
