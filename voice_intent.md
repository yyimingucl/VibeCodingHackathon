# Role: AI Integration Engineer
# Context: Hackathon MVP. We are adding a "Voice-to-Intent" feature. The user speaks naturally, and an LLM extracts their origin, destination, and Maps their sentiment to our specific boolean toggles.

## Task
Create a new FastAPI endpoint `/api/routes/voice-intent` that takes text and uses NVIDIA NIM (LLM) to extract the routing intent.

### 1. Setup NVIDIA NIM LLM Client (`backend/services/llm_intent.py`)
- Ensure `openai` package is in `requirements.txt`.
- Setup the async client:
  ```python
  import os
  import json
  from openai import AsyncOpenAI

  client = AsyncOpenAI(
      base_url="[https://integrate.api.nvidia.com/v1](https://integrate.api.nvidia.com/v1)",
      api_key=os.environ.get("NVIDIA_API_KEY")
  )

2. The Extraction Logic

Create an async function extract_intent(user_text: str) -> dict.

Use the model meta/llama3-70b-instruct (or whichever NVIDIA NIM model you prefer).

System Prompt:
"You are a routing assistant for London transit. Extract the origin and destination from the user's text. Map their emotional intent or constraints to these EXACT 5 boolean preferences: budget_friendly, lazy_walk, easy_transfer, accessibility, pet_friendly.
Rule: If they mention luggage, wheelchairs, or injuries, set accessibility to true. If they mention being tired or hating walking, set lazy_walk to true. If they mention money or being broke, set budget_friendly to true.
Output ONLY a raw JSON object with this exact schema:
{\"origin\": \"string\", \"destination\": \"string\", \"preferences\": {\"budget_friendly\": false, \"lazy_walk\": false, \"easy_transfer\": false, \"accessibility\": false, \"pet_friendly\": false}}"

Parse the LLM response into a Python dictionary and return it. Handle JSON decode errors gracefully.

3. Endpoint (backend/routers/routes.py)

Add POST /api/routes/voice-intent expecting a JSON payload {"text": "string"}.

Call extract_intent and return the result.