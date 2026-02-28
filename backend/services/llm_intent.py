import json
import os
import re

from openai import AsyncOpenAI

_SYSTEM_PROMPT = (
    "You are a routing assistant for London transit. Extract the origin and destination "
    "from the user's text. Map their emotional intent or constraints to these EXACT 9 boolean "
    "preferences: budget_friendly, lazy_walk, easy_transfer, accessibility, pet_friendly, "
    "speed_first, cycle2work, scenic_bus, scenic_boat.\n"
    "Rules:\n"
    "- budget_friendly: mention money, cheap, broke, save money, low cost\n"
    "- lazy_walk: mention tired, hate walking, minimal walking, don't want to walk\n"
    "- easy_transfer: mention fewer changes, simple route, no transfers, direct\n"
    "- accessibility: mention luggage, wheelchair, injury, step-free, disabled\n"
    "- pet_friendly: mention dog, cat, pet, animal\n"
    "- speed_first: mention fast, quick, hurry, rush, fastest, in a hurry, urgent\n"
    "- cycle2work: mention cycling, bike, bicycle, cycle to work, ride\n"
    "- scenic_bus: mention scenic, sightseeing, above ground, iconic bus, see the city, bus tour\n"
    "- scenic_boat: mention boat, river, Thames, clipper, ferry, water, sail\n"
    'Output ONLY a raw JSON object with this exact schema:\n'
    '{"origin": "string", "destination": "string", "preferences": {"budget_friendly": false, '
    '"lazy_walk": false, "easy_transfer": false, "accessibility": false, "pet_friendly": false, '
    '"speed_first": false, "cycle2work": false, "scenic_bus": false, "scenic_boat": false}}'
)

_FALLBACK = {
    "origin": "",
    "destination": "",
    "preferences": {
        "budget_friendly": False,
        "lazy_walk": False,
        "easy_transfer": False,
        "accessibility": False,
        "pet_friendly": False,
        "speed_first": False,
        "cycle2work": False,
        "scenic_bus": False,
        "scenic_boat": False,
    },
}


async def extract_intent(user_text: str) -> dict:
    api_key = os.environ.get("NVIDIA_API_KEY")
    if not api_key:
        print("[voice-intent] NVIDIA_API_KEY not set — returning fallback")
        return _FALLBACK

    client = AsyncOpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=api_key,
    )

    try:
        response = await client.chat.completions.create(
            model="meta/llama-3.1-70b-instruct",
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_text},
            ],
            temperature=0.2,
            max_tokens=256,
        )
        raw = response.choices[0].message.content or ""
        # Strip markdown code fences if present
        raw = re.sub(r"^```[a-z]*\n?|```$", "", raw.strip(), flags=re.MULTILINE).strip()
        return json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"[voice-intent] JSON parse error: {e} — returning fallback")
        return _FALLBACK
    except Exception as e:
        print(f"[voice-intent] LLM error: {e} — returning fallback")
        return _FALLBACK
