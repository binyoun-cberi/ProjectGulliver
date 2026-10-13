# 뚝딱 제작실 2.1 — 공식 영상·음악 제작기 실사용 검수

검수 대상: ArtCraft **FilmCraft 0.7.2** 및 **SoundCraft 0.6.1**의 GitHub Pages 정적 배포판. 공식 바이너리는 변경하지 않습니다.

## 확인된 사항

GitHub Actions `.github/workflows/media-runtime-qa.yml`이 실제 Chrome과 원본 WASM을 실행합니다. 다음은 2026-10-13 자동 검수에서 확인한 범위입니다.

| 기능 | 결과 | 검사 방법 |
|---|---|---|
| FilmCraft 공식 WASM 시작 | 통과 | `filmcraftLoad.readyMs`, `filmcraft.info()`, 캔버스 크기 및 fatal 상태 |
| FilmCraft 화면 합성 | 통과 | GitHub Actions Chrome WebGL2 + CPU compositor |
| 실제 H.264/AAC 파일 가져오기 | 통과 | FFmpeg로 생성한 160×90 / 12fps / 1.2초 MP4를 `filmcraft.importUrl`로 가져오기 |
| 타임라인 생성·재생 | 통과 | `file.newSequence`, `ui.playback`, `filmcraft.inspect()` |
| H.264 MP4 출력 | 통과 | `file.exportMedia` → 완료된 렌더 잡 확인 → 다운로드된 MP4 `ftyp`·FFprobe 확인 |
| FilmCraft 프로젝트 저장·재열기 | 통과 | `file.saveAs`로 `.fcproj` 생성 → `readFile` → `openProject`, 누락 미디어 0 |
| SoundCraft 공식 WASM 시작 | 통과 | `soundcraft_loading` 제거, `wasmBindings` 생성, 실제 캔버스 확인 |
| SoundCraft 브라우저 오디오 사용 환경 | 통과(환경 확인) | WebAudio 지원 여부 및 편집기 내부 사용자 제스처 실행 |
| SoundCraft 실제 소리 출력·마이크 녹음 | **미검증** | 오디오 하드웨어나 실기기 루프백 기반 청음/녹음 검수 필요 |
| SoundCraft 세션 `.scraftz` 저장·재열기 | **미검증** | egui GUI 조작의 별도 자동화 또는 실제 사용 검수 필요 |
| 10분·30분 실영상 전체 출력 | **미검증** | 짧은 테스트 클립 검증과 다른 부하 특성 |
| Safari (iPhone/iPad) 실기기 | **미검증** | Chrome 데스크톱 자동화만 수행 |

## 2.1에서 수정한 사항

- 단순히 공식 HTML의 `iframe load`가 끝났다는 사실로 "준비 완료"라고 표시하지 않습니다. FilmCraft는 `filmcraftLoad.readyMs` + 실제 제어 API, SoundCraft는 실제 Rust 초기화 종료 후 로딩 오버레이 제거를 확인합니다.
- 초기화 실패·WASM 패닉·시간 초과 시 오류와 재시작 버튼, WebGL 호환 모드(두 앱), FilmCraft CPU 안전 모드, 환경 점검 버튼을 제공합니다. 원본 ArtCraft 파일은 그대로 유지합니다.
- `환경 점검`은 로컬 브라우저에서 WebGL2/WebGPU, WebAudio, WebCodecs, 교차 출처 격리 여부를 확인합니다. 서버로 전송하지 않습니다. FilmCraft는 `filmcraft.info()`도 읽습니다.
- 통합 제작실에서 공식 고급 모드를 나갈 때 프로젝트를 프로그램 안에서 **별도로 저장**했는지 확인합니다. 공식 편집기의 파일은 여전히 뚝딱 제작실 1.4 통합 백업/자동 저장에 자동 포함되지 않습니다.
- 기존 간편 영상·음악 제작, 사진 소재함, 개인 프로젝트, WAV·WebM 출력은 수정하거나 삭제하지 않습니다.

## 장시간 영상 검수의 실제 의미

소프트웨어의 "45초" 상한은 자체 간편 영상에만 적용됩니다. 공식 FilmCraft에는 뚝딱 제작실의 45초 제한이 없습니다. 하지만 브라우저에서는 CPU 합성이 단일 스레드로 처리될 수 있고, 10~30분 영상의 전 구간 MP4 렌더 속도·메모리 소모·오디오 싱크는 충분한 원본·반복 테스트가 있어야 판단할 수 있습니다. **단순히 길이 제한이 없다는 이유로 장시간 렌더 성공을 보장하면 안 됩니다.**

### 남은 실기기 검수 절차

1. PC Chrome에서 10분/30분 분량의 실제 수업 동영상을 가져오고 원본 영상·음성의 싱크, 여러 클립 편집, 자막, 오디오 믹스 후 MP4로 전 구간 출력. FFprobe로 프레임·길이·오디오 스트림 확인.
2. PC Chrome에서 SoundCraft demo 프로젝트 재생, 음량 미터/헤드폰 출력 확인, 파일 가져오기, `.scraftz`로 저장, 새 탭/프로필에서 다시 열기. 마이크를 허용한 후 짧게 녹음하고 WAV 출력·청음.
3. 아이폰 Safari에서 두 공식 앱의 WebGPU/WebGL2 초기화, 터치 조작, 파일 선택, 실제 오디오 출력과 저장 여부를 확인. 동작하지 않는 경우 간편 모드로 전환.
4. 프로젝트를 종료하고 다시 열 때 영상 원본 파일/오디오 파일이 유실되지 않는지 확인. **간편 제작기의 '전체 백업'은 공식 편집기 고유 세션 파일을 대신하지 않습니다.**

## 검수 자동화

`tests/studio-official-workflows.e2e.cjs`: GitHub Actions에서 FFmpeg로 테스트 영상을 만들고 실제 원본 프로그램의 브라우저 편집·출력·프로젝트 왕복 경로를 검사합니다. 문제 재현 시 Actions 로그에 렌더 잡 상태, `filmcraft.info()`, SoundCraft 실행 상태가 남습니다.

이 검사는 **기기에서 실사용 가능성을 높여 주는 회귀 검사**이지, 모든 영상 코덱·고해상도·실제 마이크/스피커와 모든 파일 형식의 품질 보증은 아닙니다.
