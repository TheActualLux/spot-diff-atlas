// Screenshot states use the same start, tick and pointer-hit functions as a live session.
export function stageShot(name, game) {
  if (name === 'start') {
    game.start();
    game.advance(2.4);
    return;
  }
  if (name === 'play') {
    game.start();
    game.advance(9);
    for (let i = 0; i < 6; i++) {
      game.advance(1.7);
      game.clickDifference(i);
    }
    game.continueAfterClear();
    game.advance(18.4);
    game.clickDifference(0);
    game.advance(1.3);
    game.clickDifference(2);
    game.advance(2.1);
    game.clickDifference(4);
    return;
  }
  if (name === 'end') {
    game.start();
    for (let level = 0; level < 5; level++) {
      if (level > 0) game.continueAfterClear();
      for (let i = 0; i < game.differenceCount(); i++) {
        game.advance(1.35 + (i % 3) * .2);
        game.clickDifference(i);
      }
    }
  }
}
