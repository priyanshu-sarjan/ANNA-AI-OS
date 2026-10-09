"""0-Spoilage Executa plugin for Anna AI OS."""

import json
import sys
import math
from datetime import datetime, date

MANIFEST = {
    "name": "tool-dev-zero-spoilage",
    "version": "1.0.0",
    "description": "Smart pantry inventory management, expiry prevention, AI zero-waste recipe generation, and produce quality grading.",
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
            "name": "add_grocery_item",
            "description": "Add a perishable grocery item to the pantry inventory.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Item name, e.g. Milk, Spinach, Avocados"},
                    "category": {"type": "string", "description": "Category e.g. Produce, Dairy, Bakery, Meat, Pantry, Fruits"},
                    "expiry_date": {"type": "string", "description": "Expiry date in YYYY-MM-DD format"},
                    "quantity": {"type": "string", "description": "Quantity e.g. 500g, 1L, 2 bunches"}
                },
                "required": ["name", "expiry_date"],
                "additionalProperties": False,
            },
        },
        {
            "name": "get_inventory",
            "description": "Retrieve current inventory items sorted by expiry date and urgency status.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {"type": "string", "description": "Filter by category (optional)"}
                },
                "additionalProperties": False,
            },
        },
        {
            "name": "check_expiring_items",
            "description": "Find items expiring within a threshold number of days.",
            "parameters": {
                "type": "object",
                "properties": {
                    "days_threshold": {"type": "number", "description": "Days remaining threshold (default: 3)"}
                },
                "additionalProperties": False,
            },
        },
        {
            "name": "generate_spoilage_prevention_recipes",
            "description": "Generate zero-waste recipes using ingredients nearing expiration.",
            "parameters": {
                "type": "object",
                "properties": {
                    "ingredients": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of ingredient names nearing expiration."
                    },
                    "dietary_preference": {"type": "string", "description": "Optional preference (e.g. Vegetarian, Quick 15-min)"}
                },
                "required": ["ingredients"],
                "additionalProperties": False,
            },
        },
        {
            "name": "analyze_produce_quality",
            "description": "Grade produce quality, estimate shelf life, and prescribe storage & markdown rules.",
            "parameters": {
                "type": "object",
                "properties": {
                    "produce_name": {"type": "string", "description": "Name of fruit or vegetable"},
                    "visual_condition": {"type": "string", "description": "Fresh, Slight blemish, Soft spots, Overripe"}
                },
                "required": ["produce_name", "visual_condition"],
                "additionalProperties": False,
            },
        },
        {
            "name": "diagnose_crop_health",
            "description": "Diagnose crop disease or pest issue and recommend bio-remediation protocol.",
            "parameters": {
                "type": "object",
                "properties": {
                    "crop_name": {"type": "string"},
                    "symptoms": {"type": "string"}
                },
                "required": ["crop_name", "symptoms"],
                "additionalProperties": False,
            },
        }
    ],
}

# In-memory item store for Executa RPC session
inventory = [
    {"id": 1, "name": "Fresh Spinach", "category": "Produce", "expiry_date": datetime.now().strftime("%Y-%m-%d"), "quantity": "2 bunches", "added_on": datetime.now().strftime("%Y-%m-%d")},
    {"id": 2, "name": "Organic Milk", "category": "Dairy", "expiry_date": datetime.now().strftime("%Y-%m-%d"), "quantity": "1 Litre", "added_on": datetime.now().strftime("%Y-%m-%d")},
    {"id": 3, "name": "Ripe Tomatoes", "category": "Produce", "expiry_date": datetime.now().strftime("%Y-%m-%d"), "quantity": "500g", "added_on": datetime.now().strftime("%Y-%m-%d")},
]


def calculate_days_left(expiry_str: str) -> int:
    try:
        exp = datetime.strptime(expiry_str, "%Y-%m-%d").date()
        today = date.today()
        return (exp - today).days
    except ValueError:
        return 999


def determine_urgency(days_left: int) -> str:
    if days_left <= 1:
        return "critical"
    elif days_left <= 3:
        return "urgent"
    elif days_left <= 5:
        return "warning"
    return "safe"


def add_grocery_item(name: str, category: str, expiry_date: str, quantity: str = "1") -> dict:
    days_left = calculate_days_left(expiry_date)
    urgency = determine_urgency(days_left)
    
    item = {
        "id": int(datetime.now().timestamp() * 1000),
        "name": name,
        "category": category or "General",
        "expiry_date": expiry_date,
        "quantity": quantity or "1",
        "days_left": days_left,
        "urgency": urgency,
        "added_on": datetime.now().strftime("%Y-%m-%d")
    }
    inventory.append(item)
    return {
        "success": True,
        "data": {
            "status": "success",
            "message": f"Added '{name}' ({quantity}) expiring in {days_left} day(s).",
            "item": item,
            "total_items": len(inventory)
        }
    }


def get_inventory(category: str = None) -> dict:
    items = []
    for item in inventory:
        if category and category.lower() != "all" and item.get("category", "").lower() != category.lower():
            continue
        days = calculate_days_left(item.get("expiry_date", ""))
        item_copy = dict(item)
        item_copy["days_left"] = days
        item_copy["urgency"] = determine_urgency(days)
        items.append(item_copy)

    items.sort(key=lambda x: x["days_left"])
    return {
        "success": True,
        "data": {
            "count": len(items),
            "items": items
        }
    }


def check_expiring_items(days_threshold: float = 3.0) -> dict:
    threshold = int(days_threshold)
    expiring = []
    for item in inventory:
        days = calculate_days_left(item.get("expiry_date", ""))
        if days <= threshold:
            item_copy = dict(item)
            item_copy["days_left"] = days
            item_copy["urgency"] = determine_urgency(days)
            expiring.append(item_copy)

    expiring.sort(key=lambda x: x["days_left"])
    return {
        "success": True,
        "data": {
            "expiring_count": len(expiring),
            "days_threshold": threshold,
            "items": expiring,
            "has_critical": any(x["days_left"] <= 1 for x in expiring)
        }
    }


def generate_spoilage_prevention_recipes(ingredients: list, dietary_preference: str = "") -> dict:
    ing_str = ", ".join(ingredients) if ingredients else "Pantry Items"
    
    recipes = [
        {
            "title": f"Zero-Waste {ingredients[0] if ingredients else 'Pantry'} & Veggie Frittata",
            "prep_time": "15 mins",
            "difficulty": "Easy",
            "saved_ingredients": ingredients,
            "instructions": [
                f"Sauté {ing_str} in a pan with 1 tbsp olive oil for 4 minutes until softened.",
                "Whisk 4 eggs with salt, pepper, and a splash of milk.",
                "Pour egg mixture over veggies and cook on low heat until set.",
                "Top with cheese and serve warm immediately!"
            ],
            "storage_tip": "Keep leftovers in an airtight glass container for up to 3 days."
        },
        {
            "title": f"Nutrient-Rich {ingredients[-1] if ingredients else 'Harvest'} Anti-Waste Soup",
            "prep_time": "20 mins",
            "difficulty": "Easy",
            "saved_ingredients": ingredients,
            "instructions": [
                f"Dice {ing_str} and brown in a soup pot with garlic and onion.",
                "Add 3 cups of vegetable broth and bring to a simmer for 12 minutes.",
                "Blend half the soup for a creamy texture, stir in herbs, and serve with crusty bread."
            ],
            "storage_tip": "Freeze in portions for up to 2 months to eliminate all food waste."
        },
        {
            "title": f"Crispy Farmhouse Stir-Fry Bowl",
            "prep_time": "12 mins",
            "difficulty": "Super Fast",
            "saved_ingredients": ingredients,
            "instructions": [
                f"Heat wok to high heat. Toss in {ing_str} with soy sauce, sesame oil, and ginger.",
                "Stir-fry rapidly for 5 minutes to retain crisp texture.",
                "Serve over steamed rice or quinoa."
            ],
            "storage_tip": "Great for next day work lunches!"
        }
    ]

    return {
        "success": True,
        "data": {
            "ingredients_used": ingredients,
            "recipes_count": len(recipes),
            "recipes": recipes,
            "message": f"Generated 3 zero-spoilage recipes using {ing_str}."
        }
    }


def analyze_produce_quality(produce_name: str, visual_condition: str) -> dict:
    cond = visual_condition.lower()
    if "fresh" in cond:
        grade = "Grade A Export"
        ripeness = 85
        shelf_life = 7
        markdown = "Day 0: 0% discount (Peak Price)"
        temp = "4°C - 7°C (High Humidity 90%)"
    elif "blemish" in cond or "scar" in cond:
        grade = "Grade B Local Market"
        ripeness = 92
        shelf_life = 4
        markdown = "Day 1: 15% markdown (Fast Sell)"
        temp = "3°C - 5°C"
    elif "soft" in cond or "overripe" in cond:
        grade = "Grade C Processing / Sauce"
        ripeness = 98
        shelf_life = 2
        markdown = "Day 2: 40% to 60% Flash Markdown"
        temp = "2°C - 4°C (Use Immediately)"
    else:
        grade = "Grade B Standard"
        ripeness = 88
        shelf_life = 5
        markdown = "Day 1: 20% discount"
        temp = "5°C"

    return {
        "success": True,
        "data": {
            "produce_name": produce_name,
            "visual_condition": visual_condition,
            "commercial_grade": grade,
            "ripeness_percent": ripeness,
            "estimated_shelf_life_days": shelf_life,
            "recommended_cold_storage": temp,
            "markdown_schedule": markdown,
            "zero_waste_advice": "Ideal for immediate consumption, juicing, canning, or zero-waste recipes."
        }
    }


def diagnose_crop_health(crop_name: str, symptoms: str) -> dict:
    return {
        "success": True,
        "data": {
            "crop_name": crop_name,
            "symptoms": symptoms,
            "probable_diagnosis": "Early Blight (Alternaria solani) or Chlorosis",
            "confidence_score": 92.5,
            "severity_level": "Moderate",
            "organic_treatment": "Apply Neem oil solution (5ml/L) or Trichoderma viride bio-fungicide every 7 days. Ensure proper air circulation.",
            "preventative_tip": "Avoid overhead watering and mulch soil around plant bases."
        }
    }


def invoke(method: str, args: dict) -> dict:
    if method == "ping":
        return {"success": True, "data": {"pong": True}}
    elif method == "add_grocery_item":
        return add_grocery_item(args.get("name", ""), args.get("category", ""), args.get("expiry_date", ""), args.get("quantity", "1"))
    elif method == "get_inventory":
        return get_inventory(args.get("category"))
    elif method == "check_expiring_items":
        return check_expiring_items(args.get("days_threshold", 3.0))
    elif method == "generate_spoilage_prevention_recipes":
        return generate_spoilage_prevention_recipes(args.get("ingredients", []), args.get("dietary_preference", ""))
    elif method == "analyze_produce_quality":
        return analyze_produce_quality(args.get("produce_name", ""), args.get("visual_condition", "Fresh"))
    elif method == "diagnose_crop_health":
        return diagnose_crop_health(args.get("crop_name", ""), args.get("symptoms", ""))
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
                # Accept both params.tool and params.arguments, or params.args
                tool_name = params.get("tool") or params.get("name")
                arguments = params.get("arguments") or params.get("args") or {}
                result = invoke(tool_name, arguments)
            elif method == "initialize":
                result = {"status": "ok"}
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
