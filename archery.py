"""
🏹 AR Archery Game  (MediaPipe Tasks API - v1.0 compatible)
───────────────────────────────────────────────────────────
조작 방법:
  - 오른손을 카메라에 보여주세요
  - 검지(index) 끝 = 조준점
  - 엄지 + 검지 핀치(붙이기) = 활 당기기  (파워바↑, 흔들림↑)
  - 핀치 풀면 = 발사! 🏹
  - R = 재시작  /  Q or ESC = 종료
───────────────────────────────────────────────────────────
"""

import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
import numpy as np
import math, time, random, os, urllib.request

# ── Download hand landmark model if needed ────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hand_landmarker.task')
if not os.path.exists(MODEL_PATH):
    print("Downloading MediaPipe hand model (~5 MB)…")
    url = ('https://storage.googleapis.com/mediapipe-models/'
           'hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task')
    urllib.request.urlretrieve(url, MODEL_PATH)
    print("Download complete!")

# ── Create HandLandmarker ─────────────────────────────────────────────────────
base_opts = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
hand_opts = mp_vision.HandLandmarkerOptions(
    base_options=base_opts,
    num_hands=1,
    min_hand_detection_confidence=0.5,
    min_hand_presence_confidence=0.5,
    min_tracking_confidence=0.5,
    running_mode=mp_vision.RunningMode.VIDEO,
)
landmarker = mp_vision.HandLandmarker.create_from_options(hand_opts)

# Hand skeleton connections
HAND_CONN = [
    (0,1),(1,2),(2,3),(3,4),
    (0,5),(5,6),(6,7),(7,8),
    (5,9),(9,10),(10,11),(11,12),
    (9,13),(13,14),(14,15),(15,16),
    (13,17),(17,18),(18,19),(19,20),
    (0,17),
]

def draw_hand(frame, landmarks, W, H):
    pts = [(int(lm.x * W), int(lm.y * H)) for lm in landmarks]
    for a, b in HAND_CONN:
        cv2.line(frame, pts[a], pts[b], (0, 200, 110), 1)
    for p in pts:
        cv2.circle(frame, p, 3, (0, 255, 140), -1)

# ── Camera ────────────────────────────────────────────────────────────────────
W, H = 1280, 720
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH,  W)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, H)

# ── Target ────────────────────────────────────────────────────────────────────
class Target:
    RING_COLORS = [
        (0, 0, 210),     # outer red
        (255, 255, 255), # white
        (0, 0, 210),     # red
        (30,  30,  30),  # black
        (0, 215, 255),   # gold center
    ]

    def __init__(self):
        self.reset()

    def reset(self):
        mg = 160
        self.x  = float(random.randint(mg, W - mg))
        self.y  = float(random.randint(100 + mg, H - mg))
        self.r  = random.randint(45, 85)
        self.vx = random.choice([-1, 1]) * random.uniform(1.2, 3.0)
        self.vy = random.choice([-1, 1]) * random.uniform(0.8, 2.2)

    def update(self):
        self.x += self.vx
        self.y += self.vy
        if self.x - self.r < 0 or self.x + self.r > W: self.vx *= -1
        if self.y - self.r < 70 or self.y + self.r > H: self.vy *= -1

    def draw(self, frame):
        cx, cy, r = int(self.x), int(self.y), self.r
        n = len(self.RING_COLORS)
        for i, col in enumerate(self.RING_COLORS):
            ring_r = max(1, r - i * (r // n))
            cv2.circle(frame, (cx, cy), ring_r, col, -1)
        cv2.circle(frame, (cx, cy), r, (0, 0, 0), 1)

    def get_score(self, hx, hy):
        d = math.hypot(hx - self.x, hy - self.y)
        if d > self.r: return 0
        ratio = d / self.r
        if   ratio < 0.12: return 10
        elif ratio < 0.30: return  8
        elif ratio < 0.52: return  6
        elif ratio < 0.72: return  4
        else:              return  2

# ── Hit effect ────────────────────────────────────────────────────────────────
class HitEffect:
    def __init__(self, x, y, pts):
        self.x, self.y, self.pts = x, y, pts
        self.life = 45

    def update(self): self.life -= 1; self.y -= 1.3

    def draw(self, frame):
        a = self.life / 45.0
        if self.pts > 0:
            txt = f"+{self.pts}"
            col = (0, int(215*a), int(255*a)) if self.pts == 10 else (0, int(255*a), 0)
        else:
            txt = "MISS"
            col = (0, 0, int(230*a))
        cv2.putText(frame, txt, (int(self.x)+10, int(self.y)),
                    cv2.FONT_HERSHEY_DUPLEX, 1.2, col, 2)
        cv2.drawMarker(frame, (int(self.x), int(self.y)),
                       col, cv2.MARKER_CROSS, 20, 2)

# ── Crosshair ─────────────────────────────────────────────────────────────────
def draw_crosshair(frame, x, y, wobble=0, drawing=False):
    if wobble:
        x += random.randint(-wobble, wobble)
        y += random.randint(-wobble, wobble)
    x = max(10, min(W-10, x))
    y = max(70, min(H-10, y))
    col  = (0, 180, 255) if drawing else (0, 255, 80)
    size = 26
    cv2.line(frame, (x-size, y), (x-8, y), col, 2)
    cv2.line(frame, (x+8,   y), (x+size, y), col, 2)
    cv2.line(frame, (x, y-size), (x, y-8), col, 2)
    cv2.line(frame, (x, y+8),  (x, y+size), col, 2)
    cv2.circle(frame, (x, y), 5, col, 1)
    return x, y

# ── Power bar ─────────────────────────────────────────────────────────────────
def draw_power_bar(frame, power):
    bx, by, bw, bh = 14, H-20, 200, 22
    cv2.rectangle(frame, (bx, by-bh), (bx+bw, by), (40, 40, 40), -1)
    cv2.rectangle(frame, (bx, by-bh), (bx+bw, by), (120, 120, 120), 1)
    fw  = int(power * bw / 100)
    r_c = int(power * 2.55)
    g_c = int((100-power) * 2.55)
    cv2.rectangle(frame, (bx, by-bh), (bx+fw, by), (0, g_c, r_c), -1)
    cv2.putText(frame, f"DRAW  {int(power)}%", (bx, by-bh-6),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255,255,255), 1)

# ── Game state ────────────────────────────────────────────────────────────────
def reset_game():
    return dict(score=0, arrows=10, targets=[Target() for _ in range(3)],
                effects=[], drawing=False, power=0.0, last_shot=0.0, over=False)

state = reset_game()
COOLDOWN = 0.4
frame_ts  = 0   # ms timestamp for VIDEO mode

print("AR Archery launched! Show your hand to the camera.")
print("Pinch (thumb+index) to DRAW -- release to SHOOT. Q=quit R=restart")

while True:
    ret, frame = cap.read()
    if not ret: break

    frame    = cv2.flip(frame, 1)
    rgb      = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    frame_ts += 33   # ~30 fps

    # ── HUD bar ──
    cv2.rectangle(frame, (0, 0), (W, 58), (20, 20, 20), -1)

    # ── Hand detection ──
    aim_x, aim_y = W // 2, H // 2
    hand_found   = False

    if not state["over"]:
        mp_img  = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result  = landmarker.detect_for_video(mp_img, frame_ts)

        if result.hand_landmarks:
            hand_found = True
            lm = result.hand_landmarks[0]

            aim_x = int(lm[8].x * W)   # index fingertip
            aim_y = int(lm[8].y * H)
            tx    = int(lm[4].x * W)   # thumb tip
            ty    = int(lm[4].y * H)
            pinch = math.hypot(aim_x - tx, aim_y - ty)

            draw_hand(frame, lm, W, H)

            if pinch < 55:
                state["drawing"] = True
                state["power"]   = min(100.0, state["power"] + 3.0)
            else:
                if state["drawing"] and state["power"] > 15:
                    now = time.time()
                    if now - state["last_shot"] > COOLDOWN and state["arrows"] > 0:
                        state["arrows"]   -= 1
                        state["last_shot"] = now
                        sx, sy = aim_x, aim_y
                        scored = False
                        for t in state["targets"]:
                            pts = t.get_score(sx, sy)
                            if pts:
                                state["score"] += pts
                                state["effects"].append(HitEffect(sx, sy, pts))
                                t.reset(); scored = True; break
                        if not scored:
                            state["effects"].append(HitEffect(sx, sy, 0))
                state["drawing"] = False
                state["power"]   = max(0.0, state["power"] - 4.5)
        else:
            state["power"] = max(0.0, state["power"] - 3.0)
            if state["drawing"]: state["drawing"] = False

    # ── Targets ──
    for t in state["targets"]:
        t.update(); t.draw(frame)

    # ── Effects ──
    alive = []
    for e in state["effects"]:
        e.update(); e.draw(frame)
        if e.life > 0: alive.append(e)
    state["effects"] = alive

    # ── Crosshair ──
    wobble = int(state["power"] / 8)
    draw_crosshair(frame, aim_x, aim_y, wobble, state["drawing"])

    # ── Power bar ──
    if state["drawing"] or state["power"] > 1:
        draw_power_bar(frame, state["power"])

    # ── No-hand hint ──
    if not hand_found and not state["over"]:
        cv2.putText(frame, "Show your hand to the camera",
                    (W//2 - 210, H//2 + 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 220, 255), 2)

    # ── HUD text ──
    cv2.putText(frame, f"SCORE  {state['score']:>4}",
                (20, 40), cv2.FONT_HERSHEY_DUPLEX, 1.0, (0, 215, 255), 2)
    arrows_disp = "[ " + "| " * state["arrows"] + "]"
    cv2.putText(frame, arrows_disp,
                (W//2 - 130, 38), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (180, 255, 180), 2)
    cv2.putText(frame, "Pinch=Draw  Release=Shoot  R=Restart  Q=Quit",
                (W - 545, 38), cv2.FONT_HERSHEY_SIMPLEX, 0.53, (150, 150, 150), 1)

    # ── Game over ──
    if state["arrows"] == 0 and not state["effects"]:
        state["over"] = True

    if state["over"]:
        overlay = frame.copy()
        cv2.rectangle(overlay, (W//2-320, H//2-90), (W//2+320, H//2+110), (10,10,10), -1)
        cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)
        cv2.putText(frame, "GAME  OVER",
                    (W//2 - 170, H//2 - 20), cv2.FONT_HERSHEY_DUPLEX, 1.8, (0, 0, 220), 3)
        cv2.putText(frame, f"Final Score :  {state['score']}",
                    (W//2 - 165, H//2 + 38), cv2.FONT_HERSHEY_DUPLEX, 1.1, (0, 215, 255), 2)
        cv2.putText(frame, "Press  R  to restart",
                    (W//2 - 130, H//2 + 85), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (200,200,200), 1)

    cv2.imshow("AR Archery 🏹", frame)

    key = cv2.waitKey(1) & 0xFF
    if key in (ord('q'), 27): break
    elif key == ord('r'): state = reset_game()

cap.release()
landmarker.close()
cv2.destroyAllWindows()
print("Game closed!")
