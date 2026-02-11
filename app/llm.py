"""LLM client for recommendation reason generation with fallback."""
import json
import logging
import os
from pathlib import Path

from openai import OpenAI

from app.models import Candidate, Context, ReasonResponse

logger = logging.getLogger(__name__)

PROMPT_TEMPLATE_PATH = Path(__file__).resolve().parent.parent / "prompts" / "reason.txt"
FALLBACK_REASON = "선택한 메뉴가 현재 상황에 잘 맞습니다."


def _load_prompt_template() -> str:
    with open(PROMPT_TEMPLATE_PATH, "r", encoding="utf-8") as f:
        return f.read()


def _format_candidates(candidates: list[Candidate]) -> str:
    lines = []
    for c in candidates:
        lines.append(
            f"- menu_id={c.menu_id}, {c.menu_name} ({c.category}), "
            f"태그={c.tags}, 예상가격={c.price_est}원, 예상조리시간={c.prep_time_est}분"
        )
    return "\n".join(lines)


def _build_prompt(context: Context, candidates: list[Candidate]) -> str:
    template = _load_prompt_template()
    candidates_text = _format_candidates(candidates)
    context_data = context.model_dump() if hasattr(context, "model_dump") else context.dict()
    context_str = json.dumps(context_data, ensure_ascii=False)
    return template.format(candidates_text=candidates_text) + "\n\n## 현재 상황(JSON)\n" + context_str


def call_llm(context: Context, candidates: list[Candidate], top_k: list[int]) -> ReasonResponse:
    """
    Call LLM to select one menu and generate reason. On failure, fallback to top_k[0]
    with template reason.
    """
    prompt = _build_prompt(context, candidates)
    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    base_url = (os.getenv("OPENAI_BASE_URL") or "").strip() or None

    if not api_key:
        logger.warning("OPENAI_API_KEY가 비어 있음. .env 확인 후 서버 재시작하세요. (fallback 사용)")
        return _fallback(top_k)

    try:
        client = OpenAI(api_key=api_key, base_url=base_url)
        temperature = float(os.getenv("LLM_TEMPERATURE", "0.3"))
        response = client.chat.completions.create(
            model=os.getenv("LLM_MODEL", "gpt-4o-mini"),
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
        )
        content = (response.choices[0].message.content or "").strip()
        # Strip markdown code block if present
        if content.startswith("```"):
            content = content.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        data = json.loads(content)
        result = ReasonResponse(
            selected_menu_id=int(data["selected_menu_id"]),
            reason_one_liner=data["reason_one_liner"],
            reason_tags=list(data["reason_tags"]),
        )
        logger.info("LLM success: selected_menu_id=%s reason_len=%d", result.selected_menu_id, len(result.reason_one_liner))
        return result
    except json.JSONDecodeError as e:
        logger.exception("LLM 응답 JSON 파싱 실패 (모델이 JSON이 아닌 내용을 반환했을 수 있음): %s", e)
        return _fallback(top_k)
    except Exception as e:
        logger.exception("LLM 호출 실패 (API 키·네트워크·할당량 확인): %s", e)
        return _fallback(top_k)


def _fallback(top_k: list[int]) -> ReasonResponse:
    selected = top_k[0] if top_k else 0
    return ReasonResponse(
        selected_menu_id=selected,
        reason_one_liner=FALLBACK_REASON,
        reason_tags=["fallback"],
    )
