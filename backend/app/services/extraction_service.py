"""
Grant notice extraction.

The production path uses Claude when ANTHROPIC_API_KEY is configured. For local
testing and demo deploys, a deterministic fallback still produces a draft grant
instead of failing the whole upload pipeline.
"""

import json
import re
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional

import anthropic

from app.core.config import settings


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

AREA_KEYWORDS = {
    "agriculture": ["agriculture", "agricultural", "crop", "rice", "farm", "farming", "soil"],
    "crop_science": ["crop", "seed", "rice", "wheat", "variety"],
    "food_technology": ["food", "nutrition", "post harvest", "processing"],
    "climate_environment": ["climate", "environment", "environmental", "adaptation", "resilience"],
    "public_health": ["health", "public health", "disease", "epidemiology"],
    "medicine": ["medicine", "medical", "clinical", "hospital"],
    "engineering": ["engineering", "technology", "prototype"],
    "ict": ["ict", "software", "digital", "computer"],
    "ai_ml": ["artificial intelligence", "machine learning", "ai", "ml"],
    "data_science": ["data science", "analytics", "big data"],
    "renewable_energy": ["renewable", "solar", "wind", "energy"],
    "water_resources": ["water", "river", "flood", "irrigation"],
    "education": ["education", "learning", "school", "curriculum"],
    "social_sciences": ["social", "community", "gender", "policy"],
    "economics": ["economics", "economic", "finance", "market"],
    "biotechnology": ["biotechnology", "genetic", "genomics", "molecular"],
    "life_sciences": ["life science", "biology", "biological"],
}

ELIGIBILITY_KEYWORDS = {
    "faculty": ["faculty", "teacher", "professor", "lecturer"],
    "phd_student": ["phd", "doctoral"],
    "masters_student": ["masters", "ms student", "msc student"],
    "undergraduate_student": ["undergraduate", "bachelor"],
    "postdoc": ["postdoc", "postdoctoral"],
    "scientist": ["scientist"],
    "researcher": ["researcher", "research fellow"],
    "government_employee": ["government employee", "public servant"],
    "ngo_worker": ["ngo"],
    "private_sector": ["private sector", "industry"],
}

AGENCY_HINTS = [
    ("BARC", "Bangladesh Agricultural Research Council"),
    ("UGC", "University Grants Commission"),
    ("BCSIR", "Bangladesh Council of Scientific and Industrial Research"),
    ("BRRI", "Bangladesh Rice Research Institute"),
    ("MOST", "Ministry of Science and Technology"),
]

MONTHS = {
    "jan": 1, "january": 1,
    "feb": 2, "february": 2,
    "mar": 3, "march": 3,
    "apr": 4, "april": 4,
    "may": 5,
    "jun": 6, "june": 6,
    "jul": 7, "july": 7,
    "aug": 8, "august": 8,
    "sep": 9, "sept": 9, "september": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12,
}

BENGALI_DIGITS = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")


EXTRACTION_SYSTEM_PROMPT = f"""You extract structured data from Bangladeshi research grant notices.
Return only valid JSON, no markdown.

Fields:
title_en, title_bn, issuing_agency, issuing_agency_bn, deadline, funding_min,
funding_max, currency, eligibility_types, research_areas, description_en,
description_bn, source_type, deadline_conf, funding_min_conf, funding_max_conf,
eligibility_types_conf, research_areas_conf, overall_confidence.

Use only these research_areas: {RESEARCH_AREAS}
Use only these eligibility_types: {ELIGIBILITY_TYPES}
Use ISO YYYY-MM-DD dates. Use BDT amounts as numbers. Use null for missing values.
"""


def normalize_text(text: str) -> str:
    return (text or "").translate(BENGALI_DIGITS).replace("\u00a0", " ")


def first_meaningful_line(text: str) -> str:
    for line in text.splitlines():
        clean = re.sub(r"\s+", " ", line).strip(" -:\t")
        if len(clean) >= 12:
            return clean[:180]
    return "Uploaded Research Grant Notice"


def detect_agency(text: str) -> str:
    upper = text.upper()
    for short, full in AGENCY_HINTS:
        if short in upper or full.upper() in upper:
            return full
    match = re.search(r"(?:issued by|from|organization|agency)[:\s]+([A-Z][A-Za-z &().-]{5,100})", text, re.I)
    if match:
        return match.group(1).strip()
    return "Unknown Issuing Agency"


def parse_deadline(text: str) -> Optional[str]:
    text = normalize_text(text)
    iso = re.search(r"\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b", text)
    if iso:
        return date(int(iso.group(1)), int(iso.group(2)), int(iso.group(3))).isoformat()

    dmy = re.search(r"\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20\d{2})\b", text)
    if dmy:
        return date(int(dmy.group(3)), int(dmy.group(2)), int(dmy.group(1))).isoformat()

    named = re.search(
        r"\b(0?[1-9]|[12]\d|3[01])\s+"
        r"(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|"
        r"jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)"
        r"[, ]+\s*(20\d{2})\b",
        text,
        re.I,
    )
    if named:
        return date(int(named.group(3)), MONTHS[named.group(2).lower()], int(named.group(1))).isoformat()
    return None


def amount_to_bdt(number: str, unit: str = "") -> Decimal:
    value = Decimal(number.replace(",", ""))
    unit = unit.lower()
    if unit in {"lakh", "lac", "lakhs"}:
        value *= Decimal("100000")
    elif unit in {"crore", "crores"}:
        value *= Decimal("10000000")
    elif unit in {"million", "mn"}:
        value *= Decimal("1000000")
    return value


def parse_amounts(text: str) -> tuple[Optional[int], Optional[int]]:
    text = normalize_text(text)
    amounts = []
    for match in re.finditer(r"(?i)\b(bdt|tk\.?|taka)?\s*([0-9][0-9,]*(?:\.\d+)?)\s*(lakh|lakhs|lac|crore|crores|million|mn)?\b", text):
        currency = match.group(1)
        number = match.group(2)
        unit = match.group(3) or ""
        if not currency and not unit:
            continue
        try:
            value = int(amount_to_bdt(number, unit))
        except Exception:
            continue
        if value >= 1000:
            amounts.append(value)
    if not amounts:
        return None, None
    amounts = sorted(set(amounts))
    return amounts[0], amounts[-1]


def detect_values(text: str, mapping: dict[str, list[str]], fallback: list[str]) -> list[str]:
    lower = text.lower()
    found = [slug for slug, words in mapping.items() if any(word in lower for word in words)]
    return found[:5] or fallback


def description_from_text(text: str) -> str:
    clean = re.sub(r"\s+", " ", text).strip()
    if not clean:
        return "Grant notice uploaded for review."
    return clean[:450]


def heuristic_extract(raw_text: str) -> dict[str, Any]:
    text = normalize_text(raw_text)
    funding_min, funding_max = parse_amounts(text)
    deadline = parse_deadline(text)
    research_areas = detect_values(text, AREA_KEYWORDS, ["agriculture"])
    eligibility = detect_values(text, ELIGIBILITY_KEYWORDS, ["researcher"])
    agency = detect_agency(text)
    title = first_meaningful_line(text)

    confidence = 0.55
    if deadline:
        confidence += 0.1
    if funding_max:
        confidence += 0.1
    if agency != "Unknown Issuing Agency":
        confidence += 0.1

    return {
        "title_en": title,
        "title_bn": None,
        "issuing_agency": agency,
        "issuing_agency_bn": None,
        "deadline": deadline,
        "deadline_conf": 0.7 if deadline else 0.0,
        "funding_min": funding_min,
        "funding_max": funding_max,
        "funding_min_conf": 0.65 if funding_min else 0.0,
        "funding_max_conf": 0.65 if funding_max else 0.0,
        "currency": "BDT",
        "eligibility_types": eligibility,
        "eligibility_types_conf": 0.55,
        "research_areas": research_areas,
        "research_areas_conf": 0.6,
        "description_en": description_from_text(text),
        "description_bn": None,
        "source_type": "government_notice",
        "overall_confidence": min(confidence, 0.85),
        "_ai_model": "heuristic-fallback",
        "_extraction_note": "Claude was not configured or failed; used deterministic fallback extraction.",
    }


def parse_model_json(raw_json: str) -> dict[str, Any]:
    raw_json = raw_json.strip()
    if raw_json.startswith("```"):
        raw_json = raw_json.strip("`")
        raw_json = re.sub(r"^json\s*", "", raw_json, flags=re.I).strip()
    return json.loads(raw_json)


async def extract_grant_from_text(raw_text: str) -> dict:
    if not raw_text.strip():
        raise ValueError("No text was extracted from the uploaded document")

    if not settings.ANTHROPIC_API_KEY:
        return heuristic_extract(raw_text)

    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            system=EXTRACTION_SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": "Extract this grant notice:\n\n" + raw_text[:18000],
                }
            ],
        )
        extracted = parse_model_json(response.content[0].text)
        extracted["_ai_model"] = "claude-sonnet-4-20250514"
        return extracted
    except Exception as exc:
        extracted = heuristic_extract(raw_text)
        extracted["_extraction_note"] = f"Claude extraction failed: {exc}. Used deterministic fallback."
        return extracted


def parse_iso_date(value: Any) -> Optional[date]:
    if not value:
        return None
    if isinstance(value, date):
        return value
    try:
        return datetime.strptime(str(value), "%Y-%m-%d").date()
    except Exception:
        return None


def parse_decimal(value: Any) -> Optional[Decimal]:
    if value in (None, ""):
        return None
    try:
        return Decimal(str(value))
    except Exception:
        return None


def build_grant_from_extraction(extracted: dict) -> dict:
    return {
        "title_en": extracted.get("title_en") or "Uploaded Research Grant Notice",
        "title_bn": extracted.get("title_bn"),
        "issuing_agency": extracted.get("issuing_agency") or "Unknown Issuing Agency",
        "agency_type": extracted.get("source_type"),
        "deadline": parse_iso_date(extracted.get("deadline")),
        "funding_min": parse_decimal(extracted.get("funding_min")),
        "funding_max": parse_decimal(extracted.get("funding_max")),
        "currency": extracted.get("currency") or "BDT",
        "eligibility_types": extracted.get("eligibility_types") or [],
        "research_areas": extracted.get("research_areas") or [],
        "description_en": extracted.get("description_en"),
        "description_bn": extracted.get("description_bn"),
        "ai_confidence_score": extracted.get("overall_confidence") or 0.5,
        "ai_extracted_fields": {
            key: value
            for key, value in extracted.items()
            if key.endswith("_conf") or key in {"_extraction_note", "_ai_model"}
        },
    }
