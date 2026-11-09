# 🏹 현무랑 후백제 산책 (Hyeonmurang's Hubaekje AR Archery)
> **"앱 설치 없이 브라우저로 즐기는 전주 동고산성 360° 실감형 WebAR 양궁 투어"**  
> *A Zero-Install, Cross-Platform Mobile WebAR Archery Game for Historical Heritage Tourism.*

[![Three.js](https://img.shields.io/badge/Three.js-r128-black?logo=three.js)](https://threejs.org/)
[![WebXR / Sensors](https://img.shields.io/badge/WebXR-DeviceOrientation-blue)](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent)
[![Web Audio API](https://img.shields.io/badge/Audio-Web_Audio_API-orange)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Deploy](https://img.shields.io/badge/Deploy-Netlify-00C7B7?logo=netlify)](https://www.netlify.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 1. 프로젝트 개요 (Overview)

**《현무랑 후백제 산책》**은 전주 동고산성(전북특별자치도 기념물 제44호) 및 완산주 후백제 유적지 방문객을 위한 **피지컬-디지털(Phygital) 관광 WebAR 솔루션**입니다.

* **문제 정의:** 역사 유적지를 찾은 관광객들이 유적의 가치를 체감하지 못하고 짧은 시간 내에 이탈하는 문제를 해결하고자 기획되었습니다.
* **해결책:** 앱스토어 다운로드 없이 현장 QR코드 스캔만으로 스마트폰 브라우저(Safari/Chrome)에서 구동되며, 사용자가 폰을 들고 360도 주변을 둘러보며 숨겨진 5대 관문 과녁을 찾아 활을 쏘아 맞히는 몰입형 공간 경험을 제공합니다.
* **진화 과정:** 데스크톱 Python + OpenCV + MediaPipe 프로토타입에서 출발하여, 모바일 환경 및 iOS Safari 제약을 완전히 극복한 **7개 독립 모듈 WebAR 아키텍처**로 발전했습니다.

---

## ✨ 2. 핵심 기능 (Key Features)

| 기능 | 세부 설명 | 기술 스택 |
| :--- | :--- | :--- |
| **🌐 무설치 WebAR (Zero-Install)** | 별도 앱 다운로드/회원가입 없이 모바일 브라우저로 3초 만에 즉시 실행 | Vanilla JS (ES6+), WebCam API |
| **🧭 4차원 쿼터니언 센서 퓨전** | 오일러 짐벌락(Gimbal Lock) 0% 달성, 하늘/바닥을 보아도 과녁 튐 없는 공간 앵커링 | Three.js Quaternion, SLERP |
| **🎯 포켓몬고 스타일 슬링 조준** | 화면 대각선 드래그 시 역방향 슬링 벡터 계산을 통한 3D 곡사 사격 지원 | 3D Raycasting, Physics Ballistics |
| **🏹 전통 국궁 3D 기하학 렌더링** | 3차 베지어 곡선 기반의 정통 흑각궁 1인칭 HUD 및 시위 텐션 인터랙션 | HTML5 Canvas 2D Context |
| **🐢 3D 마스코트 길안내 AI** | 미격파 과녁 방향을 스스로 바라보며(`LookAt`) 위치를 가이드하는 동반자 '현무랑' | Three.js Procedural Mesh |
| **🔊 3D 공간 절차적 사운드** | 외부 음원 다운로드 없이 웹 오디오 발진기로 합성한 풍성한 국악 타격음 | Web Audio API, StereoPanner |
| **🎒 4대 유적지 뱃지 도감** | 동고산성, 낙수정, 동고사, 완산칠봉으로 이어지는 온·오프라인 스탬프 투어 | LocalStorage, Game State Machine |

---

## 🏛️ 3. 시스템 아키텍처 및 디렉토리 구조

프로젝트는 **Python 빌드 및 자동화 파이프라인**과 **초경량 브라우저 런타임**으로 관심사가 명확히 분리(Separation of Concerns)되어 있습니다.

```text
ar_archery/
├── 📁 assets/                     # 공식 고화질 리소스 (Fonts, Images, Video)
│   ├── bg/                        # 5대 화면 배경 일러스트 (Intro, Loading, Cinema, Archery, Inven)
│   ├── char/                      # 수호거북 '현무랑' 포즈별 에셋 (char_1.png ~ char_5.png)
│   ├── ui/                        # 게임 UI (로고, 짚과녁 텍스처, 4대 거점 뱃지 등)
│   ├── fonts/                     # 메이플스토리 Bold, GmarketSans, 나눔손글씨펜
│   └── video/                     # 인트로 시네마 숏폼 영상 (intro.mp4)
├── 📁 css/
│   └── style.css                  # 모바일 반응형 Grid, 모바일 가상키보드 찌그러짐 방지 (--app-height)
├── 📁 js/                         # 7개 역할별 독립 모듈
│   ├── audio.js                   # Web Audio 기반 3D 공간 입체 음향 및 신시사이저
│   ├── sensor.js                  # 4-Component Quaternion 자이로 연동 및 적응형 로우패스 필터
│   ├── character3d.js             # Three.js 3D 현무랑 마스코트 및 타겟 추적 LookAt AI
│   ├── targets.js                 # 3D 짚과녁 5종 생성, 거리별 탄도학 장력, 전신 넘어짐 물리
│   ├── bow.js                     # 1인칭 국궁 2D 캔버스 렌더링, 시위 장력 및 터치 게이지
│   └── main.js                    # 메인 게임 루프, 레이캐스팅, iOS Safari 권한 제어, 스테이트 머신
├── index.html                     # 8KB 초경량 시맨틱 HTML5 엔트리포인트
├── archery.py                     # [Phase 0] 초기 Python + OpenCV + MediaPipe 데스크톱 프로토타입
├── prepare_dist.py                # Netlify 배포용 디렉토리(dist/) 및 zip 패키징 파이썬 스크립트
└── server.py                      # 로컬 SSL/HTTPS 개발용 임시 파이썬 웹서버
```

---

## ⚙️ 4. 핵심 작동 원리 및 코드 분석 (Under the Hood)

### 1) 4-Component Quaternion 센서 퓨전 (`js/sensor.js`)
* **문제:** 삼각함수 오일러 각도($\alpha, \beta, \gamma$)를 직접 화면 좌표로 투영하면, 고개를 높이 들었을 때($\text{Pitch} \ge 80^\circ$) **짐벌락(Gimbal Lock)** 현상으로 과녁이 180° 반대편으로 순간이동(`Snap`)하는 특이점(Singularity)이 발생함.
* **해결:** 자이로 입력을 4차원 복소 쿼터니언으로 변환하고, 시작 시점의 정면 방향(`makeYawAnchor`)과 켤레 복소수 합성을 수행한 뒤 **구면 선형 보간(SLERP)**을 거쳐 짐벌락을 0%로 완벽 차단함.

```javascript
// 오일러 짐벌락을 극복한 쿼터니언 변환 함수
function getOrientationQuaternion(alpha, beta, gamma, orient = 0) {
  const _alpha = alpha ? alpha * degToRad : 0;
  const _beta = beta ? beta * degToRad : 0;
  const _gamma = gamma ? gamma * degToRad : 0;

  // 디바이스 센서 좌표계를 카메라 뷰 축으로 회전 (-PI/2 around X)
  const euler = new THREE.Euler(_beta, _alpha, -_gamma, 'YXZ');
  const q = new THREE.Quaternion().setFromEuler(euler);
  q.multiply(new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)));

  // 가로/세로 화면 회전 보정
  q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -orient * degToRad));
  return q;
}
```

### 2) 적응형 로우패스 필터 (아이폰 흔들림 완벽 흡수)
* **문제:** 모바일 기기(특히 iPhone)의 지자기 나침반 센서(`webkitCompassHeading`)는 주변 미세 전류와 자기장으로 인해 1~3도씩 끊임없이 떨리는 고주파 노이즈가 발생함.
* **해결:** 절대 나침반 대신 순수 자이로 각도를 취하고, **각속도에 따라 필터 강도를 실시간 조절**하는 적응형 로우패스 필터를 설계함.

$$\text{Filter Speed} = \begin{cases} 
\text{Base} \times 0.42 & (\Delta \theta < 0.7^\circ \text{ : 정지 조준 시 돌처럼 고정}) \\
\text{Base} \times 1.70 & (\Delta \theta > 3.5^\circ \text{ : 휙 둘러볼 때 지연 없는 빠른 회전}) 
\end{cases}$$

### 3) 포켓몬고 스타일 반전 슬링 벡터 레이캐스팅 (`js/main.js`)
* 사용자가 화면 우측 하단으로 활을 당기면, Three.js의 `Raycaster`가 2D 캔버스 드래그 오프셋($\Delta x, \Delta y$)의 반대 방향으로 공간 레이를 사출합니다.

```javascript
// 2D 터치 드래그 오프셋을 3D 레이캐스팅 좌표로 정규화 (-1.0 ~ +1.0)
const normX = ((W / 2 - pullDx * 2.4) / W) * 2 - 1;
const normY = -(((H / 2) + 20) / H) * 2 + 1;

raycaster.setFromCamera(new THREE.Vector2(normX, normY), camera);
const hitTargets = raycaster.intersectObjects(targetMeshes);
```

### 4) 거리 기반 포물선 탄도학 & 장력 밸런스 (`js/targets.js`)
* 과녁 거리(12m ~ 30m)에 따라 필요 최소 장력(`reqPower`)을 차등 적용:
  * **1관문(12m):** 50% 이상 장력
  * **3관문(26m, 망루):** 80% 이상 장력 필수
  * **5관문(30m, 결전):** 85% 이상 최대 장력 필수 (부족 시 중력 낙하로 과녁 앞 땅바닥에 박힘)

---

## 📱 5. 모바일 & iOS Safari 최적화 노하우

1. **동기적 센서 권한 획득:**  
   `DeviceOrientationEvent.requestPermission()`은 iOS Safari 보안상 **사용자의 직접 터치 이벤트 콜백 최상단**에서만 허용됩니다. 비동기 `async/await` 체인 내부에서 호출하면 차단되므로, [미션 브리핑] 화면의 시작 버튼 터치 즉시 동기 프로미스를 캡처하도록 구현했습니다.
2. **카메라 검은 화면 방지:**  
   모바일 브라우저의 비디오 자동재생 방지 정책을 우회하기 위해 `<video playsinline webkit-playsinline muted autoplay>` 속성을 부여하고 자바스크립트에서 명시적으로 `.play()`를 재호출합니다.
3. **가상 키보드 높이 고정 (`lockViewportHeight`):**  
   이름 입력창 터치 시 모바일 가상 키보드가 올라오며 뷰포트가 찌그러지는 버그를 방지하기 위해 윈도우 로드 시점의 실제 물리 높이를 `--app-height` CSS 변수에 영구 바인딩합니다.
4. **GPU 과열 방지:**  
   아이폰 3x 레티나 디스플레이에서 불필요한 배터리 소모를 막기 위해 `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0))`으로 제한했습니다.

---

## 🚀 6. 로컬 실행 및 배포 가이드 (Getting Started)

> **⚠️ 필수 주의사항:** 모바일 카메라(`getUserMedia`) 및 자이로 센서는 웹 표준 보안 정책상 **반드시 HTTPS 환경(또는 localhost)**에서만 활성화됩니다.

### 1) 로컬 개발 환경 실행 (PC 브라우저 테스트)
Python 내장 HTTP 서버를 통해 별도의 의존성 설치 없이 즉시 실행할 수 있습니다:

```bash
# 저장소 복제
git clone https://github.com/yewon0489/hubaekje-ar-archery.git
cd hubaekje-ar-archery

# 파이썬 내장 정적 웹서버 실행 (8080 포트)
python -m http.server 8080
```
브라우저에서 `http://localhost:8080`에 접속합니다.

### 2) 모바일 실기기 테스트 (SSL/HTTPS 터널링)
스마트폰에서 자이로 및 카메라를 테스트하려면 HTTPS 터널이 필요합니다:

```bash
# ngrok을 사용하는 경우
npx ngrok http 8080
# 출력된 https://xxxx.ngrok-free.app 링크를 모바일 사파리/크롬으로 접속
```

### 3) Netlify 프로덕션 원클릭 배포
정적 웹사이트 구조이므로 Netlify, Vercel, GitHub Pages 어디에나 즉시 배포할 수 있습니다:

```bash
# 배포용 dist 폴더 자동 빌드
python prepare_dist.py

# dist/ 폴더를 Netlify Drop(https://app.netlify.com/drop)에 드래그 앤 드롭하면 즉시 배포 완료!
```

---

## 🗺️ 7. 역사 고증 스토리 (Historical Context)

* **전주 동고산성(東固山城):** 서기 900년 견훤 대왕이 완산주에 도읍을 정하고 세운 후백제의 왕궁성터입니다. 발굴조사에서 60여 칸에 이르는 국내 산성 최대 규모의 대형 건물지와 **'전주성(全州城)'** 명문와, 왕실 상징 쌍봉황무늬 암막새가 출토된 역사적 실증 유적지입니다.
* **4대 거점 투어 패스포트:**
  1. 🏯 **동고산성:** 후백제 왕궁 방어성 및 본진
  2. 💧 **낙수정:** 후백제 군사들이 목을 축이던 약수터
  3. 🔔 **동고사:** 견훤 대왕이 국태민안을 기원하며 창건한 사찰
  4. ⛰️ **완산칠봉:** 후백제 도성의 남쪽 방어선

---

## 👨‍💻 Author & Contributors
* **기획 / PO:** 박예원 (Yewon Park) - [@yewon0489](https://github.com/yewon0489)
* **기술 스택:** Three.js, WebXR, Web Audio API, Python, Vanilla JavaScript
* **저장소:** [https://github.com/yewon0489/hubaekje-ar-archery](https://github.com/yewon0489/hubaekje-ar-archery)
