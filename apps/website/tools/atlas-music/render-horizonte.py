"""Render WRN's original instrumental 'Horizonte'; no samples or services.

Deterministic additive string/plucked-key synthesis. This is synthesized music,
not a recording of acoustic instruments. Export encoding is performed by ffmpeg.
"""
import argparse
from pathlib import Path
import wave
import numpy as np

RATE = 32000
BPM = 72
BEAT = 60 / BPM
BARS = 32
DURATION = BARS * 4 * BEAT


def render():
    mix = np.zeros((round(DURATION * RATE), 2), dtype=np.float64)

    def note(midi, start, duration, level, instrument, pan=0):
        count = min(round(duration * RATE), len(mix) - round(start * RATE))
        if count <= 0:
            return
        t = np.arange(count) / RATE
        freq = 440 * 2 ** ((midi - 69) / 12)
        voice = np.zeros(count)
        if instrument == 'keys':
            for harmonic in range(1, 8):
                decay = np.exp(-t * (.60 + harmonic * .31))
                # Small inharmonicity and paired strings give a soft struck tone.
                f = freq * harmonic * (1 + .00013 * harmonic ** 2)
                voice += decay / harmonic ** 1.9 * (
                    np.sin(2 * np.pi * f * t) + .22 * np.sin(2 * np.pi * f * 1.0009 * t))
            voice *= np.minimum(t / .018, 1)
        elif instrument == 'plucked':
            for harmonic in range(1, 7):
                voice += np.sin(2 * np.pi * freq * harmonic * t) * np.exp(-t * (.9 + harmonic * .48)) / harmonic ** 2
            voice *= np.minimum(t / .025, 1)
        else:
            vibrato = .0018 * np.sin(2 * np.pi * 4.1 * t) * np.minimum(t, 1)
            phase = 2 * np.pi * freq * t + vibrato * freq / 4.1
            voice = np.sin(phase) + .18 * np.sin(2 * phase) + .06 * np.sin(3 * phase)
            voice *= np.minimum(t / .75, 1) * np.minimum((duration - t) / .9, 1)
        voice *= np.minimum((count / RATE - t) / .16, 1) * level
        p = (pan + 1) * np.pi / 4
        offset = round(start * RATE)
        mix[offset:offset + count, 0] += voice * np.cos(p)
        mix[offset:offset + count, 1] += voice * np.sin(p)

    chords = [[45, 52, 60, 64, 71], [41, 48, 57, 60, 64],
              [48, 55, 59, 62, 64], [43, 50, 57, 62, 67]]
    motifs = [[(0, 76), (1.5, 74), (2.5, 71)], [(0.5, 72), (2, 69)],
              [(0, 67), (1, 71), (2.5, 74)], [(0.5, 74), (2, 71), (3, 69)],
              [(0, 76), (2, 79), (3, 76)], [(0.5, 76), (2, 72)],
              [(0, 74), (1.5, 71), (3, 67)], [(0, 69), (2.5, 71)]]
    for bar in range(BARS):
        start = bar * 4 * BEAT
        chord = chords[(bar // 2) % 4]
        arc = .72 + .20 * np.sin(np.pi * bar / (BARS - 1))
        note(chord[0], start, BEAT * 4.8, .085 * arc, 'strings', -.12)
        for i, key in enumerate(chord[1:]):
            note(key, start + i * .085, BEAT * 4.2, .065 * arc, 'keys', -.24)
        # The sparse lead evolves, with space between phrases for reading.
        for step, key in motifs[bar % 8]:
            note(key, start + step * BEAT, BEAT * 2.7, .103 * arc, 'keys', .10)
        if 4 <= bar < 30:
            for step, index in [(0.75, 1), (1.75, 3), (2.75, 2), (3.5, 4)]:
                note(chord[index] + 12, start + step * BEAT, 2, .044 * arc, 'plucked', .36)
        if 8 <= bar < 28:
            note(chord[2], start + BEAT * .25, BEAT * 5, .030 * arc, 'strings', -.35)
    # Quiet stereo room echoes; no imported impulse response.
    dry = mix.copy()
    for seconds, gain in [(.113, .12), (.197, .09), (.307, .07), (.431, .045), (.673, .03)]:
        shift = round(seconds * RATE)
        mix[shift:] += dry[:-shift, ::-1] * gain
    fade = round(.4 * RATE)
    mix[:fade] *= np.linspace(0, 1, fade)[:, None]
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
    mix *= .68 / max(.00001, np.max(np.abs(mix)))
    return (mix * 32767).astype('<i2')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('output')
    args = parser.parse_args()
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    if output.exists():
        raise SystemExit('Refusing to overwrite an existing render')
    pcm = render()
    with wave.open(str(output), 'wb') as target:
        target.setnchannels(2)
        target.setsampwidth(2)
        target.setframerate(RATE)
        target.writeframes(pcm.tobytes())
    print(f'{output}: {len(pcm) / RATE:.3f} seconds, stereo, {BPM} BPM')
