# 마블 레이스 관전 구조 참고

참고 프로젝트: Marble Roulette by lazygyu
https://github.com/lazygyu/roulette
확인한 버전: a8227ac7b3b0ef79a7b5e190b8decb7ad689d4b2

- src/camera.ts: 경쟁 구슬 함께 담기, 대상 교체 지연, 구간 전체 보기.
- src/progressMap.ts: 장애물을 피해 결승까지 남은 거리로 순위 계산.
- src/data/maps.ts: 좁아지는 통로, 분기와 합류, 회전 장치의 역할.

이 구조를 참고하여 클라시트의 Matter.js 및 지정 등수 종료·균등 팀 배정에 맞게 구현했다. 원본의 이름, 이미지, 광고, 맵 좌표 데이터는 가져오지 않았다. 카메라와 진행도 코드는 별도의 작은 JavaScript 모듈이며, 물리 이동과 순위별 속도 보정은 분리되어 있다. 슬로모션은 전체 경기에 같은 비율로 적용하며 물리 스텝 크기를 바꾸지 않는다.

코스는 전원 완주, 분기 사용, 구슬이 실제로 지나갈 수 있는 통로를 함께 확인한다. 순위는 화면 표시용 거리이며 실제 골인 판정은 매 물리 스텝의 결승선 통과 시각으로 유지한다.

## 원본 라이선스

MIT License

Copyright (c) 2022 LazyGyu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
