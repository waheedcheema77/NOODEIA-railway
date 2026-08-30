import io
import re
import sys
import time
from contextlib import redirect_stdout
from pathlib import Path
from typing import Any, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# Ensure local modules are available when spawned with a different cwd
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from langgraph_agent_ace import build_ace_graph
from langgraph_utile import _extract_final


def _clean_answer(answer: str | None) -> str | None:
    if not answer:
        return answer
    final = _extract_final(answer)
    if final:
        return final.strip()
    cleaned = re.sub(r"<scratchpad>.*?</scratchpad>", "", answer, flags=re.DOTALL)
    stripped_lines = [ln.strip() for ln in cleaned.splitlines() if ln.strip()]
    if stripped_lines:
        return stripped_lines[-1]
    cleaned_stripped = cleaned.strip()
    return cleaned_stripped or answer


def _sanitize_answer(answer: str | None) -> str | None:
    if not answer:
        return answer
    lines = answer.splitlines()
    filtered = [ln for ln in lines if not re.fullmatch(r"\s*\d+\s*", ln)]
    if filtered:
        return "\n".join(filtered).strip()
    return answer.strip()


# Initialize the graph globally ONCE to avoid cold starts
print("Initializing ACE graph...")
ace_graph = build_ace_graph()
print("ACE graph initialization complete.")

app = FastAPI(title="ACE Agent FastAPI Server")


class Message(BaseModel):
    role: str
    content: str


class ChatPayload(BaseModel):
    messages: List[Message]
    mode: Optional[str] = ""
    scratch: Optional[dict[str, Any]] = Field(default_factory=dict)
    thread_id: Optional[str] = None


@app.post("/chat")
def chat_endpoint(payload: ChatPayload):
    try:
        messages = [{"role": msg.role, "content": msg.content} for msg in payload.messages]
        mode = payload.mode or ""
        scratch = payload.scratch or {}

        # Default: enable online learning so ACE can grow its memory
        scratch.setdefault("ace_online_learning", True)

        thread_id = payload.thread_id or f"ace-thread-{int(time.time() * 1000)}"
        config = {"configurable": {"thread_id": thread_id}}

        state = {
            "messages": messages,
            "mode": mode,
            "scratch": scratch,
            "result": {},
        }

        # Invoke the global graph
        log_buffer = io.StringIO()
        with redirect_stdout(log_buffer):
            output = ace_graph.invoke(state, config=config)

        response = {
            "answer": _sanitize_answer(_clean_answer(output.get("result", {}).get("answer"))),
            "mode": output.get("mode"),
            "result": output.get("result", {}),
            "scratch": output.get("scratch", {}),
        }

        return response
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
