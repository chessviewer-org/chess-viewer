let hasPlayed = false;

export function shouldAnimateEntrance() {
  return !hasPlayed;
}

export function markEntrancePlayed() {
  hasPlayed = true;
}
