/* ─────────────────────────────────────────────────────────────
   MAIN GAME ENGINE & TARGET NAVIGATOR (THREE.JS AR ARCHERY)
   현무랑 후백제 산책 AR 양궁 메인 컨트롤러
   - iOS Safari (아이폰) 완벽 호환: 동기적 센서 권한 요청 + play() 명시 호출
   - 원본 친숙한 2D 클레이 활/화살 UI 100% 복원
   - 과녁 명중 시 통째로 뒤로 쿵 쓰러지는 전신 넘어짐 물리 연출 (Knockdown)
   - 좌우 둘러보기 시야각 (Yaw -75° ~ +75°: 왼쪽, 정면, 오른쪽을 둘러보며 탐색)
   - 정확한 5초 로딩 (화면 전환 깜빡임 원천 차단)
───────────────────────────────────────────────────────────── */

const STAGES = {
  LOGIN: 'view-login',
  LOADING: 'view-loading',
  VIDEO: 'view-video',
  BRIEFING: 'view-briefing',
  GAME: 'view-game',
  RESULT: 'view-result',
  INVENTORY: 'view-inventory'
};

/* ── 0. 모든 핵심 배경/UI 에셋 사전 디코딩 (화면 전환 지연 방지) ── */
const CRITICAL_ASSETS = [
  'assets/bg/bg_intro.png',
  'assets/bg/bg_loading.png',
  'assets/bg/bg_cinema.png',
  'assets/bg/bg_archery.png',
  'assets/bg/bg_inven.png',
  'assets/char/char_1.png',
  'assets/char/char_2.png',
  'assets/char/char_3.png',
  'assets/char/char_4.png',
  'assets/char/char_5.png',
  'assets/ui/logo.png',
  'assets/ui/target.png',
  'assets/ui/badge_unlocked.png'
];

function preloadCriticalAssets() {
  CRITICAL_ASSETS.forEach(src => {
    const img = new Image();
    img.src = src;
    if (img.decode) {
      img.decode().catch(() => {});
    }
  });
}
preloadCriticalAssets();

// 글자 입력(가상 키보드/IME) 시 화면 흔들림 방지
let lockedAppHeight = window.innerHeight;
function lockViewportHeight() {
  const activeEl = document.activeElement;
  const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
  if (!isTyping) {
    lockedAppHeight = window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${lockedAppHeight}px`);
  }
}
window.addEventListener('resize', lockViewportHeight);
lockViewportHeight();

setupInteractiveCharacters();

// 인벤토리 4대 유적지 터치 시 견훤/후백제 역사 해설 표시
document.querySelectorAll('.badge-slot[data-spot-info]').forEach(slot => {
  slot.addEventListener('click', () => {
    const info = slot.getAttribute('data-spot-info');
    const descBox = document.getElementById('inv-history-desc');
    if (descBox && info) {
      descBox.innerHTML = info;
    }
  });
});

function setStage(stageId) {
  const target = document.getElementById(stageId);
  const current = document.querySelector('.view-screen.active');

  if (target) {
    target.classList.add('active');
    if (current && current !== target) {
      requestAnimationFrame(() => {
        current.classList.remove('active');
      });
    }
  }

  if (stageId !== STAGES.GAME && G && G.running) {
    G.running = false;
  }
}

function showToast(text) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerText = text;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}

/* ── STAGE 1: LOGIN ────────────────────────────────────────── */
const usernameInput = document.getElementById('input-username');
const loginBubble = document.getElementById('login-bubble');

if (usernameInput) {
  usernameInput.addEventListener('input', () => {
    const val = usernameInput.value.trim();
    if (val && loginBubble) {
      loginBubble.innerText = `반가워 [${val}] 대원! 견훤 대왕님의 도읍 완산주로 출발하자!`;
    }
  });
}

const btnLoginStart = document.getElementById('btn-login-start');
if (btnLoginStart) {
  btnLoginStart.addEventListener('click', () => {
    const name = (usernameInput ? usernameInput.value.trim() : '') || '현무랑친구';
    localStorage.setItem('hbk_player', name);
    if (typeof sound !== 'undefined') sound.init();
    startLoadingStage();
  });
}

/* ── STAGE 2: LOADING (정확한 5.0초 고정 타이머) ──── */
const TMI_LIST = [
  "서기 900년 견훤 대왕님은 완산주(현재의 전주)에 도읍을 정하고 '백제 의자왕의 숙원을 풀겠다'며 후백제를 건국했어요!",
  "견훤 대왕님은 신라 서남해안을 지키던 비장 출신으로, 늘 군사들 맨 앞에서 활을 쏘며 사기를 북돋운 명궁(神弓)이었습니다.",
  "삼국유사와 삼국사기에는 아기였던 견훤이 숲속에서 호랑이의 젖을 먹고 자라 남다른 용력과 기상을 지녔다는 설화가 전해져요!",
  "전주 동고산성 발굴 조사에서는 후백제 왕궁을 증명하는 '전주성(全州城)' 명문 기와와 대형 건물터가 실제로 출토되었어요!",
  "후백제는 중국(오월·후당), 거란, 일본과 활발히 교류하며 당대 후삼국 중 가장 비옥한 영토와 최강의 군사력을 자랑했습니다.",
  "견훤 대왕님이 창건한 '동고사', 군사들이 물을 마시던 '낙수정', 남쪽 방어선 '완산칠봉'은 모두 전주에 살아 숨 쉬는 후백제 유적이에요!"
];

let currentTmiIdx = 0;
const tmiContentEl = document.getElementById('tmi-content');
const btnNextTmi = document.getElementById('btn-next-tmi');

if (btnNextTmi) {
  btnNextTmi.addEventListener('click', () => {
    currentTmiIdx = (currentTmiIdx + 1) % TMI_LIST.length;
    if (tmiContentEl) tmiContentEl.innerText = TMI_LIST[currentTmiIdx];
  });
}

function startLoadingStage() {
  setStage(STAGES.LOADING);
  const bar = document.getElementById('loading-bar');
  if (bar) bar.style.width = '0%';

  const TOTAL_LOADING_MS = 5000;
  const startTime = performance.now();
  let lastTmiSwitch = startTime;

  function updateLoadingBar(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1.0, elapsed / TOTAL_LOADING_MS);

    if (bar) {
      bar.style.width = `${(progress * 100).toFixed(1)}%`;
    }

    if (now - lastTmiSwitch >= 2200) {
      currentTmiIdx = (currentTmiIdx + 1) % TMI_LIST.length;
      if (tmiContentEl) tmiContentEl.innerText = TMI_LIST[currentTmiIdx];
      lastTmiSwitch = now;
    }

    if (progress < 1.0) {
      requestAnimationFrame(updateLoadingBar);
    } else {
      setTimeout(() => startVideoStage(), 350);
    }
  }

  requestAnimationFrame(updateLoadingBar);
}

/* ── STAGE 3: VIDEO ────────────────────────────────────────── */
const introVideo = document.getElementById('intro-video');
const btnToggleSound = document.getElementById('btn-toggle-sound');

function startVideoStage() {
  setStage(STAGES.VIDEO);
  if (!introVideo) return;
  introVideo.currentTime = 0;
  introVideo.muted = false;
  introVideo.play().then(() => {
    if (btnToggleSound) btnToggleSound.innerText = '🔊 소리 켜짐';
  }).catch(() => {
    introVideo.muted = true;
    introVideo.play().catch(() => {});
    if (btnToggleSound) btnToggleSound.innerText = '🔇 터치하여 소리 켜기';
  });
}

if (btnToggleSound && introVideo) {
  btnToggleSound.addEventListener('click', () => {
    introVideo.muted = !introVideo.muted;
    btnToggleSound.innerText = introVideo.muted ? '🔇 터치하여 소리 켜기' : '🔊 소리 켜짐';
  });
}

if (introVideo) {
  introVideo.addEventListener('ended', () => setStage(STAGES.BRIEFING));
}
const btnSkipVideo = document.getElementById('btn-skip-video');
if (btnSkipVideo && introVideo) {
  btnSkipVideo.addEventListener('click', () => {
    introVideo.pause();
    setStage(STAGES.BRIEFING);
  });
}

/* ── STAGE 4: BRIEFING (iOS Safari 최적화 터치 진입점) ──────── */
const btnStartGame = document.getElementById('btn-start-game');
if (btnStartGame) {
  btnStartGame.addEventListener('click', () => {
    // 💡 [iOS Safari 필수] 사용자 직접 터치 이벤트 콜백 최상단에서 동기적으로 센서 권한 요청 프로미스 획득!
    let orientPermPromise = null;
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      orientPermPromise = DeviceOrientationEvent.requestPermission();
    }

    if (typeof sound !== 'undefined') sound.init();

    setStage(STAGES.GAME);
    startARGameSession(orientPermPromise);
  });
}

/* ── STAGE 6 & 7: RESULT & INVENTORY ──────────────────────── */
const btnOpenInventory = document.getElementById('btn-open-inventory');
if (btnOpenInventory) {
  btnOpenInventory.addEventListener('click', () => setStage(STAGES.INVENTORY));
}
const btnInvBack = document.getElementById('btn-inv-back');
if (btnInvBack) {
  btnInvBack.addEventListener('click', () => setStage(STAGES.LOGIN));
}
const btnPlayAgain = document.getElementById('btn-play-again');
if (btnPlayAgain) {
  btnPlayAgain.addEventListener('click', () => {
    setStage(STAGES.GAME);
    startARGameSession();
  });
}

/* ─────────────────────────────────────────────────────────────
   THREE.JS 3D SCENE & TARGETS
───────────────────────────────────────────────────────────── */
let scene, camera, renderer, ambientParticles;
const canvas3d = document.getElementById('canvas-3d');
const hudCanvas = document.getElementById('hud-canvas');
const hudCtx = hudCanvas ? hudCanvas.getContext('2d') : null;
let W = window.innerWidth;
let H = window.innerHeight;

function resizeViewports() {
  W = window.innerWidth;
  H = window.innerHeight;
  if (hudCanvas) {
    hudCanvas.width = W;
    hudCanvas.height = H;
  }
  if (camera && renderer) {
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  }
}
window.addEventListener('resize', resizeViewports);

function initThreeScene() {
  resizeViewports();

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(65, W / H, 0.1, 500);
  camera.position.set(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ canvas: canvas3d, alpha: true, antialias: true });
  renderer.setSize(W, H);
  // 모바일/아이폰 고해상도(3x) 기기 과부하 방지
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xfff5db, 0.9);
  dirLight.position.set(10, 20, 15);
  scene.add(dirLight);

  const particleCount = 80;
  const pGeom = new THREE.BufferGeometry();
  const pPositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i += 3) {
    pPositions[i] = (Math.random() - 0.5) * 45;
    pPositions[i + 1] = Math.random() * 15;
    pPositions[i + 2] = -Math.random() * 30;
  }
  pGeom.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  const pMat = new THREE.PointsMaterial({ color: 0xffe699, size: 0.18, transparent: true, opacity: 0.75 });
  ambientParticles = new THREE.Points(pGeom, pMat);
  scene.add(ambientParticles);
}

/* ── 상단 과녁 네비게이터 계산 및 표시 ── */
const navBar = document.getElementById('ar-nav-bar');
const navImg = document.getElementById('ar-partner-img');
const navDirText = document.getElementById('ar-nav-dir');
const navSubText = document.getElementById('ar-nav-sub');

function updateTargetNavigator() {
  if (!G || !G.targets || !camera) return null;

  const uncleared = G.targets.filter(t => !t.isCleared);
  if (uncleared.length === 0) return null;

  const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const camYaw = Math.atan2(camForward.x, -camForward.z);

  let bestTarget = null;
  let minAbsAngle = 999;
  let bestDeltaDeg = 0;

  for (const t of uncleared) {
    const pos = t.group.position;
    const targetYaw = Math.atan2(pos.x, -pos.z);
    let diff = targetYaw - camYaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    const diffDeg = diff * (180 / Math.PI);
    if (Math.abs(diffDeg) < minAbsAngle) {
      minAbsAngle = Math.abs(diffDeg);
      bestDeltaDeg = diffDeg;
      bestTarget = t;
    }
  }

  if (!bestTarget) return null;

  const absDeg = Math.round(Math.abs(bestDeltaDeg));
  const reqPct = Math.round(bestTarget.cfg.reqPower * 100);

  if (absDeg <= 14) {
    if (navBar) navBar.classList.add('locked-on');
    if (navImg && !navImg.src.includes('char_4.png')) navImg.src = 'assets/char/char_4.png';
    if (navDirText) navDirText.innerText = `🎯 포착 완료! [${bestTarget.cfg.name}]`;
    if (navSubText) navSubText.innerText = `거리 ${bestTarget.cfg.dist}m · 시위를 ${reqPct}% 이상 당겨 쏘세요!`;
  } else {
    if (navBar) navBar.classList.remove('locked-on');
    if (navImg && !navImg.src.includes('char_5.png')) navImg.src = 'assets/char/char_5.png';
    const dirWord = bestDeltaDeg > 0 ? '오른쪽 👉' : '👈 왼쪽';
    if (navDirText) navDirText.innerText = `🧭 과녁 방향: ${dirWord}으로 약 ${absDeg}° 회전`;
    if (navSubText) navSubText.innerText = `가장 가까운 관문: ${bestTarget.cfg.name} (${bestTarget.cfg.dist}m)`;
  }

  return { target: bestTarget, deltaDeg: bestDeltaDeg };
}

/* ─────────────────────────────────────────────────────────────
   TOUCH & DRAG INTERACTION (iOS 터치 씹힘 및 스크롤 방지)
───────────────────────────────────────────────────────────── */
let isPulling = false;
let pullStartX = 0;
let pullStartY = 0;
let pullDx = 0;
let pullDy = 0;

function onTouchStart(x, y) {
  if (!G || !G.running || G.arrows <= 0) return;
  isPulling = true;
  pullStartX = x;
  pullStartY = y;
  pullDx = 0;
  pullDy = 0;
}

function onTouchMove(x, y) {
  if (isPulling) {
    pullDx = Math.max(-MAX_PULL_X, Math.min(MAX_PULL_X, x - pullStartX));
    pullDy = Math.max(0, Math.min(MAX_PULL_Y, y - pullStartY));
    const totalPull = Math.hypot(pullDx, pullDy);
    const tension = Math.min(1.0, totalPull / MAX_PULL_Y);
    if (tension > 0.45 && navigator.vibrate && Math.random() < 0.15) {
      navigator.vibrate(8);
    }
  }
}

function onTouchEnd() {
  if (isPulling) {
    isPulling = false;
    const totalPull = Math.hypot(pullDx, pullDy);
    const power = Math.min(1.0, totalPull / MAX_PULL_Y);
    if (power >= 0.18) {
      fireArrow(pullDx, pullDy, power);
    }
    pullDx = 0;
    pullDy = 0;
  }
}

if (hudCanvas) {
  hudCanvas.addEventListener('touchstart', e => {
    e.preventDefault();
    onTouchStart(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });
  hudCanvas.addEventListener('touchmove', e => {
    e.preventDefault();
    onTouchMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });
  hudCanvas.addEventListener('touchend', e => {
    e.preventDefault();
    onTouchEnd();
  }, { passive: false });

  hudCanvas.addEventListener('mousedown', e => onTouchStart(e.clientX, e.clientY));
  window.addEventListener('mousemove', e => { if (isPulling) onTouchMove(e.clientX, e.clientY); });
  window.addEventListener('mouseup', () => onTouchEnd());
}

/* ─────────────────────────────────────────────────────────────
   3D RAYCASTING & BALLISTIC ARROW FIRING
───────────────────────────────────────────────────────────── */
function fireArrow(dx, dy, power) {
  if (!G || G.arrows <= 0) return;
  G.arrows--;
  if (typeof sound !== 'undefined') sound.playRelease(power);
  if (navigator.vibrate) navigator.vibrate(power > 0.75 ? 40 : 20);

  triggerBowRecoil(power);

  const lateralFactor = 2.4;
  const launchLateralOffset = -dx * lateralFactor;

  const aimX = ((W / 2 + launchLateralOffset) / W) * 2 - 1;
  const aimY = -((H / 2) / H) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(aimX, aimY), camera);

  // 미격파 과녁만 충돌 검사
  const activeTargets = G.targets.filter(t => !t.isCleared);
  const targetDisks = activeTargets.map(t => t.diskMesh);
  const intersects = raycaster.intersectObjects(targetDisks);

  let hitTarget = null;
  let targetWorldPoint = null;
  let isHit = false;

  if (intersects.length > 0) {
    const hitMesh = intersects[0].object;
    hitTarget = activeTargets.find(t => t.diskMesh === hitMesh);
    targetWorldPoint = intersects[0].point.clone();

    if (power >= hitTarget.cfg.reqPower) {
      isHit = true;
    } else {
      isHit = false;
      const deficit = hitTarget.cfg.reqPower - power;
      const dropY = deficit * (hitTarget.cfg.dist * 0.35) + 0.7;
      targetWorldPoint.y -= dropY;
    }
  } else {
    targetWorldPoint = camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(32));
  }

  const startWorldPos = camera.position.clone().add(new THREE.Vector3(0, -0.35, -0.4).applyQuaternion(camera.quaternion));

  const flight = new ThreeArrowFlight(startWorldPos, targetWorldPoint, power, hitTarget, isHit, scene);
  G.flights.push(flight);

  setTimeout(() => {
    if (!G) return;
    if (hitTarget) {
      if (isHit) {
        if (typeof sound !== 'undefined') sound.playSpatialHit(true, dx / MAX_PULL_X);
        if (navigator.vibrate) navigator.vibrate([35, 40, 35]);

        if (!hitTarget.isCleared) {
          hitTarget.markCleared();
          if (navImg) navImg.src = 'assets/char/char_1.png';
          showToast(`🎯 [${hitTarget.cfg.name}] 명중 격파! 과녁 쓰러짐!`);
        } else {
          showToast('이미 맞힌 과녁이에요! 상단 화살표를 따라 다음 과녁을 찾아보세요.');
        }

        const clearedCount = G.targets.filter(t => t.isCleared).length;
        const hudCleared = document.getElementById('hud-cleared');
        if (hudCleared) hudCleared.innerText = clearedCount;

        if (clearedCount >= 5) {
          if (typeof sound !== 'undefined') sound.playFanfare();
          setTimeout(() => endARGame(), 1100);
        }
      } else {
        if (typeof sound !== 'undefined') sound.playSpatialHit(false, dx / MAX_PULL_X);
        if (navImg) navImg.src = 'assets/char/char_2.png';
        showToast(`⚠️ 장력 부족! 최소 ${Math.round(hitTarget.cfg.reqPower * 100)}% 이상 당겨주세요!`);
      }
    }

    const clearedCount = G.targets.filter(t => t.isCleared).length;
    if (G.arrows <= 0 && clearedCount < 5) {
      setTimeout(() => {
        showToast('화살을 모두 사용했어요! 다시 도전해 볼까요?');
        setTimeout(() => setStage(STAGES.BRIEFING), 1800);
      }, 1200);
    }
  }, flight.duration * 1000);
}

/* ─────────────────────────────────────────────────────────────
   MAIN RENDER LOOP
───────────────────────────────────────────────────────────── */
let G = null;
let clock = new THREE.Clock();

function drawEdgeGuideArrow(ctx, W, H, deltaDeg) {
  if (Math.abs(deltaDeg) <= 14) return;

  ctx.save();
  const isRight = deltaDeg > 0;
  const edgeX = isRight ? W - 36 : 36;
  const edgeY = H * 0.44;
  const pulse = Math.sin(Date.now() * 0.008) * 5;

  ctx.translate(edgeX + (isRight ? -pulse : pulse), edgeY);

  ctx.fillStyle = 'rgba(255, 248, 231, 0.92)';
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f5a623';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  ctx.fillStyle = '#e8504b';
  ctx.beginPath();
  if (isRight) {
    ctx.moveTo(12, 0);
    ctx.lineTo(-6, -11);
    ctx.lineTo(-6, 11);
  } else {
    ctx.moveTo(-12, 0);
    ctx.lineTo(6, -11);
    ctx.lineTo(6, 11);
  }
  ctx.closePath();
  ctx.fill();

  ctx.font = 'bold 11px "Maplestory", sans-serif';
  ctx.fillStyle = '#4a3219';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(Math.abs(deltaDeg))}°`, 0, 38);
  ctx.restore();
}

function renderLoop() {
  if (!G || !G.running) return;
  const dt = Math.min(0.05, clock.getDelta());

  // 1. 자이로 회전 반영
  updateCameraOrientation(camera, dt);

  // 2. 공간 파티클 회전
  if (ambientParticles) {
    ambientParticles.rotation.y += 0.0005;
  }

  // 3. 과녁 애니메이션 업데이트 (넘어짐 물리)
  for (const t of G.targets) {
    t.update(dt);
  }

  // 4. 가장 가까운 미격파 과녁 탐색 및 상단 네비게이터 갱신
  const navResult = updateTargetNavigator();

  // 5. 화살 비행 물리 업데이트
  for (let i = G.flights.length - 1; i >= 0; i--) {
    const f = G.flights[i];
    f.update(dt);
    if (f.done) G.flights.splice(i, 1);
  }

  // 6. 3D 씬 렌더링
  renderer.render(scene, camera);

  // 7. 2D HUD (조준선 + 가장자리 가이드 화살표 + 원본 2D 클레이 활/화살)
  if (hudCtx) {
    hudCtx.clearRect(0, 0, W, H);

    if (navResult) {
      drawEdgeGuideArrow(hudCtx, W, H, navResult.deltaDeg);
    }

    const aimShiftX = isPulling ? -pullDx * 2.4 : 0;
    hudCtx.save();
    hudCtx.strokeStyle = isPulling ? '#68c964' : 'rgba(255, 255, 255, 0.85)';
    hudCtx.lineWidth = 2.5;
    hudCtx.beginPath();
    hudCtx.arc(W / 2 + aimShiftX, H / 2, 16, 0, Math.PI * 2);
    hudCtx.moveTo(W / 2 + aimShiftX - 24, H / 2); hudCtx.lineTo(W / 2 + aimShiftX + 24, H / 2);
    hudCtx.moveTo(W / 2 + aimShiftX, H / 2 - 24); hudCtx.lineTo(W / 2 + aimShiftX, H / 2 + 24);
    hudCtx.stroke();
    hudCtx.restore();

    drawFirstPersonBow(hudCtx, W, H, pullDx, pullDy, isPulling, G.arrows);
  }

  const hudArrows = document.getElementById('hud-arrows');
  if (hudArrows) hudArrows.innerText = G.arrows;
  const clearedCount = G.targets.filter(t => t.isCleared).length;
  const hudCleared = document.getElementById('hud-cleared');
  if (hudCleared) hudCleared.innerText = clearedCount;

  requestAnimationFrame(renderLoop);
}

/* ─────────────────────────────────────────────────────────────
   START & END AR GAME SESSION (iOS Safari 완벽 지원)
───────────────────────────────────────────────────────────── */
const arVideo = document.getElementById('ar-video');
let cameraStreamActive = false;

async function startARGameSession(orientPermPromise = null) {
  if (!scene) initThreeScene();

  // 📱 [iOS Safari 센서 권한 해결] 사용자 직접 터치에서 획득한 프로미스 평가
  if (orientPermPromise) {
    try {
      const perm = await orientPermPromise;
      if (perm === 'granted') {
        window.addEventListener('deviceorientation', onDeviceOrientation, true);
      } else {
        showToast('⚠️ 아이폰 설정 > Safari에서 동작 센서를 허용해주세요!');
      }
    } catch (e) {
      console.warn('iOS orientation permission err:', e);
    }
  } else if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const perm = await DeviceOrientationEvent.requestPermission();
      if (perm === 'granted') {
        window.addEventListener('deviceorientation', onDeviceOrientation, true);
      }
    } catch (e) {}
  } else {
    window.addEventListener('deviceorientation', onDeviceOrientation, true);
  }

  // 📷 [iOS Safari 카메라 검은 화면 해결] playsinline 및 명시적 play() 호출
  if (!cameraStreamActive && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && arVideo) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      arVideo.setAttribute('playsinline', '');
      arVideo.setAttribute('webkit-playsinline', '');
      arVideo.muted = true;
      arVideo.srcObject = stream;
      await arVideo.play();
      cameraStreamActive = true;
    } catch (err) {
      console.warn('Camera fallback to background:', err);
    }
  }

  if (G && G.targets) {
    for (const t of G.targets) scene.remove(t.group);
  }

  // 자이로 기준 영점 자동 고정 (게임 시작 시 정면 0°)
  resetSensorAnchor();

  // 사람이 왼쪽/오른쪽을 둘러보며 탐색하도록 과녁 생성 (Yaw -75° ~ +75°)
  const randomConfigs = generateRandomTargetConfigs();
  const targets = randomConfigs.map(cfg => new ThreeTarget(cfg, scene));

  G = {
    running: true,
    arrows: 15,
    targets: targets,
    flights: []
  };

  const hudArrows = document.getElementById('hud-arrows');
  if (hudArrows) hudArrows.innerText = G.arrows;
  const hudCleared = document.getElementById('hud-cleared');
  if (hudCleared) hudCleared.innerText = 0;

  clock.start();
  requestAnimationFrame(renderLoop);
}

function endARGame() {
  if (G) G.running = false;
  setStage(STAGES.RESULT);
}
