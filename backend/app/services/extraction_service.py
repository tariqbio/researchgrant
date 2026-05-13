"""
AI Extraction Service
=====================
This is the most critical service in the entire pipeline.
It takes raw OCR text (Bengali + English mixed) and extracts
structured grant data using the Claude API.

The extraction prompt has been carefully engineered to handle:
- Bengali-language notices
- Mixed Bengali/English text
- Poorly formatted scanned documents
- Missing or ambiguous fields
"""

import json
import anthropic
from typing import Optional
from app.core.config import settings

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

# Canonical research area taxonomy — AI must map to these slugs
RESEARCH_AREAS = [
    "biotechnology", "life_sciences", "agriculture", "crop_science",
    "soil_science", "food_technology", "fisheries", "veterinary",
    "engineering", "civil_engineering", "mechanical_engineering",
    "electrical_engineering", "chemical_engineering", "ict",
    "software_engineering", "data_science", "ai_ml",
    "climate_environment", "water_resources", "renewable_energy",
    "social_sciences", "economics", "education", "public_health",
    "medicine", "pharmacy", "chemistry", "physics", "mathematics",
    "urban_planning", "architecture", "law", "humanities",
]

ELIGIBILITY_TYPES = [
    "faculty", "phd_student", "masters_student", "undergraduate_student",
    "postdoc", "scientist", "researcher", "government_employee",
    "ngo_worker", "private_sector",
]

EXTRACTION_SYSTEM_PROMPT = f"""You are an expert at extracting structured data from Bangladeshi government research grant notices. These notices may be in Bengali, English, or a mix of both.

Your task is to extract grant information and return ONLY a valid JSON object — no preamble, no explanation, no markdown code fences. Just the raw JSON.

Extract these exact fields:
- title_en: Grant title in English (translate from Bengali if needed)
- title_bn: Grant title in Bengali (original Bengali text, null if not present)
- issuing_agency: Full name of the issuing organization in English
- issuing_agency_bn: Bengali name of the issuing organization (null if not present)
- deadline: Application deadline in ISO format YYYY-MM-DD (null if not found)
- funding_min: Minimum funding amount as a number in BDT (null if not specified)
- funding_max: Maximum funding amount as a number in BDT (null if not specified)
- currency: Currency code, almost always "BDT" for Bangladeshi grants
- eligibility_types: Array of who can apply, using ONLY these values: {ELIGIBILITY_TYPES}
- research_areas: Array of relevant research areas, using ONLY these values: {RESEARCH_AREAS}
- description_en: 2-3 sentence summary of the grant in English
- description_bn: Original Bengali description text if present (null otherwise)
- source_type: "government_notice" | "newspaper" | "institutional"

Also include confidence scores for each field as _conf suffix (0.0 to 1.0):
- deadline_conf, funding_min_conf, funding_max_conf, eligibility_types_conf, research_areas_conf
- overall_confidence: weighted average of all field confidences

Rules:
- If a field is genuinely not present, use null — never guess
- For funding amounts, convert to numbers (e.g. "৫ লক্ষ" → 500000, "20 lakh" → 2000000)
- For deadlines, interpret Bengali date formats (e.g. "৩০ জুন ২০২৬" → "2026-06-30")
- For research_areas, map the grant's focus to the closest slugs from the list
- For eligibility_types, be conservative — only include if explicitly stated
- overall_confidence below 0.5 means the document was likely unclear or incomplete
"""

FEW_SHOT_EXAMPLE = """
Example input (Bengali notice):
"বাংলাদেশ কৃষি গবেষণা কাউন্সিল (BARC) কৃষি ও সংশ্লিষ্ট বিজ্ঞানে গবেষণার জন্য আবেদন আহ্বান করছে। আবেদনের শেষ তারিখ ৩০ জুন ২০২৬। অনুদানের পরিমাণ ৫ লক্ষ থেকে ২০ লক্ষ টাকা। বিশ্ববিদ্যালয়ের শিক্ষক এবং গবেষণা প্রতিষ্ঠানের বিজ্ঞানীরা আবেদন করতে পারবেন।"

Example output:
{
  "title_en": "BARC Agricultural Research Grant 2026",
  "title_bn": "BARC কৃষি গবেষণা অনুদান ২০২৬",
  "issuing_agency": "Bangladesh Agricultural Research Council",
  "issuing_agency_bn": "বাংলাদেশ কৃষি গবেষণা কাউন্সিল",
  "deadline": "2026-06-30",
  "deadline_conf": 0.97,
  "funding_min": 500000,
  "funding_max": 2000000,
  "funding_min_conf": 0.92,
  "funding_max_conf": 0.92,
  "currency": "BDT",
  "eligibility_types": ["faculty", "scientist"],
  "eligibility_types_conf": 0.88,
  "research_areas": ["agriculture", "crop_science", "food_technology"],
  "research_areas_conf": 0.75,
  "description_en": "BARC invites research proposals from university faculty and scientists in agricultural and related sciences. Grants of BDT 500,000 to 2,000,000 are available for selected proposals.",
  "description_bn": "বাংলাদেশ কৃষি গবেষণা কাউন্সিল কৃষি ও সংশ্লিষ্ট বিজ্ঞানে গবেষণার জন্য আবেদন আহ্বান করছে।",
  "source_type": "government_notice",
  "overall_confidence": 0.88
}
"""


async def extract_grant_from_text(raw_text: str) -> dict:
    """
    Send raw OCR text to Claude and get structured grant JSON back.
    This is called after OCR completes and before human review.
    """
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        system=EXTRACTION_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"{FEW_SHOT_EXAMPLE}\n\nNow extract from this grant notice:\n\n{raw_text}"
            }
        ],
    )

    raw_json = response.content[0].text.strip()

    # Strip markdown fences if model added them despite instructions
    if raw_json.startswith("```"):
        raw_json = raw_json.split("```")[1]
        if raw_json.startswith("json"):
            raw_json = raw_json[4:]

    extracted = json.loads(raw_json)
    return extracted


def build_grant_from_extraction(extracted: dict) -> dict:
    """
    Map AI extraction output to Grant model fields.
    Called after human approval to create the Grant record.
    """
    return {
        "title_en": extracted.get("title_en"),
        "title_bn": extracted.get("title_bn"),
        "issuing_agency": extracted.get("issuing_agency"),
        "deadline": extracted.get("deadline"),
        "funding_min": extracted.get("funding_min"),
        "funding_max": extracted.get("funding_max"),
        "currency": extracted.get("currency", "BDT"),
        "eligibility_types": extracted.get("eligibility_types", []),
        "research_areas": extracted.get("research_areas", []),
        "description_en": extracted.get("description_en"),
        "description_bn": extracted.get("description_bn"),
        "ai_confidence_score": extracted.get("overall_confidence"),
        "ai_extracted_fields": {
            k: v for k, v in extracted.items() if k.endswith("_conf")
        },
    }
