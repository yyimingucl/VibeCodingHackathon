import asyncio
import os
import riva.client

_SERVER  = "grpc.nvcf.nvidia.com:443"
_FUNC_ID = "71203149-d3b7-4460-8231-1be2543a1fca"


async def _to_raw_pcm(audio_bytes: bytes) -> bytes:
    """Convert any browser audio (webm/mp4/aac) to raw 16 kHz mono PCM via ffmpeg."""
    try:
        proc = await asyncio.create_subprocess_exec(
            "ffmpeg", "-i", "pipe:0",
            "-f", "s16le", "-ar", "16000", "-ac", "1",
            "pipe:1",
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL,
        )
        stdout, _ = await proc.communicate(input=audio_bytes)
        return stdout
    except Exception as e:
        print(f"[asr] ffmpeg conversion failed: {e}")
        return b""


def _chunk(audio_bytes: bytes, size: int = 8192):
    for i in range(0, len(audio_bytes), size):
        yield audio_bytes[i:i + size]


async def transcribe_audio(audio_bytes: bytes) -> str:
    api_key = os.environ.get("NVIDIA_API_KEY")
    if not api_key:
        print("[asr] NVIDIA_API_KEY not set")
        return ""
    try:
        pcm_bytes = await _to_raw_pcm(audio_bytes)
        if not pcm_bytes:
            print("[asr] PCM conversion produced empty output")
            return ""

        auth = riva.client.Auth(
            use_ssl=True,
            uri=_SERVER,
            metadata_args=[
                ["function-id", _FUNC_ID],
                ["authorization", f"Bearer {api_key}"],
            ],
        )
        svc = riva.client.ASRService(auth)
        cfg = riva.client.StreamingRecognitionConfig(
            config=riva.client.RecognitionConfig(
                language_code="en-GB",
                max_alternatives=1,
                enable_automatic_punctuation=True,
                encoding=riva.client.AudioEncoding.LINEAR_PCM,
                sample_rate_hertz=16000,
            ),
            interim_results=False,
        )
        responses = svc.streaming_response_generator(
            audio_chunks=_chunk(pcm_bytes),
            streaming_config=cfg,
        )
        parts = []
        for r in responses:
            for alt in r.results:
                if alt.is_final:
                    parts.append(alt.alternatives[0].transcript)
        transcript = " ".join(parts).strip()
        print(f"[asr] transcript: {transcript!r}")
        return transcript
    except Exception as e:
        print(f"[asr] Parakeet error: {e}")
        return ""
