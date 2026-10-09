"""Focus Flow Executa plugin for Anna AI OS."""

import json
import sys
import math
from datetime import datetime

MANIFEST = {
    "name": "tool-dev-focus-flow",
    "version": "0.2.0",
    "description": "Productivity engine for Focus Flow: session planning, break advice, and analytics.",
    "tools": [
        {
            "name": "ping",
            "description": "Smoke-test method.",
            "parameters": {
                "type": "object",
                "properties": {},
                "additionalProperties": False,
            },
        },
        {
            "name": "plan_focus_session",
            "description": "Generates a structured focus interval plan and actionable subtasks from a goal.",
            "parameters": {
                "type": "object",
                "properties": {
                    "goal": {"type": "string", "description": "The main task or study goal."},
                    "available_minutes": {"type": "number", "description": "Total available minutes (default: 60)."}
                },
                "required": ["goal"],
                "additionalProperties": False,
            },
        },
        {
            "name": "log_session",
            "description": "Logs a completed focus or break session and calculates productivity score.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_name": {"type": "string"},
                    "duration_minutes": {"type": "number"},
                    "mode": {"type": "string", "enum": ["focus", "short_break", "long_break"]}
                },
                "required": ["task_name", "duration_minutes", "mode"],
                "additionalProperties": False,
            },
        },
        {
            "name": "get_break_recommendation",
            "description": "Provides physical and mental refresh exercises based on focus length.",
            "parameters": {
                "type": "object",
                "properties": {
                    "focus_duration": {"type": "number", "description": "Minutes spent in deep focus."}
                },
                "required": ["focus_duration"],
                "additionalProperties": False,
            },
        },
        {
            "name": "get_analytics_summary",
            "description": "Calculates focus streak, total deep work hours, and efficiency scores from logs.",
            "parameters": {
                "type": "object",
                "properties": {
                    "sessions": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "duration_minutes": {"type": "number"},
                                "mode": {"type": "string"},
                                "timestamp": {"type": "string"}
                            }
                        }
                    }
                },
                "required": ["sessions"],
                "additionalProperties": False,
            },
        }
    ],
}


def plan_focus_session(goal: str, available_minutes: float = 60.0) -> dict:
    available_minutes = max(15.0, float(available_minutes))
    num_pomodoros = math.ceil(available_minutes / 30.0)
    focus_block = 25.0
    break_block = 5.0
    
    subtasks = [
        f"Define clear acceptance criteria for '{goal}'",
        f"Eliminate distractions & prepare workspace",
        f"Execute Deep Work Block 1 (25 mins)",
        f"Review progress & complete final details"
    ]
    if available_minutes >= 90:
        subtasks.insert(3, "Execute Deep Work Block 2 (25 mins)")
        subtasks.insert(4, "Take a 15-minute Long Refresh Break")

    return {
        "success": True,
        "data": {
            "goal": goal,
            "total_minutes": available_minutes,
            "recommended_blocks": num_pomodoros,
            "focus_duration": focus_block,
            "break_duration": break_block,
            "subtasks": subtasks,
            "tips": "Turn off notifications and keep a single browser tab open for maximum focus."
        }
    }


def log_session(task_name: str, duration_minutes: float, mode: str) -> dict:
    dur = float(duration_minutes)
    score = 100 if mode == "focus" and dur >= 20 else (85 if mode == "focus" else 90)
    
    return {
        "success": True,
        "data": {
            "logged_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "task_name": task_name,
            "duration_minutes": dur,
            "mode": mode,
            "productivity_score": score,
            "message": f"Great work! Logged {int(dur)} mins of {mode.replace('_', ' ')}."
        }
    }


def get_break_recommendation(focus_duration: float) -> dict:
    dur = float(focus_duration)
    if dur >= 50:
        rec = {
            "title": "20-20-20 & Full Stretch",
            "steps": [
                "Look at an object 20 feet away for 20 seconds to rest your eyes.",
                "Stand up and reach high toward the ceiling for 15 seconds.",
                "Drink a full glass of water and stretch your lower back."
            ],
            "duration_minutes": 10
        }
    elif dur >= 25:
        rec = {
            "title": "Hydrate & Shoulder Roll",
            "steps": [
                "Roll your shoulders backwards 10 times.",
                "Take 5 deep box breaths (4s in, 4s hold, 4s out, 4s hold).",
                "Refill your water glass."
            ],
            "duration_minutes": 5
        }
    else:
        rec = {
            "title": "Quick Reset",
            "steps": [
                "Close your eyes for 60 seconds.",
                "Gentle neck rolls left and right."
            ],
            "duration_minutes": 3
        }

    return {"success": True, "data": rec}


def get_analytics_summary(sessions: list) -> dict:
    total_focus_mins = sum(s.get("duration_minutes", 0) for s in sessions if s.get("mode") == "focus")
    total_sessions = len([s for s in sessions if s.get("mode") == "focus"])
    
    # Simple streak calculation
    streak_days = 1 if total_sessions > 0 else 0
    avg_session_length = round(total_focus_mins / total_sessions, 1) if total_sessions > 0 else 0

    return {
        "success": True,
        "data": {
            "total_focus_minutes": total_focus_mins,
            "total_focus_hours": round(total_focus_mins / 60.0, 1),
            "completed_sessions": total_sessions,
            "avg_session_minutes": avg_session_length,
            "current_streak_days": streak_days,
            "efficiency_rating": "Master of Focus" if total_focus_mins >= 120 else "On Track"
        }
    }


def invoke(method: str, args: dict) -> dict:
    if method == "ping":
        return {"success": True, "data": {"pong": True}}
    elif method == "plan_focus_session":
        return plan_focus_session(args.get("goal", ""), args.get("available_minutes", 60))
    elif method == "log_session":
        return log_session(args.get("task_name", ""), args.get("duration_minutes", 25), args.get("mode", "focus"))
    elif method == "get_break_recommendation":
        return get_break_recommendation(args.get("focus_duration", 25))
    elif method == "get_analytics_summary":
        return get_analytics_summary(args.get("sessions", []))
    return {"success": False, "error": f"unknown method: {method}"}


def main() -> None:
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except Exception:
            continue
            
        try:
            method = req.get("method")
            if method == "describe":
                result = MANIFEST
            elif method == "health":
                result = {"status": "ready"}
            elif method == "invoke":
                params = req.get("params", {})
                result = invoke(params.get("tool"), params.get("arguments", {}))
            else:
                raise ValueError(f"unknown rpc: {method}")
            sys.stdout.write(json.dumps({"jsonrpc": "2.0", "id": req.get("id"), "result": result}) + "\n")
        except Exception as e:
            sys.stdout.write(
                json.dumps(
                    {
                        "jsonrpc": "2.0",
                        "id": req.get("id"),
                        "error": {"code": -32601, "message": str(e)},
                    }
                )
                + "\n"
            )
        sys.stdout.flush()


if __name__ == "__main__":
    main()
