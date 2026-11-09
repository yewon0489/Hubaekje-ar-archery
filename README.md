# 🏹 현무랑 후백제 산책 (Hyeonmurang's Hubaekje AR Archery)
> **"앱 설치 없이 브라우저로 즐기는 전주 동고산성 360° WebAR 활쏘기 투어"**  
> A Zero-Install, Cross-Platform Mobile WebAR Archery Game for Historical Heritage Tourism.

[![Three.js](https://img.shields.io/badge/Three.js-r128-black?logo=three.js)](https://threejs.org/)
[![WebXR / Sensors](https://img.shields.io/badge/WebXR-DeviceOrientation-blue)](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent)
[![Web Audio API](https://img.shields.io/badge/Audio-Web_Audio_API-orange)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Deploy](https://img.shields.io/badge/Deploy-Netlify-00C7B7?logo=netlify)](https://www.netlify.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 1. 프로젝트 개요

《현무랑 후백제 산책》은 전주 동고산성(전북특별자치도 기념물 제44호) 현장을 직접 걸으며 체험하는 스마트폰 웹 증강현실(WebAR) 활쏘기 서비스입니다.

방문객들이 역사 유적지를 눈으로만 보고 빠르게 지나치지 않도록, 현장 안내판의 QR코드 스캔 한 번으로 360도 공간에 숨겨진 5대 관문 과녁을 찾아 활을 쏘고 즐길 수 있도록 기획했습니다.

초기에는 PC 웹캠과 파이썬(OpenCV, MediaPipe) 기반의 손인식 데스크톱 프로토타입으로 개발을 시작했습니다. 그러나 유적지 현장에 서 있는 관광객이 노트북을 들고 체험할 수는 없다는 점을 감안하여, 스마트폰 브라우저(Safari, Chrome)에서 앱 설치 없이 즉시 구동되는 7개 독립 모듈 WebAR 아키텍처로 전면 개편해 완성했습니다.

---

## ✨ 2. 핵심 기능

| 기능 | 상세 내용 | 사용 기술 |
| :--- | :--- | :--- |
| **무설치 모바일 WebAR** | 별도 앱 다운로드나 회원가입 없이 스마트폰 브라우저에서 QR 스캔 즉시 실행 | Vanilla JavaScript (ES6+), WebCam API |
| **자이로 360도 공간 추적** | 스마트폰 센서 각도를 쿼터니언으로 변환해 고개를 위로 젖혀도 화면 뒤집힘(짐벌락) 없이 3D 공간에 과녁 고정 | Three.js Quaternion, SLERP |
| **포켓몬고 방식 슬링 조준** | 화면 터치 드래그의 역방향 벡터를 계산하여 대각선 사격과 곡사 조준 지원 | 3D Raycasting, Projectile Vector |
| **전통 국궁 1인칭 렌더링** | 3차 베지어 곡선으로 줌통(손잡이)과 도고지(활 끝)의 유려한 리커브 아치 형태 및 시위 텐션 표현 | HTML5 Canvas 2D Context |
| **수호거북 '현무랑' 3D 가이드** | 아직 맞추지 못한 다음 과녁 방향을 실시간으로 바라보며(LookAt) 이동 경로 안내 | Three.js Procedural 3D Mesh |
| **Web Audio 실시간 효과음** | 외부 사운드 파일 다운로드 없이 브라우저 내장 발진기(Oscillator)로 합성한 활시위 소리 및 목재 타격음 | Web Audio API, StereoPanner |
| **4대 유적지 뱃지 획득** | 동고산성, 낙수정, 동고사, 완산칠봉을 연계한 현장 탐방 스탬프 투어 및 로컬 저장 | LocalStorage, Game State Machine |

---

## 🏛️ 3. 디렉토리 구조

프로젝트는 유지보수성과 배포 편의를 위해 역할별 7개 모듈로 명확하게 분리되어 있습니다.

```text
ar_archery/
├── assets/                     # 게임 리소스 (폰트, 배경 일러스트, 캐릭터, 영상)
│   ├── bg/                     # 5대 화면 배경 일러스트 (Intro, Loading, Cinema, Archery, Inven)
│   ├── char/                   # 수호거북 '현무랑' 포즈별 그래픽 에셋
│   ├── ui/                     # UI 요소 (로고, 짚과녁 텍스처, 4대 거점 뱃지 등)
│   ├── fonts/                  # 메이플스토리 Bold, GmarketSans, 나눔손글씨펜
│   └── video/                  # 인트로 스토리 숏폼 영상 (intro.mp4, 4.7MB 최적화)
├── css/
│   └── style.css               # 모바일 반응형 레이아웃 및 가상키보드 높이 왜곡 방지
├── js/                         # 기능별 독립 자바스크립트 모듈
│   ├── audio.js                # Web Audio 3D 입체 음향 및 신시사이저 발진기
│   ├── sensor.js               # 4-Component 쿼터니언 자이로 센서 연동 및 떨림 방지 필터
│   ├── character3d.js          # Three.js 3D 현무랑 마스코트 및 타겟 추적 LookAt
│   ├── targets.js              # 3D 짚과녁 5종 생성, 거리별 탄도학 장력, 피격 물리
│   ├── bow.js                  # 1인칭 국궁 2D 캔버스 렌더링, 시위 장력 및 터치 게이지
│   └── main.js                 # 메인 게임 루프, 레이캐스팅, iOS Safari 권한 제어
├── index.html                  # 경량 HTML5 웹 엔트리포인트
├── archery.py                  # [Phase 0] 초기 파이썬 + OpenCV + MediaPipe 프로토타입
├── prepare_dist.py             # 정적 호스팅 배포용 패키징 스크립트
└── server.py                   # 로컬 HTTPS 개발 테스트용 웹서버
```

---

## ⚙️ 4. 핵심 구현 및 트러블슈팅

### 1) 자이로 센서 360도 공간 추적과 짐벌락(Gimbal Lock) 해결 (`js/sensor.js`)
스마트폰의 자이로 센서 오일러 각도(Alpha, Beta, Gamma)를 화면 2D 좌표로 단순 투영하면, 산성 망루에 있는 높은 과녁을 조준하기 위해 고개를 수직으로 들었을 때(Pitch 80도 이상) 회전축이 겹치면서 과녁이 반대편으로 180도 순간이동하는 짐벌락 현상이 발생했습니다.

이를 해결하기 위해 센서 입력을 4차원 쿼터니언(Quaternion)으로 변환하고, 게임 시작 시점의 기준 방향과 합성한 뒤 구면 선형 보간(SLERP)을 적용했습니다. 그 결과 폰을 하늘이나 바닥으로 크게 움직여도 화면 튐 없이 현실 공간에 과녁이 안정적으로 고정됩니다.

```javascript
// 오일러 짐벌락을 방지하는 쿼터니언 변환
function getOrientationQuaternion(alpha, beta, gamma, orient = 0) {
  const _alpha = alpha ? alpha * degToRad : 0;
  const _beta = beta ? beta * degToRad : 0;
  const _gamma = gamma ? gamma * degToRad : 0;

  // 디바이스 센서 좌표계를 Three.js 카메라 뷰 축으로 회전 (-PI/2 around X)
  const euler = new THREE.Euler(_beta, _alpha, -_gamma, 'YXZ');
  const q = new THREE.Quaternion().setFromEuler(euler);
  q.multiply(new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)));

  // 가로/세로 화면 회전 보정
  q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -orient * degToRad));
  return q;
}
```

### 2) 손떨림 방지 속도 감응형 필터
모바일 기기의 센서는 주변 자기장과 미세한 손떨림으로 인해 정지 상태에서도 1~2도씩 끊임없이 떨리는 고주파 노이즈가 있습니다.

이를 보정하기 위해 사용자가 조준을 위해 멈춰 서 있을 때는 필터 강도를 높여 과녁이 흔들리지 않도록 단단히 고정하고, 주변을 둘러보기 위해 빠르게 회전할 때는 즉각적으로 반응하도록 회전 각속도 기반의 가변 로우패스 필터를 적용했습니다.

### 3) 대각선 사격이 가능한 포켓몬고 스타일 슬링 조준 (`js/main.js`)
단순 터치 클릭 대신, 사용자가 화면 하단으로 활시위를 당기면 반대 방향으로 화살이 날아가는 슬링 조준 메카닉을 구현했습니다.

2D 캔버스 드래그 오프셋을 정규화된 3D 뷰포트 좌표로 변환하고 Three.js Raycaster와 연동하여, 사용자가 원하는 각도와 방향으로 정밀하게 화살을 날릴 수 있도록 처리했습니다.

```javascript
// 2D 터치 드래그 오프셋을 3D 레이캐스팅 좌표로 정규화 (-1.0 ~ +1.0)
const normX = ((W / 2 - pullDx * 2.4) / W) * 2 - 1;
const normY = -(((H / 2) + 20) / H) * 2 + 1;

raycaster.setFromCamera(new THREE.Vector2(normX, normY), camera);
const hitTargets = raycaster.intersectObjects(targetMeshes);
```

### 4) 거리 기반 탄도학 및 장력 밸런스 (`js/targets.js`)
모든 과녁을 같은 힘으로 맞추면 단순해질 수 있어, 과녁과의 거리(12m ~ 30m)에 따라 요구되는 최소 장력에 차등을 두었습니다.

가까운 1관문(12m)은 50% 정도의 장력으로도 적중하지만, 성벽 위에 위치한 3관문(26m)과 가장 먼 5관문(30m)은 활시위를 80~85% 이상 힘껏 당기지 않으면 화살이 중력에 의해 과녁 앞 땅바닥에 떨어지도록 탄도학 곡선을 설계했습니다.

---

## 📱 5. 모바일 및 iOS Safari 대응 노하우

1. **동기적 센서 권한 요청:** iOS Safari 보안 정책상 `DeviceOrientationEvent.requestPermission()`은 반드시 사용자의 터치 이벤트 직후 동기적으로 호출되어야 합니다. 비동기 체인 내부에서 호출 시 브라우저가 차단하므로, 시작 버튼 터치 핸들러 최상단에서 즉시 권한을 요청하도록 작성했습니다.
2. **카메라 자동재생 정책 대응:** 모바일 브라우저의 비디오 자동재생 제한을 고려해 `<video playsinline webkit-playsinline muted autoplay>` 속성을 선언하고 스크립트에서 명시적으로 `.play()`를 재호출했습니다.
3. **가상 키보드 높이 왜곡 방지:** 이름 입력창 터치 시 모바일 가상 키보드가 올라오며 화면 비율이 찌그러지는 버그를 막기 위해, 초기 로드 시점의 실제 물리 화면 높이를 `--app-height` CSS 변수에 바인딩했습니다.
4. **모바일 배터리 및 발열 방지:** 고해상도 디스플레이 기기에서 과도한 픽셀 계산으로 기기가 뜨거워지는 현상을 방지하기 위해 `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0))`으로 렌더링 부하를 제한했습니다.

---

## 🚀 6. 로컬 실행 및 배포 방법

모바일 카메라 및 자이로 센서는 웹 표준 보안 정책상 반드시 HTTPS 환경(또는 localhost)에서만 동작합니다.

### 1) PC 로컬 테스트
```bash
# 저장소 복제
git clone https://github.com/yewon0489/Hubaekje-ar-archery.git
cd Hubaekje-ar-archery

# 파이썬 정적 웹서버 실행 (8080 포트)
python -m http.server 8080
```
브라우저에서 `http://localhost:8080`으로 접속합니다.

### 2) 모바일 실기기 테스트 (HTTPS 터널링)
스마트폰에서 센서와 카메라를 함께 테스트하려면 HTTPS 터널이 필요합니다.

```bash
# ngrok 사용 예시
npx ngrok http 8080
# 생성된 https://xxxx.ngrok-free.app 주소로 스마트폰 브라우저 접속
```

### 3) 프로덕션 정적 배포
순수 HTML/JS 정적 웹사이트이므로 Netlify, Vercel, GitHub Pages 어디든 즉시 배포할 수 있습니다.

```bash
# 배포용 dist 폴더 자동 구성
python prepare_dist.py
```
생성된 `dist/` 폴더를 Netlify Drop(app.netlify.com/drop)에 올리면 수 초 내에 실서비스 배포가 완료됩니다.

---

## 🗺️ 7. 유적지 역사 배경

전주 동고산성은 서기 900년 견훤 왕이 완산주에 도읍을 정하고 세운 후백제의 왕궁 방어성터입니다. 발굴조사 당시 60여 칸에 이르는 국내 산성 최대 규모의 대형 건물터와 '전주성(全州城)' 명문와, 왕실 상징 쌍봉황무늬 암막새가 출토된 역사 유적지입니다.

본 프로젝트는 이러한 고증을 토대로 동고산성 본진을 비롯해 낙수정, 동고사, 완산칠봉 4대 거점을 연계한 현장 체험 투어로 기획되었습니다.

---

## 👨‍💻 프로젝트 정보
기획 및 개발: 박예원 (Yewon Park) · [@yewon0489](https://github.com/yewon0489)  
기술 스택: Three.js, WebXR, Web Audio API, Python, Vanilla JavaScript  
저장소: [https://github.com/yewon0489/Hubaekje-ar-archery](https://github.com/yewon0489/Hubaekje-ar-archery)
