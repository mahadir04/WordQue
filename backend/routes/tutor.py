"""Tutor routes — quiz generation."""
from fastapi import APIRouter, Depends
from models import TutorRequest, TutorResponse, QuizQuestion, Citation
from services.llm_chain import generate_quiz
from routes.auth import get_current_user

router = APIRouter(prefix="/api", tags=["tutor"])


@router.post("/tutor/generate", response_model=TutorResponse)
async def generate_quiz_endpoint(request: TutorRequest, current_user: dict = Depends(get_current_user)):
    """Generate quiz questions from corpus content with user isolation."""
    raw_questions = await generate_quiz(
        topic=request.topic,
        doc_id=request.doc_id,
        num_questions=request.num_questions,
        question_type=request.question_type,
        user_id=current_user["id"]
    )

    questions = []
    for q in raw_questions:
        source = None
        if q.get("source"):
            source = Citation(
                doc_id=q["source"]["doc_id"],
                filename=q["source"]["filename"],
                page=q["source"]["page"],
                text=q["source"]["text"],
            )
        questions.append(
            QuizQuestion(
                question=q["question"],
                choices=q.get("choices", []),
                correct_answer=q["correct_answer"],
                explanation=q.get("explanation", ""),
                question_type=q.get("question_type", request.question_type),
                source=source,
            )
        )

    return TutorResponse(questions=questions)
