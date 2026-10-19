"""
Records the IELTS Listening race items (src/content/race/ielts-listening.json)
with Piper TTS and writes public/audio/listening/<id>.mp3 plus a duration
manifest (src/content/race/listening-audio.json) the race timer uses.

Voices (both trained only on public-domain recordings):
  cori      en_GB-cori-high      LibriVox
  ljspeech  en_US-ljspeech-high  LJ Speech

  pip install piper-tts lameenc
  python scripts/listening-audio.py --voices <dir with the .onnx files> [--only l-e01,l-m02]

MP3 plays in every browser (open-source Chromium builds have no AAC). Existing
files are kept unless the transcript changed (a hash of the lines is stored in
the manifest).
"""

import argparse
import hashlib
import json
import tempfile
import wave
from pathlib import Path

import lameenc
from piper import PiperVoice
from piper.config import SynthesisConfig

ROOT = Path(__file__).resolve().parent.parent
ITEMS = ROOT / "src/content/race/ielts-listening.json"
MANIFEST = ROOT / "src/content/race/listening-audio.json"
OUT = ROOT / "public/audio/listening"
VOICE_FILES = {"cori": "en_GB-cori-high.onnx", "ljspeech": "en_US-ljspeech-high.onnx"}
PAUSE_S = 0.55
# A steady, slightly slow exam pace: little generator noise keeps spelled letters and numbers clear.
SYNTHESIS = SynthesisConfig(length_scale=1.08, noise_scale=0.35, noise_w_scale=0.4)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--voices", required=True)
    parser.add_argument("--only", default="")
    args = parser.parse_args()

    items = json.loads(ITEMS.read_text())["items"]
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    only = {x for x in args.only.split(",") if x}
    voices = {name: PiperVoice.load(str(Path(args.voices) / file)) for name, file in VOICE_FILES.items()}
    OUT.mkdir(parents=True, exist_ok=True)

    for item in items:
        if only and item["id"] not in only:
            continue
        digest = hashlib.sha1((json.dumps(item["lines"], sort_keys=True) + repr(SYNTHESIS)).encode()).hexdigest()[:12]
        target = OUT / f"{item['id']}.mp3"
        if not only and target.exists() and manifest.get(item["id"], {}).get("hash") == digest:
            continue

        frames = b""
        params = None
        for i, line in enumerate(item["lines"]):
            with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
                with wave.open(tmp.name, "wb") as w:
                    voices[line["voice"]].synthesize_wav(line["text"], w, syn_config=SYNTHESIS)
                with wave.open(tmp.name, "rb") as r:
                    params = r.getparams()
                    if i > 0:
                        frames += b"\0" * int(params.framerate * PAUSE_S) * params.sampwidth * params.nchannels
                    frames += r.readframes(r.getnframes())

        duration_ms = round(len(frames) / (params.framerate * params.sampwidth * params.nchannels) * 1000)
        encoder = lameenc.Encoder()
        encoder.set_bit_rate(64)
        encoder.set_in_sample_rate(params.framerate)
        encoder.set_channels(params.nchannels)
        encoder.set_quality(2)
        target.write_bytes(encoder.encode(frames) + encoder.flush())

        manifest[item["id"]] = {"ms": duration_ms, "hash": digest}
        print(f"{item['id']}: {duration_ms / 1000:.1f} s")

    MANIFEST.write_text(json.dumps(dict(sorted(manifest.items())), indent=2) + "\n")


if __name__ == "__main__":
    main()
