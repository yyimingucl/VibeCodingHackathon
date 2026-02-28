import json
import os
import re

from openai import AsyncOpenAI

_SYSTEM_PROMPT = (
    "You are a routing assistant for London transit. Extract the origin and destination "
    "from the user's text. Map their emotional intent or constraints to these EXACT 5 boolean "
    "preferences: budget_friendly, lazy_walk, easy_transfer, accessibility, pet_friendly.\n"
    "Rule: If they mention luggage, wheelchairs, or injuries, set accessibility to true. "
    "If they mention being tired or hating walking, set lazy_walk to true. "
    "If they mention money or being broke, set budget_friendly to true.\n"
    'Output ONLY a raw JSON object with this exact schema:\n'
    '{"origin": "string", "destination": "string", "preferences": {"budget_friendly": false, '
    '"lazy_walk": false, "easy_transfer": false, "accessibility": false, "pet_friendly": false}}'
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
