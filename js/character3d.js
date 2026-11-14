/**
 * UI Dialogue & Historical Narrative Manager
 * Provides contextual dialogue quotes and interactive character animations.
 */

// Fallback compatibility stub for 3D character group
class ThreeHyeonmurang {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.visible = false;
  }
  update(dt, activeTargetObj) {
    // 3D 씬에 표시하지 않음
  }
  triggerCheerJump() {
    // No-Op
  }
}

// Historical dialogue lines per stage
const CHAR_QUOTES = {
  login: [
    "안녕! 내 배에 적힌 임금 왕(王) 자 봤어? 후백제 왕도 완산주의 수호거북 현무랑이야!",
    "견훤 대왕님은 서기 900년에 이곳 완산주(전주)를 도읍으로 삼고 후백제를 세우셨어!",
    "전주 백성들이 성문 밖까지 나와 견훤 대왕님을 열렬히 환영했다는 기록이 삼국사기에 남아있어!",
    "견훤 대왕님은 어릴 적 호랑이 젖을 먹고 자라 기골이 장대하고 힘이 장사였다는 설화가 전해져!",
    "이름을 적고 출발하면 견훤 대왕님의 신기한 역사 이야기를 더 많이 들려줄게!"
  ],
  loading: [
    "그거 알아? 견훤 대왕님의 본래 성은 이(李)씨였는데 스스로 견(甄)씨로 바꾸셨대!",
    "견훤 대왕님은 신라 서남해안을 지키던 장군으로 활약하다가 새로운 나라의 꿈을 품으셨어!",
    "후백제는 중국의 오월·후당, 거란, 일본과도 사신을 주고받던 글로벌 해상 강국이었어!",
    "전주 동고산성에서는 '전주성(全州城)'이라 적힌 후백제 시대 막새기와가 실제로 발굴됐대!",
    "당시 후백제는 삼국 중 인구가 가장 많고 군사력도 가장 강성했던 최강국이었어!"
  ],
  cinema: [
    "팝콘 냠냠~ 견훤 대왕님은 백제 의자왕의 원한을 씻겠다는 명분으로 후백제를 세우셨대!",
    "927년 공산 전투에서 견훤 대왕님이 왕건의 고려군을 크게 이긴 건 정말 유명한 역사야!",
    "영상을 다 봤으면 오른쪽 위 건너뛰기나 완료를 눌러서 동고산성 활터로 가보자!"
  ],
  briefing: [
    "견훤 대왕님은 직접 말을 타고 화살을 쏘며 선두에서 군사를 이끈 명궁이셨어!",
    "과녁은 휴대폰을 살짝 위로 들거나 좌우로 둘러보면 정면에 선명하게 나타나!",
    "게임이 시작되면 내가 상단 나침반에서 과녁이 어느 쪽에 있는지 콕 집어 알려줄게!",
    "과녁에 집중해서 시위를 부드럽게 당겼다 놓아봐!"
  ],
  result: [
    "우와아!! 견훤 대왕님이 보셨으면 당장 후백제 친위대 신궁으로 임명하셨을 거야!!",
    "네가 획득한 낙수정 뱃지는 후백제 군사들과 백성들의 갈증을 달래던 수호 명소를 상징해!"
  ],
  inventory: [
    "낙수정(약수터), 동고산성(왕궁 산성), 중바위(전망 수호 바위), 동고사(견훤 창건 사찰) 4대 명소야!",
    "각 뱃지 카드를 터치하면 그 유적지에 담긴 견훤 대왕님의 숨은 역사를 알려줄게!"
  ]
};

function setupInteractiveCharacters() {
  document.querySelectorAll('[data-char-stage]').forEach(stage => {
    const stageType = stage.getAttribute('data-char-stage');
    const img = stage.querySelector('.char-img-3d');
    const bubble = stage.querySelector('.char-speech-bubble');
    let quoteIdx = 0;

    stage.addEventListener('click', () => {
      if (typeof sound !== 'undefined' && sound.ctx) {
        sound.playRelease(0.5);
      }
      if (img) {
        img.classList.remove('jelly-pop');
        void img.offsetWidth;
        img.classList.add('jelly-pop');
      }
      if (bubble && CHAR_QUOTES[stageType]) {
        quoteIdx = (quoteIdx + 1) % CHAR_QUOTES[stageType].length;
        bubble.innerText = CHAR_QUOTES[stageType][quoteIdx];
        bubble.style.transform = 'scale(1.06)';
        setTimeout(() => { bubble.style.transform = 'scale(1)'; }, 180);
      }
    });
  });
}
