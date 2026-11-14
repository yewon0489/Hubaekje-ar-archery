/**
 * First-person Bow & Arrow UI Renderer
 * Handles procedural 2D canvas drawing, tension mechanics, and draw animations.
 */
const MAX_PULL_Y = 145;
const MAX_PULL_X = 120;

let bowRecoilOffset = 0;

function triggerBowRecoil(power) {
  bowRecoilOffset = 18 + power * 22;
}

function drawFirstPersonBow(ctx, W, H, pDx, pDy, isPulling, arrowsLeft) {
  bowRecoilOffset *= 0.80;

  const time = Date.now() * 0.0025;
  const idleBreatheY = isPulling ? 0 : Math.sin(time) * 3.0;
  const idleBreatheX = isPulling ? 0 : Math.cos(time * 0.7) * 1.6;

  const cx = W / 2 + idleBreatheX;
  const gripY = H - 155 + idleBreatheY - bowRecoilOffset;

  const pullDist = Math.hypot(pDx, pDy);
  const power = Math.min(1.0, pullDist / MAX_PULL_Y);

  const aimShiftX = isPulling ? -pDx * 2.4 : 0;
  const aimX = (W / 2) + aimShiftX;
  const aimY = H / 2;

  const aimAngle = (power > 0.05 || Math.abs(pDx) > 5) ? Math.atan2(aimY - gripY, aimX - cx) : -Math.PI / 2;

  const restDist = 64;
  const totalDraw = restDist + (power * 106);
  const nockX = cx - Math.cos(aimAngle) * totalDraw;
  const nockY = gripY - Math.sin(aimAngle) * totalDraw;

  ctx.save();

  const span = Math.min(W * 0.88, 350);
  const hw = span / 2;
  const flex = power * 26;

  const tipLX = cx - hw + flex * 0.45;
  const tipLY = H - 82 + idleBreatheY + flex * 0.45;
  const tipRX = cx + hw - flex * 0.45;
  const tipRY = H - 82 + idleBreatheY + flex * 0.45;

  // 1. Soft Clay Drop Shadow
  ctx.save();
  ctx.shadowColor = 'rgba(59, 40, 22, 0.45)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;

  // 2. Warm Brown Clay Bow Limbs
  ctx.beginPath();
  ctx.moveTo(tipLX, tipLY);
  ctx.bezierCurveTo(cx - hw * 0.72, gripY - 6, cx - hw * 0.38, gripY - 8, cx, gripY);
  ctx.bezierCurveTo(cx + hw * 0.38, gripY - 8, cx + hw * 0.72, gripY - 6, tipRX, tipRY);
  ctx.strokeStyle = '#8b4e24';
  ctx.lineWidth = 24;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();

  // Inner Clay Limb Fill
  const limbGrad = ctx.createLinearGradient(tipLX, gripY - 20, tipRX, gripY + 20);
  limbGrad.addColorStop(0.0, '#a66030');
  limbGrad.addColorStop(0.5, '#c47943');
  limbGrad.addColorStop(1.0, '#a66030');

  ctx.beginPath();
  ctx.moveTo(tipLX, tipLY);
  ctx.bezierCurveTo(cx - hw * 0.72, gripY - 6, cx - hw * 0.38, gripY - 8, cx, gripY);
  ctx.bezierCurveTo(cx + hw * 0.38, gripY - 8, cx + hw * 0.72, gripY - 6, tipRX, tipRY);
  ctx.strokeStyle = limbGrad;
  ctx.lineWidth = 19;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Top Clay Highlight
  ctx.beginPath();
  ctx.moveTo(tipLX + 4, tipLY - 3);
  ctx.bezierCurveTo(cx - hw * 0.72, gripY - 10, cx - hw * 0.38, gripY - 12, cx, gripY - 4);
  ctx.bezierCurveTo(cx + hw * 0.38, gripY - 12, cx + hw * 0.72, gripY - 10, tipRX - 4, tipRY - 3);
  ctx.strokeStyle = 'rgba(255, 235, 210, 0.42)';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.stroke();

  // 3. White & Red Striped Center Grip Bands
  const bandSegments = [
    { offset: -64, w: 18, c: '#f5efe6', h: 21 },
    { offset: -46, w: 16, c: '#b8332e', h: 22 },
    { offset: -29, w: 16, c: '#f5efe6', h: 22 },
    { offset: -14, w: 16, c: '#ee5250', h: 26 },
    { offset:   0, w: 14, c: '#f5efe6', h: 22 },
    { offset:  14, w: 16, c: '#ee5250', h: 26 },
    { offset:  29, w: 16, c: '#f5efe6', h: 22 },
    { offset:  46, w: 16, c: '#b8332e', h: 22 },
    { offset:  64, w: 18, c: '#f5efe6', h: 21 }
  ];
  bandSegments.forEach(seg => {
    ctx.fillStyle = seg.c;
    ctx.beginPath();
    ctx.roundRect(cx + seg.offset - seg.w / 2, gripY - seg.h / 2, seg.w, seg.h, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(74, 50, 25, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });

  // 4. Rounded Bulb Tips
  ctx.fillStyle = '#b56c3a';
  ctx.beginPath(); ctx.arc(tipLX - 4, tipLY + 2, 11, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(tipRX + 4, tipRY + 2, 11, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = '#f5efe6';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(tipLX + 5, tipLY - 7); ctx.lineTo(tipLX + 9, tipLY + 9); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(tipRX - 5, tipRY - 7); ctx.lineTo(tipRX - 9, tipRY + 9); ctx.stroke();

  // 5. Cream Bowstring
  ctx.save();
  ctx.strokeStyle = power >= 0.8 ? '#68c964' : (power >= 0.5 ? '#ffd15c' : '#f5efe6');
  ctx.lineWidth = 4.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(tipLX + 7, tipLY + 2);
  ctx.lineTo(nockX, nockY);
  ctx.lineTo(tipRX - 7, tipRY + 2);
  ctx.stroke();
  ctx.restore();

  // 6. Clay Arrow (화살 렌더링)
  if (arrowsLeft > 0) {
    const arrowLen = 265;
    const tipX = nockX + Math.cos(aimAngle) * arrowLen;
    const tipYArrow = nockY + Math.sin(aimAngle) * arrowLen;

    ctx.save();

    // Red Rounded Fletching Feathers
    ctx.save();
    ctx.translate(nockX, nockY);
    ctx.rotate(aimAngle);

    ctx.fillStyle = '#e34c43';
    ctx.beginPath();
    ctx.roundRect(-28, -17, 34, 14, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(-28, 3, 34, 14, 7);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.roundRect(-24, -14, 24, 4, 2);
    ctx.fill();
    ctx.restore();

    // Warm Wooden Shaft
    ctx.strokeStyle = '#d7995b';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(nockX, nockY);
    ctx.lineTo(tipX, tipYArrow);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 240, 220, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(nockX, nockY - 1.5);
    ctx.lineTo(tipX, tipYArrow - 1.5);
    ctx.stroke();

    // Rounded Grey Clay Arrowhead
    ctx.save();
    ctx.translate(tipX, tipYArrow);
    ctx.rotate(aimAngle);

    ctx.fillStyle = '#b0b5bc';
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.quadraticCurveTo(22, -4, -6, -15);
    ctx.quadraticCurveTo(-10, 0, -6, 15);
    ctx.quadraticCurveTo(22, 4, 26, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(-4, -10);
    ctx.lineTo(-4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // 7. Power Tension Gauge
  if (power > 0.05) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, gripY + 56, 38, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 1.5 * power);
    ctx.strokeStyle = power >= 0.80 ? '#68c964' : (power >= 0.60 ? '#ffd15c' : '#ff8a3d');
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();

    const badgeText = `${Math.round(power * 100)}% ${power >= 0.80 ? '🔥 원거리 명중!' : '⚡ 더 당기세요'}`;
    ctx.font = 'bold 13px "Maplestory", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4a3219';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeText(badgeText, cx, gripY + 80);
    ctx.fillText(badgeText, cx, gripY + 80);
    ctx.restore();
  }

  ctx.restore();
}
