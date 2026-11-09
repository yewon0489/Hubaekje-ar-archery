/* ─────────────────────────────────────────────────────────────
   3D TARGETS - WIDE NATURAL EXPLORATION & FULL KNOCKDOWN PHYSICS
   - 좌우 둘러보기 시야각 (Yaw -75° ~ +75°: 왼쪽, 정면, 오른쪽을 둘러보며 탐색)
   - 과녁 명중 시 전체 넘어짐 물리 (뒤쪽 받침대까지 한 몸으로 시원하게 쿵 쓰러짐)
───────────────────────────────────────────────────────────── */

const GATE_TEMPLATES = [
  { id: 1, name: '1관문 (동문 평지성)', baseYaw: -75, basePitch: 4.5 },
  { id: 2, name: '2관문 (서벽 봉화대)', baseYaw: -40, basePitch: 6.5 },
  { id: 3, name: '3관문 (동고산성 망루)', baseYaw:   0, basePitch: 5.0 },
  { id: 4, name: '4관문 (동고사 종각)',   baseYaw:  40, basePitch: 7.0 },
  { id: 5, name: '5관문 (견훤 결전 과녁)', baseYaw:  75, basePitch: 4.5 }
];

// 사람이 왼쪽, 정면, 오른쪽을 자연스럽게 돌아보며 과녁을 찾는 최적 배치
function generateRandomTargetConfigs() {
  const shuffledSlots = [...GATE_TEMPLATES].sort(() => Math.random() - 0.5);

  return GATE_TEMPLATES.map((gate, idx) => {
    const slot = shuffledSlots[idx];
    // 슬롯 기준 ±3.5도 미세 지터
    const yaw = Number((slot.baseYaw + (Math.random() - 0.5) * 7.0).toFixed(1));
    // 피치: +4° ~ +8° 편안한 눈높이
    const pitch = Number((slot.basePitch + (Math.random() - 0.5) * 1.5).toFixed(1));
    // 거리: 11.5m ~ 14.5m
    const dist = Number((11.5 + Math.random() * 3.0).toFixed(1));
    // 필요 장력
    const reqPower = Number((0.42 + ((dist - 11.5) / 3.0) * 0.18).toFixed(2));

    return {
      id: gate.id,
      name: gate.name,
      yaw,
      pitch,
      dist,
      reqPower
    };
  });
}

let sharedTargetCanvas = null;

function createTargetCanvasTexture() {
  if (sharedTargetCanvas) return sharedTargetCanvas;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // 1. 볏짚 베이스
  ctx.fillStyle = '#dfb57b';
  ctx.beginPath();
  ctx.arc(256, 256, 254, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#c49658';
  ctx.lineWidth = 4;
  for (let r = 20; r < 250; r += 16) {
    ctx.beginPath();
    ctx.arc(256, 256, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 2. 선명한 전통 궁도 동심원 타겟 (불스아이)
  const rings = [
    { r: 210, c: '#f7f4ed', border: '#d9d2c5' },
    { r: 165, c: '#2b2a29', border: '#1a1918' },
    { r: 120, c: '#4375b8', border: '#2d5791' },
    { r: 76,  c: '#d93b30', border: '#b82a20' },
    { r: 36,  c: '#f5c538', border: '#d4a21e' }
  ];

  rings.forEach(({ r, c, border }) => {
    ctx.beginPath();
    ctx.arc(256, 256, r, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 5;
    ctx.stroke();
  });

  ctx.strokeStyle = '#805d00';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(256, 236); ctx.lineTo(256, 276);
  ctx.moveTo(236, 256); ctx.lineTo(276, 256);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  sharedTargetCanvas = tex;
  return tex;
}

class ThreeTarget {
  constructor(cfg, scene) {
    this.cfg = cfg;
    this.scene = scene;
    this.isCleared = false;
    this.recoilTime = 0;
    this.knockdownAngle = 0;
    this.knockdownTarget = 0;
    this.stuckArrows = [];
    this.animTime = Math.random() * 10;

    const yawRad = cfg.yaw * degToRad;
    const pitchRad = cfg.pitch * degToRad;

    const x = cfg.dist * Math.sin(yawRad) * Math.cos(pitchRad);
    const y = cfg.dist * Math.sin(pitchRad);
    const z = -cfg.dist * Math.cos(yawRad) * Math.cos(pitchRad);

    this.group = new THREE.Group();
    this.group.position.set(x, y, z);
    this.group.lookAt(0, y * 0.3, 0);

    // ── HINGE PIVOT (바닥을 축으로 과녁 전체가 통째로 넘어가는 피벗) ──
    this.hinge = new THREE.Group();
    this.hinge.position.set(0, -1.3, 0); // 바닥 접지면 (20% 축소 비율 반영)

    this.body = new THREE.Group();
    this.body.position.set(0, 1.3, 0); // 피벗 기준 원래 높이로 보정
    this.body.scale.set(0.8, 0.8, 0.8); // 🎯 표적판 및 표지판 크기 20% 축소 (면적 약 36% 감소로 적절한 명중 난이도 부여)
    this.hinge.add(this.body);
    this.group.add(this.hinge);

    // 1. 도톰하고 꽉 찬 3D 과녁 원통
    const targetTex = createTargetCanvasTexture();
    const diskGeom = new THREE.CylinderGeometry(1.48, 1.48, 0.26, 36);
    diskGeom.rotateX(Math.PI / 2);

    const strawSideMat = new THREE.MeshStandardMaterial({ color: 0xba8c53, roughness: 0.9, metalness: 0.05 });
    const faceMat = new THREE.MeshStandardMaterial({ map: targetTex, roughness: 0.7, metalness: 0.05 });
    const materials = [strawSideMat, faceMat, strawSideMat];

    this.diskMesh = new THREE.Mesh(diskGeom, materials);
    this.body.add(this.diskMesh);

    // 2. 전면 동심원 표적판 명시적 보강
    const facePlateGeom = new THREE.CircleGeometry(1.45, 36);
    const facePlateMesh = new THREE.Mesh(facePlateGeom, faceMat);
    facePlateMesh.position.set(0, 0, 0.135);
    this.body.add(facePlateMesh);

    // 3. 볏짚 테두리 링 & 붉은 장식 매듭
    const strawRimGeom = new THREE.TorusGeometry(1.47, 0.13, 16, 40);
    const strawRimMat = new THREE.MeshStandardMaterial({ color: 0xcfad76, roughness: 0.88 });
    const strawRim = new THREE.Mesh(strawRimGeom, strawRimMat);
    strawRim.position.set(0, 0, 0.13);
    this.body.add(strawRim);

    const strapMat = new THREE.MeshStandardMaterial({ color: 0xb5352f, roughness: 0.6 });
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const strapGeom = new THREE.TorusGeometry(0.15, 0.04, 10, 20);
      const strap = new THREE.Mesh(strapGeom, strapMat);
      strap.position.set(Math.cos(angle) * 1.45, Math.sin(angle) * 1.45, 0.14);
      strap.rotation.z = angle;
      strap.rotation.y = Math.PI / 2;
      this.body.add(strap);
    }

    // 4. 나무 받침대 (과녁 body에 함께 묶여 한 몸으로 넘어감)
    const legGeom = new THREE.BoxGeometry(0.18, 2.7, 0.18);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x734822, roughness: 0.85 });
    const legL = new THREE.Mesh(legGeom, legMat); legL.position.set(-0.95, -1.45, -0.15);
    legL.rotation.z = 0.08;
    const legR = new THREE.Mesh(legGeom, legMat); legR.position.set(0.95, -1.45, -0.15);
    legR.rotation.z = -0.08;
    const crossBarGeom = new THREE.BoxGeometry(2.3, 0.16, 0.16);
    const crossBar = new THREE.Mesh(crossBarGeom, legMat); crossBar.position.set(0, -1.65, -0.12);
    this.body.add(legL, legR, crossBar);

    // 5. 관문 이름표 스프라이트
    const powerHint = `[${cfg.dist}m · 장력 ${Math.round(cfg.reqPower * 100)}%]`;
    this.titleSprite = this.createTextSprite(`${cfg.name} ${powerHint}`, '#4a3219', '#fff8e7', '#c89d66');
    this.titleSprite.position.set(0, 2.25, 0);
    this.body.add(this.titleSprite);

    // 6. 클리어 후광 링
    const auraGeom = new THREE.RingGeometry(1.58, 1.82, 36);
    this.auraMat = new THREE.MeshBasicMaterial({ color: 0x68c964, side: THREE.DoubleSide, transparent: true, opacity: 0 });
    this.auraMesh = new THREE.Mesh(auraGeom, this.auraMat);
    this.auraMesh.position.set(0, 0, 0.16);
    this.body.add(this.auraMesh);

    scene.add(this.group);
  }

  createTextSprite(text, textColor, bgColor, borderColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 640; canvas.height = 136;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(16, 20, 608, 96, 28);
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.font = 'bold 31px "Maplestory", "GmarketSans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 320, 68);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(4.2, 0.92, 1);
    return sprite;
  }

  // 명중 격파 시: 과녁 받침대까지 통째로 뒤로 확 쓰러짐 (Knockdown Fall Down)
  markCleared() {
    this.isCleared = true;
    this.auraMat.opacity = 0.95;
    this.knockdownTarget = -1.35; // 뒤로 약 78도 시원하게 쓰러짐

    this.body.remove(this.titleSprite);
    this.titleSprite = this.createTextSprite(`💥 ${this.cfg.name} 격파 쓰러짐!`, '#ffffff', '#e8504b', '#ffffff');
    this.titleSprite.position.set(0, 2.25, 0);
    this.body.add(this.titleSprite);
  }

  addStuckArrow(localHitPoint) {
    const arrowGroup = new THREE.Group();
    arrowGroup.position.copy(localHitPoint);

    const shaftGeom = new THREE.CylinderGeometry(0.025, 0.025, 1.25, 10);
    shaftGeom.rotateX(Math.PI / 2);
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0xd7995b });
    const shaft = new THREE.Mesh(shaftGeom, shaftMat);
    shaft.position.set(0, 0, 0.6);
    arrowGroup.add(shaft);

    const featherGeom = new THREE.BoxGeometry(0.02, 0.18, 0.28);
    const featherMat = new THREE.MeshBasicMaterial({ color: 0xe34c43 });
    const feather = new THREE.Mesh(featherGeom, featherMat);
    feather.position.set(0, 0, 1.15);
    arrowGroup.add(feather);

    // body의 자식으로 꽂아서 과녁과 함께 같이 넘어감
    this.body.add(arrowGroup);
    this.stuckArrows.push({ group: arrowGroup, wobbleTime: 0 });
    this.recoilTime = 1.0;
  }

  update(dt) {
    this.animTime += dt;

    // 1. 쓰러짐(Knockdown) 물리 애니메이션 (과녁 전체가 뒤로 쿵 넘어감)
    if (this.knockdownTarget !== 0) {
      this.knockdownAngle = THREE.MathUtils.lerp(this.knockdownAngle, this.knockdownTarget, dt * 6.5);
      this.hinge.rotation.x = this.knockdownAngle;
    } else if (this.recoilTime > 0) {
      // 일반 타격 시 과녁 전체 덜컹 반동
      this.recoilTime -= dt * 3.2;
      const angle = -Math.sin(this.recoilTime * 16) * this.recoilTime * 0.28;
      this.hinge.rotation.x = angle;
    } else {
      this.hinge.rotation.x = 0;
    }

    // 2. 꽂힌 화살 흔들림
    for (const a of this.stuckArrows) {
      if (a.wobbleTime < 1.0) {
        a.wobbleTime += dt * 3.5;
        const wobble = Math.sin(a.wobbleTime * 24) * (1 - a.wobbleTime) * 0.12;
        a.group.rotation.x = wobble;
      }
    }
  }
}

class ThreeArrowFlight {
  constructor(startPos, targetPos, power, targetObj, isHit, scene) {
    this.startPos = startPos.clone();
    this.targetPos = targetPos.clone();
    this.power = power;
    this.targetObj = targetObj;
    this.isHit = isHit;
    this.scene = scene;

    const dist = startPos.distanceTo(targetPos);
    this.duration = Math.max(0.20, (dist / 58) * (1.1 - power * 0.25));
    this.t = 0;
    this.done = false;

    this.mesh = new THREE.Group();
    const shaftGeom = new THREE.CylinderGeometry(0.025, 0.025, 1.25, 10);
    shaftGeom.rotateX(Math.PI / 2);
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0xd7995b });
    const shaft = new THREE.Mesh(shaftGeom, shaftMat);
    this.mesh.add(shaft);

    const tipGeom = new THREE.ConeGeometry(0.065, 0.20, 10);
    tipGeom.rotateX(Math.PI / 2);
    const tipMat = new THREE.MeshStandardMaterial({ color: 0xb0b5bc, metalness: 0.4, roughness: 0.4 });
    const tip = new THREE.Mesh(tipGeom, tipMat);
    tip.position.set(0, 0, 0.68);
    this.mesh.add(tip);

    const trailGeom = new THREE.CylinderGeometry(0.01, 0.04, 2.2, 6);
    trailGeom.rotateX(Math.PI / 2);
    const trailMat = new THREE.MeshBasicMaterial({ color: 0xffd15c, transparent: true, opacity: 0.55 });
    const trail = new THREE.Mesh(trailGeom, trailMat);
    trail.position.set(0, 0, -1.0);
    this.mesh.add(trail);

    scene.add(this.mesh);
  }

  update(dt) {
    this.t += dt / this.duration;
    if (this.t >= 1) {
      this.t = 1;
      this.done = true;
    }

    const curPos = this.startPos.clone().lerp(this.targetPos, this.t);
    const arcLift = Math.sin(this.t * Math.PI) * 0.6 * this.power;
    const gravityDrop = (1.0 - this.power) * 1.6 * (this.t * this.t);
    curPos.y += arcLift - gravityDrop;

    this.mesh.position.copy(curPos);

    const nextT = Math.min(1.0, this.t + 0.05);
    const nextPos = this.startPos.clone().lerp(this.targetPos, nextT);
    nextPos.y += Math.sin(nextT * Math.PI) * 0.6 * this.power - (1.0 - this.power) * 1.6 * (nextT * nextT);
    this.mesh.lookAt(nextPos);

    if (this.done) {
      this.scene.remove(this.mesh);
      if (this.targetObj && this.isHit) {
        const worldHit = curPos.clone();
        // body 로컬 좌표계로 변환하여 과녁과 함께 넘어감
        const localHit = this.targetObj.body.worldToLocal(worldHit);
        this.targetObj.addStuckArrow(localHit);
      }
    }
  }
}
