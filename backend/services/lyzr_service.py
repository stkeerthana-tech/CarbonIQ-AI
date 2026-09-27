"""
services/lyzr_service.py
------------------------
Thin wrapper around the Lyzr Agent Inference REST API.

Architecture note (enforced):
  - This service ONLY provides reasoning / review / compliance text.
  - It NEVER recalculates emissions or modifies any database records.
  - All numerical data passed to the agent is already verified by
    services/emission_calculator.py — the AI receives read-only context.

Lyzr API:
  POST https://agent-prod.studio.lyzr.ai/v3/inference/chat/
  Headers: x-api-key: <LYZR_API_KEY>
  Body:    { user_id, agent_id, session_id, message }
  Returns: { response: str }
"""

import os
import logging
import uuid

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration (loaded from environment/app config — never hard-coded)
# ---------------------------------------------------------------------------

def _get_config_val(key: str, default: str = "") -> str:
    """Retrieve config value from Flask current_app or environment fallback."""
    try:
        from flask import current_app
        if current_app and current_app.config.get(key):
            return str(current_app.config.get(key))
    except Exception:
        pass
    return os.environ.get(key, default)


def get_api_key() -> str:
    return _get_config_val("LYZR_API_KEY", "")


def get_agent_id() -> str:
    return _get_config_val("LYZR_AGENT_ID", "")


def get_endpoint() -> str:
    return _get_config_val("LYZR_ENDPOINT", "https://agent-prod.studio.lyzr.ai/v3/inference/chat/")


def get_timeout() -> int:
    val = _get_config_val("LYZR_TIMEOUT_SECONDS", "20")
    try:
        return int(val)
    except (ValueError, TypeError):
        return 20


# System user identifier sent to Lyzr (non-sensitive, used for session tracking)
LYZR_SYSTEM_USER = "carboniq-backend-agent"


def is_configured() -> bool:
    """Return True only when both API key and agent ID are present."""
    return bool(get_api_key()) and bool(get_agent_id())


def build_carbon_prompt(context: dict) -> str:
    """
    Build a structured natural-language prompt from verified dashboard context.

    Parameters
    ----------
    context : dict
        Keys expected (all come from the deterministic dashboard endpoint):
          company_name, total_co2e_tonnes, scope_1_tonnes, scope_2_tonnes,
          scope_3_tonnes, activity_count, calculated_count, needs_review_count,
          activity_breakdown (list of {activity, scope, co2e_tonnes, date})

    Returns
    -------
    str  Human-readable message to send to the Lyzr agent.
    """
    company_name       = context.get("company_name", "the company")
    total_co2e         = context.get("total_co2e_tonnes", 0)
    scope_1            = context.get("scope_1_tonnes", 0)
    scope_2            = context.get("scope_2_tonnes", 0)
    scope_3            = context.get("scope_3_tonnes", 0)
    activity_count     = context.get("activity_count", 0)
    calculated_count   = context.get("calculated_count", 0)
    needs_review_count = context.get("needs_review_count", 0)
    breakdown          = context.get("activity_breakdown", [])

    breakdown_lines = []
    for item in breakdown[:10]:  # cap at 10 to keep prompt size reasonable
        breakdown_lines.append(
            f"  • {item.get('activity','?')} | {item.get('scope','?')} "
            f"| {item.get('co2e_tonnes',0):.4f} tCO2e | {item.get('date','?')}"
        )
    breakdown_text = "\n".join(breakdown_lines) if breakdown_lines else "  (no detail available)"

    prompt = f"""You are CarbonIQ AI, an expert carbon accounting and ESG compliance assistant.

The following verified emission data has been calculated by the CarbonIQ deterministic engine
for {company_name}. These numbers are authoritative — do not recalculate or dispute them.

=== VERIFIED EMISSION SUMMARY ===
Total GHG Footprint : {total_co2e} tCO2e
  Scope 1 (Direct) : {scope_1} tCO2e
  Scope 2 (Grid)   : {scope_2} tCO2e
  Scope 3 (Indirect): {scope_3} tCO2e

Activity Coverage:
  Total activities logged   : {activity_count}
  Fully calculated records  : {calculated_count}
  Records needing review    : {needs_review_count}

Recent Activity Breakdown:
{breakdown_text}

=== YOUR TASK ===
Provide a concise, professional carbon intelligence review for {company_name}.
Include:
1. Scope distribution analysis — which scope dominates and why that matters
2. Data quality assessment — comment on the ratio of Calculated vs Needs Review
3. Key compliance observations — any red flags or positive signals
4. One or two actionable reduction recommendations based on the highest-emission activities
5. A short summary verdict (2-3 sentences)

Use clear, professional language suitable for an ESG/sustainability report.
Do NOT invent or modify any emission numbers — use only the data provided above.
"""
    return prompt


def chat(context: dict, session_id: str | None = None) -> dict:
    """
    Send verified carbon context to the Lyzr agent and return its response.

    Parameters
    ----------
    context    : dict  – verified dashboard data (from /api/dashboard/<id>)
    session_id : str   – optional; a new UUID is generated if not provided

    Returns
    -------
    {
        "enabled"  : bool,  – False if credentials are missing
        "response" : str,   – agent text or error message
        "session_id": str,
    }
    """
    if not is_configured():
        logger.info("Lyzr agent not configured (missing LYZR_API_KEY or LYZR_AGENT_ID).")
        return {
            "enabled": False,
            "response": "AI insights are not available because the Lyzr agent is not configured.",
            "session_id": None,
        }

    # Lazy import — avoid import-time cost if not needed
    try:
        import requests  # noqa: PLC0415
    except ImportError:
        logger.error("'requests' package not installed. Run: pip install requests")
        return {
            "enabled": False,
            "response": "AI insights unavailable (missing 'requests' library on server).",
            "session_id": None,
        }

    sid = session_id or str(uuid.uuid4())
    message = build_carbon_prompt(context)

    agent_id = get_agent_id()
    api_key = get_api_key()
    endpoint = get_endpoint()
    timeout_sec = get_timeout()

    payload = {
        "user_id":    LYZR_SYSTEM_USER,
        "agent_id":   agent_id,
        "session_id": sid,
        "message":    message,
    }
    headers = {
        "x-api-key":    api_key,
        "Content-Type": "application/json",
    }

    try:
        resp = requests.post(
            endpoint,
            json=payload,
            headers=headers,
            timeout=timeout_sec,
        )
        resp.raise_for_status()
        data = resp.json()
        agent_text = data.get("response") or data.get("message") or str(data)
        logger.info(f"Lyzr agent responded ({len(agent_text)} chars) for session {sid}")
        return {
            "enabled":    True,
            "response":   agent_text,
            "session_id": sid,
        }

    except requests.exceptions.Timeout:
        logger.warning(f"Lyzr agent timed out after {timeout_sec}s for session {sid}")
        return {
            "enabled":    True,
            "response":   "The AI agent took too long to respond. Please try again.",
            "session_id": sid,
        }
    except requests.exceptions.HTTPError as e:
        status = e.response.status_code if e.response is not None else "?"
        logger.error(f"Lyzr HTTP error {status} for session {sid}: {e}")
        return {
            "enabled":    True,
            "response":   f"AI agent returned an error (HTTP {status}). Please check your API key.",
            "session_id": sid,
        }
    except Exception as e:  # noqa: BLE001
        logger.exception(f"Unexpected Lyzr error for session {sid}: {e}")
        return {
            "enabled":    True,
            "response":   "An unexpected error occurred while contacting the AI agent.",
            "session_id": sid,
        }
