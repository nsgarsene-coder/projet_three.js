import { Howl, Howler } from 'howler';

// ═══════════════════════════════════════
// SONS DU JEU
// ═══════════════════════════════════════

const sons = {
  ambiance: new Howl({
    src: ['/sounds/ambiance.wav'],
    loop: true,
    volume: 0.35,
  }),

  correct: new Howl({
    src: ['/sounds/correct.wav'],
    volume: 0.7,
  }),

  wrong: new Howl({
    src: ['/sounds/wrong.wav'],
    volume: 0.6,
  }),

  gameover: new Howl({
    src: ['/sounds/gameover.wav'],
    volume: 0.8,
  }),
};

// ═══════════════════════════════════════
// FONCTIONS EXPORTÉES
// ═══════════════════════════════════════

export function lancerAmbiance() {
  if (!sons.ambiance.playing()) {
    sons.ambiance.play();
  }
}

export function stopAmbiance() {
  sons.ambiance.stop();
}

export function jouerCorrect() {
  sons.correct.play();
}

export function jouerWrong() {
  sons.wrong.play();
}

export function jouerGameover() {
  stopAmbiance();
  sons.gameover.play();
}

export function jouerVictoire() {
  stopAmbiance();
}
