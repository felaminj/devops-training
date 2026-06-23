const WAIL_LOW_HZ = 580;
const WAIL_HIGH_HZ = 1150;
const WAIL_UP_SEC = 1.4;
const WAIL_DOWN_SEC = 1.4;
const CYCLE_SEC = WAIL_UP_SEC + WAIL_DOWN_SEC;

export type EmergencySirenPlayback = {
  sources: AudioScheduledSourceNode[];
};

export function scheduleEmergencySirenSound(
  context: AudioContext,
  start: number,
  durationSec: number
): EmergencySirenPlayback {
  const cycles = Math.ceil(durationSec / CYCLE_SEC);
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'triangle';
  for (let index = 0; index < cycles; index += 1) {
    const cycleStart = start + index * CYCLE_SEC;
    const upEnd = Math.min(cycleStart + WAIL_UP_SEC, start + durationSec);
    const cycleEnd = Math.min(cycleStart + CYCLE_SEC, start + durationSec);
    if (cycleStart >= start + durationSec) break;
    oscillator.frequency.setValueAtTime(WAIL_LOW_HZ, cycleStart);
    oscillator.frequency.linearRampToValueAtTime(WAIL_HIGH_HZ, upEnd);
    if (upEnd < cycleEnd) {
      oscillator.frequency.linearRampToValueAtTime(WAIL_LOW_HZ, cycleEnd);
    }
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(0.2, start + 0.06);
  gain.gain.setValueAtTime(0.2, start + durationSec - 0.12);
  gain.gain.linearRampToValueAtTime(0.0001, start + durationSec);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + durationSec);
  return { sources: [oscillator] };
}
