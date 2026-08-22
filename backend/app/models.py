from pydantic import BaseModel, HttpUrl
from typing import List, Optional

class ScanRequest(BaseModel):
    url: str

class TopFeature(BaseModel):
    label: str
    weight: float
    direction: str # "risky" | "safe"

class ScanResponse(BaseModel):
    input_url: str
    final_url: str
    risk_score: int
    risk_tier: str # "safe" | "suspicious" | "phishing"
    ml_prediction: str # "legitimate" | "phishing"
    ml_confidence: float
    reputation_hit: bool
    top_features: List[TopFeature]
    response_time_ms: int

class AdversarialRequest(BaseModel):
    url: str

class AdversarialResponse(BaseModel):
    original: ScanResponse
    variants: List[ScanResponse]
