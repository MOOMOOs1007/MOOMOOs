# 환생 룰렛 — Vercel 자동 수집 버전

정적 HTML/CSS/JS 화면과 Vercel Function을 함께 배포합니다. 사용자가 SOOP 방송국 ID 또는 라이브 주소를 입력하고 **30초 자동 수집**을 누르면, 서버가 공개 방송의 채팅방에 입장한 시점부터 30초 동안 일반 채팅을 전달합니다.

## 배포

1. 이 폴더 전체를 GitHub 저장소 루트에 올립니다.
2. Vercel에서 **Add New Project → Import Git Repository**로 저장소를 선택합니다.
3. Framework Preset은 **Other**, Root Directory는 이 파일이 있는 폴더로 지정합니다.
4. Build Command와 Output Directory는 비워 둔 채 Deploy합니다.
5. 프로젝트 Settings → Functions에서 Fluid Compute가 활성화되어 있는지 확인합니다.

환경 변수나 SOOP 로그인 정보는 필요하지 않습니다. 공개 방송만 지원합니다.

## 동작 흐름

1. 항목을 선택합니다.
2. SOOP 방송 ID 또는 `https://play.sooplive.com/아이디/방송번호`를 입력합니다.
3. **30초 자동 수집**을 누릅니다.
4. 채팅방 입장 완료 후 타이머가 시작됩니다. 같은 시청자가 여러 번 채팅하면 마지막 채팅 하나만 후보로 남습니다.
5. 수집 완료 후 뽑기 또는 리롤을 사용합니다.

## 제한

- SOOP 비공식 프로토콜을 사용하므로 플랫폼 변경 시 수정이 필요할 수 있습니다.
- 로그인, 성인 인증, 비밀번호가 필요한 방송은 지원하지 않습니다.
- Vercel Function은 한 번의 수집 요청에서만 상태를 유지합니다. 새로고침하면 수집 결과가 사라집니다.
- 무료 플랜의 사용량과 동시 실행 제한을 확인하세요. 방송 시청자가 이 페이지를 각자 열어 수집하면 사용자마다 별도의 Function이 실행됩니다.
- `api/chat.js`는 서버에서 당첨자를 정하지 않습니다. 수집된 후보는 해당 브라우저 메모리에만 남고, 룰렛 추첨은 Web Crypto 난수를 사용합니다.

## 로컬 실행

Node.js 24 이상에서:

```bash
npm install
npx vercel dev
```

프로토콜 테스트:

```bash
npm test
```

## 파일

- `index.html`, `style.css`, `vercel.css`, `app.js`: 방송 화면 및 룰렛
- `api/chat.js`: SOOP 채팅 30초 스트리밍 함수
- `api/protocol.js`: soop4j 0.0.5와 호환되는 패킷 생성·해석
- `test/protocol.test.js`: UTF-8 패킷, 입장 패킷, URL 입력 테스트
