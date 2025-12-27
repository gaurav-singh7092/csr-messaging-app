import re
from typing import Tuple
from ..models import MessagePriority

# Keywords and patterns for priority detection
URGENT_KEYWORDS = [
    # Loan-related urgent terms
    "loan approval", "loan disbursement", "disburse", "disbursed", "when will my loan",
    "loan status", "waiting for loan", "need loan urgently", "urgent loan",
    "loan pending", "loan delay", "delayed loan", "loan rejection", "rejected loan",
    "appeal", "reapply",
    
    # Account access issues
    "cannot login", "can't login", "locked out", "account blocked", "suspended",
    "frozen account", "cannot access", "can't access", "password reset", "otp not received",
    "verification failed",
    
    # Financial distress
    "emergency", "urgent", "asap", "immediately", "right now", "desperate",
    "need money", "financial emergency", "medical emergency", "hospital",
    
    # Payment issues
    "payment failed", "transaction failed", "money deducted", "double charged",
    "wrong amount", "refund", "reversal", "missing payment", "payment stuck",
    
    # Fraud/Security
    "fraud", "scam", "hacked", "unauthorized", "stolen", "suspicious activity",
    "security breach", "identity theft",
    
    # Deadline related
    "deadline", "due date", "overdue", "late fee", "penalty", "expires today",
    "last day"
]

HIGH_PRIORITY_KEYWORDS = [
    # Loan inquiries
    "loan", "borrow", "credit", "emi", "repayment", "interest rate",
    "loan amount", "eligibility", "apply for loan",
    
    # Account issues
    "account problem", "update details", "change phone", "change email",
    "kyc", "verification", "document upload",
    
    # Payment related
    "payment", "transfer", "send money", "receive money", "transaction",
    "balance", "statement",
    
    # Complaints
    "complaint", "issue", "problem", "not working", "error", "bug", "glitch",
    "disappointed", "frustrated", "angry", "unhappy"
]

MEDIUM_PRIORITY_KEYWORDS = [
    # General inquiries
    "how to", "help", "guide", "tutorial", "information", "details",
    "question", "query", "inquiry",
    
    # Feature related
    "feature", "option", "setting", "preference", "notification",
    
    # Account management
    "profile", "update", "change", "modify"
]

LOW_PRIORITY_KEYWORDS = [
    # Feedback
    "feedback", "suggestion", "recommend", "improve",
    "thank you", "thanks", "appreciate", "great service",
    "good", "excellent", "wonderful",
    
    # General
    "hi", "hello", "hey", "good morning", "good evening"
]


def detect_priority(message: str) -> Tuple[MessagePriority, float]:
    """
    Detect the priority of a message based on keywords and patterns.
    Returns a tuple of (priority, confidence_score)
    """
    message_lower = message.lower()
    
    # Check for urgent keywords
    urgent_matches = sum(1 for keyword in URGENT_KEYWORDS if keyword in message_lower)
    if urgent_matches >= 2 or any(keyword in message_lower for keyword in ["emergency", "fraud", "scam", "hacked", "urgent"]):
        return MessagePriority.URGENT, min(0.9 + (urgent_matches * 0.02), 1.0)
    
    # Check for high priority keywords
    high_matches = sum(1 for keyword in HIGH_PRIORITY_KEYWORDS if keyword in message_lower)
    if high_matches >= 2 or urgent_matches >= 1:
        confidence = min(0.7 + (high_matches * 0.05) + (urgent_matches * 0.1), 0.89)
        return MessagePriority.HIGH, confidence
    
    # Check for medium priority keywords
    medium_matches = sum(1 for keyword in MEDIUM_PRIORITY_KEYWORDS if keyword in message_lower)
    if medium_matches >= 1 or high_matches >= 1:
        confidence = min(0.5 + (medium_matches * 0.05) + (high_matches * 0.1), 0.69)
        return MessagePriority.MEDIUM, confidence
    
    # Check for low priority keywords
    low_matches = sum(1 for keyword in LOW_PRIORITY_KEYWORDS if keyword in message_lower)
    if low_matches >= 1:
        return MessagePriority.LOW, min(0.3 + (low_matches * 0.05), 0.49)
    
    # Default to medium priority
    return MessagePriority.MEDIUM, 0.5


def analyze_sentiment(message: str) -> dict:
    """
    Simple sentiment analysis based on keywords.
    Returns sentiment score and detected emotions.
    """
    message_lower = message.lower()
    
    positive_words = ["thank", "thanks", "appreciate", "great", "excellent", "wonderful", 
                      "good", "happy", "satisfied", "helpful", "amazing", "love"]
    negative_words = ["angry", "frustrated", "disappointed", "upset", "terrible", "worst",
                      "horrible", "hate", "annoying", "useless", "pathetic", "disgusting"]
    urgent_words = ["urgent", "asap", "immediately", "emergency", "desperate", "help"]
    
    positive_count = sum(1 for word in positive_words if word in message_lower)
    negative_count = sum(1 for word in negative_words if word in message_lower)
    urgent_count = sum(1 for word in urgent_words if word in message_lower)
    
    # Calculate sentiment score (-1 to 1)
    total_words = max(positive_count + negative_count, 1)
    sentiment_score = (positive_count - negative_count) / total_words
    
    return {
        "score": sentiment_score,
        "positive_indicators": positive_count,
        "negative_indicators": negative_count,
        "urgency_indicators": urgent_count,
        "overall": "positive" if sentiment_score > 0.2 else "negative" if sentiment_score < -0.2 else "neutral"
    }


def extract_keywords(message: str) -> list:
    """
    Extract important keywords from the message for categorization.
    """
    message_lower = message.lower()
    
    all_keywords = (URGENT_KEYWORDS + HIGH_PRIORITY_KEYWORDS + 
                    MEDIUM_PRIORITY_KEYWORDS + LOW_PRIORITY_KEYWORDS)
    
    found_keywords = [keyword for keyword in all_keywords if keyword in message_lower]
    return list(set(found_keywords))[:10]  # Return up to 10 unique keywords
