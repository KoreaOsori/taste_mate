from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
import uuid

router = APIRouter()


class ChatRequest(BaseModel):
    user_id: str
    message: str
    user_profile: Optional[dict] = None


class ChatMessageOut(BaseModel):
    id: str
    role: str
    content: str
    timestamp: str


class ChatResponse(BaseModel):
    message: ChatMessageOut


def build_system_prompt(user_profile: Optional[dict]) -> str:
    """
    Builds a rich, context-aware system prompt for the AI nutritionist.
    Covers caloric balance, macros, meal timing, emotional context,
    budget considerations, and cultural food preferences.
    """
    base = (
        "당신은 '밥친구'라는 이름의 AI 영양 상담 전문가이자 식사 추천 코치입니다.\n"
        "항상 한국어로 친근하고 따뜻하게 대화하세요.\n\n"
        "## 역할 및 원칙\n"
        "- 사용자의 건강 목표, 현재 칼로리 상태, 기분, 날씨, 동반자 수 등 다양한 맥락을 종합해 조언합니다.\n"
        "- 단순한 칼로리 계산을 넘어 단백질/탄수화물/지방 균형, 식사 타이밍, 음식 조합을 고려합니다.\n"
        "- 추천 이유를 구체적으로 설명하되, 3줄 이내의 간결한 핵심 요약을 먼저 제시합니다.\n"
        "- 사용자가 묻지 않아도 관련 주의사항(예: 나트륨, 알레르기, 혈당 급등 식품)을 선제적으로 안내합니다.\n"
        "- 답변 마지막에 항상 후속 질문을 하나 이상 제안하여 대화를 이어갑니다.\n\n"
        "## 고려해야 할 상황들\n"
        "1. **칼로리 잔여량**: 오늘 남은 칼로리에 맞는 식사 포션을 제안하세요.\n"
        "2. **식사 시간대**: 아침/점심/저녁/야식에 따라 소화 부담과 영양 흡수가 다릅니다.\n"
        "3. **감정 상태**: 피곤함→당 보충, 스트레스→과식 방지, 기쁨→특별한 음식 허용 등.\n"
        "4. **운동 여부**: 운동 전후 단백질/탄수화물 타이밍 어드바이스를 포함하세요.\n"
        "5. **문화적 선호**: 한국식 식사 패턴(밥+국+반찬)을 존중하면서 서양/아시아 퓨전도 제안 가능.\n"
        "6. **예산**: 고가 레스토랑부터 편의점 조합까지 현실적인 옵션을 포함하세요.\n"
        "7. **날씨/계절**: 더운 날엔 가벼운 음식, 추운 날엔 따뜻한 국물류 우선 추천.\n"
        "8. **동반자**: 혼밥/데이트/친구 모임에 따라 메뉴와 장소 특성이 달라집니다.\n"
    )

    if not user_profile:
        return base

    name = user_profile.get("name", "사용자")
    goal_map = {
        "lose": "체중 감량 (저칼로리·고단백 위주)",
        "gain": "근육 증가 (고단백·복합 탄수화물 위주)",
        "balanced": "균형 유지 (다양한 영양소 균형)",
        "health": "건강 유지 (항산화·미네랄 풍부한 식품 위주)",
    }
    goal = goal_map.get(str(user_profile.get("goal", "")), "건강 관리")
    target_cal = int(user_profile.get("targetCalories", 2000))
    current_cal = int(user_profile.get("currentCalories", 0))
    remaining_cal = max(0, target_cal - current_cal)
    weight = user_profile.get("weight")

    profile_ctx = (
        f"\n## 현재 사용자 정보\n"
        f"- 이름: {name}님\n"
        f"- 목표: {goal}\n"
        f"- 오늘 목표 칼로리: {target_cal}kcal\n"
        f"- 현재까지 섭취: {current_cal}kcal\n"
        f"- 남은 칼로리: {remaining_cal}kcal\n"
    )
    if weight:
        profile_ctx += f"- 체중: {weight}kg\n"

    # Dynamic advice based on remaining calories
    if remaining_cal < 200:
        profile_ctx += (
            "\n⚠️ 오늘 칼로리가 거의 다 찼습니다. "
            "가벼운 간식이나 채소 위주로만 허용하고, 과식을 방지하는 전략을 조언하세요.\n"
        )
    elif remaining_cal > 1000:
        profile_ctx += (
            "\n✅ 칼로리 여유가 많습니다. "
            "영양 균형을 갖춘 포만감 있는 식사를 적극 추천하세요.\n"
        )
    else:
        profile_ctx += (
            f"\n📊 {remaining_cal}kcal 남아 있습니다. "
            "적당한 포션의 균형 잡힌 식사를 추천하세요.\n"
        )

    return base + profile_ctx


@router.get("/history/{user_id}", response_model=List[ChatMessageOut])
async def get_chat_history(user_id: str):
    """
    Fetches chat history from Supabase for the given user.
    Returns empty list if Supabase is not configured.
    """
    try:
        from db.supabase_client import get_supabase_client
        supabase = get_supabase_client()
        response = (
            supabase.table("chat_history")
            .select("*")
            .eq("user_id", user_id)
            .order("timestamp", desc=False)
            .limit(50)
            .execute()
        )
        return [
            ChatMessageOut(
                id=row.get("id", ""),
                role=row.get("role", "assistant"),
                content=row.get("content", ""),
                timestamp=str(row.get("timestamp", "")),
            )
            for row in (response.data or [])
        ]
    except Exception as e:
        print(f"Chat history fetch error: {e}")
        return []


@router.post("/message", response_model=ChatResponse)
async def send_chat_message(req: ChatRequest):
    """
    Sends a message to the AI nutritionist using o3-mini (reasoning model).

    Why o3-mini over gpt-4o-mini:
    - Multi-step reasoning before answering → better nutrient analysis
    - Considers multiple factors simultaneously (calories, timing, emotion, budget)
    - More coherent multi-condition advice (e.g. "lose weight + low budget + post-workout")
    - reasoning_effort="medium" balances speed (~3-5s) and reasoning depth
    """
    openai_key = os.environ.get("OPENAI_API_KEY")
    if not openai_key:
        raise HTTPException(status_code=503, detail="OpenAI API key not configured")

    try:
        from openai import OpenAI
        client = OpenAI(api_key=openai_key)

        system_prompt = build_system_prompt(req.user_profile)

        # o3-mini API notes:
        # ✗ Does NOT support 'system' role → inject system context as first user message
        # ✗ Does NOT support 'temperature' parameter
        # ✓ Use 'reasoning_effort': "low" | "medium" | "high"
        #   "medium" = ~3-5s latency, good reasoning depth for nutrition advice
        completion = client.chat.completions.create(
            model="o3-mini",
            reasoning_effort="medium",
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"[시스템 지시사항 — 반드시 따를 것]\n"
                        f"{system_prompt}\n\n"
                        f"[사용자 메시지]\n{req.message}"
                    ),
                },
            ],
            max_completion_tokens=1000,
        )

        ai_content = (
            completion.choices[0].message.content
            or "죄송합니다, 응답을 생성할 수 없었습니다."
        )
        now = datetime.utcnow().isoformat()
        ai_msg_id = str(uuid.uuid4())

        # Save to Supabase (best-effort — won't crash if DB unavailable)
        try:
            from db.supabase_client import get_supabase_client
            supabase = get_supabase_client()
            user_msg_id = str(uuid.uuid4())

            supabase.table("chat_history").insert([
                {
                    "id": user_msg_id,
                    "user_id": req.user_id,
                    "role": "user",
                    "content": req.message,
                    "timestamp": now,
                },
                {
                    "id": ai_msg_id,
                    "user_id": req.user_id,
                    "role": "assistant",
                    "content": ai_content,
                    "timestamp": now,
                },
            ]).execute()
        except Exception as db_err:
            print(f"DB save error (non-fatal): {db_err}")

        return ChatResponse(
            message=ChatMessageOut(
                id=ai_msg_id,
                role="assistant",
                content=ai_content,
                timestamp=now,
            )
        )

    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"AI response error: {str(e)}")
