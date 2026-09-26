# ProjectGulliver 실시간 서버

ProjectGulliver의 다중 기기 기능을 위한 Cloudflare Worker입니다.

- Worker: `gulliver-api`
- 실시간 방 상태: SQLite-backed Durable Object
- D1: 사용하지 않음
- 방 자동 만료: 생성 후 48시간
- 배포: Cloudflare Workers Builds가 `main` push 시 `npx wrangler deploy` 실행

현재 API:
- `GET /health`
- `POST /api/rooms`
- `GET /api/rooms/:code`
- `POST /api/rooms/:code/vote`
- `POST /api/rooms/:code/reset`
- `POST /api/rooms/:code/close`
- `POST /api/rooms/:code/reopen`
- `GET /api/rooms/:code/ws`
