/* ─────────────────────────────────────────────────────────────
   QUATERNION SENSOR TRACKING ENGINE (Yaw-Only Anchor & Gravity Pitch)
   - 폰을 들고 있는 각도(Pitch)는 지구 중력 기준 그대로 유지 (위로 들면 과녁이 정직하게 보임)
   - 수평 방향(Yaw)만 게임 시작 시점의 정면을 0°로 보정하여 왜곡 없는 쾌적한 조준 제공
   - [아이폰 흔들림 완벽 해결]
     • 지자기 나침반(webkitCompassHeading)의 고주파 노이즈 배제 ➔ 순수 자이로스코프(e.alpha) 활용
     • 미세 손떨림 흡수 적응형 로우패스 필터(Adaptive Low-Pass Filter) 적용
───────────────────────────────────────────────────────────── */
const degToRad = Math.PI / 180;
let initialBaseQ = null;
let latestRawQ = null;
let sensorReady = false;

const zee = new THREE.Vector3(0, 0, 1);
const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // -PI/2 around X

function getOrientationQuaternion(alpha, beta, gamma, orient = 0) {
  const _alpha = alpha ? alpha * degToRad : 0;
  const _beta = beta ? beta * degToRad : 0;
  const _gamma = gamma ? gamma * degToRad : 0;
  const _orient = orient ? orient * degToRad : 0;

  const euler = new THREE.Euler(_beta, _alpha, -_gamma, 'YXZ');
  const q = new THREE.Quaternion().setFromEuler(euler);
  q.multiply(q1);

  const q0 = new THREE.Quaternion().setFromAxisAngle(zee, -_orient);
  q.multiply(q0);

  return q;
}

// 쿼터니언에서 순수 수평(Yaw, Y축 회전)만 추출하여 역회전 앵커 생성
function makeYawAnchor(q) {
  const euler = new THREE.Euler().setFromQuaternion(q, 'YXZ');
  return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -euler.y);
}

function onDeviceOrientation(e) {
  if (e.beta === null) return;

  // [아이폰 흔들림 해결 핵심]
  // webkitCompassHeading(전자 나침반)은 주변 자기장/미세전류로 인해 1~3도씩 끊임없이 덜덜 떨리는 노이즈가 심함.
  // 우리 게임은 시작 시 정면을 0도로 앵커링하므로, 절대 나침반 대신 노이즈가 전혀 없는 순수 자이로 각도(e.alpha)를 최우선 사용함.
  let heading = 0;
  if (e.alpha !== null && e.alpha !== undefined) {
    heading = e.alpha;
  } else if (e.webkitCompassHeading !== undefined) {
    heading = 360 - e.webkitCompassHeading;
  }

  const screenOrient = (window.screen && window.screen.orientation && window.screen.orientation.angle !== undefined)
    ? window.screen.orientation.angle
    : (window.orientation || 0);

  latestRawQ = getOrientationQuaternion(heading, e.beta, e.gamma, screenOrient);
  sensorReady = true;

  if (!initialBaseQ && latestRawQ) {
    initialBaseQ = makeYawAnchor(latestRawQ);
  }
}

// 현재 폰이 바라보고 있는 수평 방향을 즉시 게임 정면(0°)으로 재설정
function resetSensorAnchor() {
  if (latestRawQ) {
    initialBaseQ = makeYawAnchor(latestRawQ);
  } else {
    initialBaseQ = null;
  }
}

// 적응형 로우패스 필터: 손을 멈추고 조준할 때는 미세 떨림을 완벽 차단하고, 폰을 휙 돌릴 때는 지연 없이 회전
function updateCameraOrientation(camera, dt = 0.016, baseSpeed = 11) {
  if (latestRawQ && initialBaseQ) {
    const targetQ = new THREE.Quaternion().multiplyQuaternions(initialBaseQ, latestRawQ);

    const angleDiff = camera.quaternion.angleTo(targetQ);

    let speed = baseSpeed;
    if (angleDiff < 0.012) {
      // 0.7도 미만의 미세 손떨림/센서 떨림 구간: 필터링 강도를 높여 과녁이 돌처럼 안정되게 고정
      speed = baseSpeed * 0.42;
    } else if (angleDiff > 0.06) {
      // 3.5도 이상의 둘러보기 구간: 딜레이 없이 카메라를 빠르게 추종
      speed = baseSpeed * 1.7;
    }

    const lerpFactor = 1 - Math.exp(-speed * dt);
    camera.quaternion.slerp(targetQ, Math.min(1.0, Math.max(0.02, lerpFactor)));
  }
}
