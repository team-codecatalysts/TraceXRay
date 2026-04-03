"""
Stage 1: Scam-Brain Module
OCR & Psychographic Analysis for Kavach-SMS
"""
import bisect
from typing import List, Dict, Optional
from .ocr_processor import OCRProcessor
from .entity_extractor import EntityExtractor
from .gemini_categorizer import GeminiCategorizer


class ScamBrain:
    """Main orchestrator for Stage 1 processing"""

    def __init__(self, gemini_api_key: str = None):
        self.ocr              = OCRProcessor()
        self.entity_extractor = EntityExtractor()
        self.categorizer      = GeminiCategorizer(gemini_api_key)
        self.urgency_lexicon  = self._load_urgency_lexicon()

    # ------------------------------------------------------------------ #
    #  LEXICON                                                             #
    # ------------------------------------------------------------------ #

    def _load_urgency_lexicon(self) -> Dict[str, float]:
        """
        Only phrases that are genuinely rare in legitimate messages.

        Removed:
          - Single common words: 'now', 'today', 'alert', 'warning',
            'important', 'attention', 'detected', 'detect', 'fine',
            'outstanding', 'expired', 'restricted', 'validate',
            'authenticate', 'investigation', 'urgent', 'critical',
            'emergency', 'block', 'suspend' — all appear routinely in
            legitimate OTP, transaction, and service messages.

        Kept / added:
          - Multi-word phrases that are specific to scam pressure tactics
          - Single words only when they are highly domain-specific to scams
            (e.g. 'tinyurl', 'bit.ly', 'cyber crime', 'fraudulent')
        """
        return {
            # single words
            'blocked':      0.95,
            'suspended':    0.95,
            'terminated':   0.92,
            'deactivated':  0.90,
            'unauthorized': 0.80,
            'fraudulent':   0.82,
            'hacked':       0.88,
            'breached':     0.85,
            'urgent':       0.85,
            'immediately':  0.85,
            'asap':         0.75,
            'tinyurl':      0.95,
            'restricted':   0.78,
            'compromised':  0.88,
            'expired':      0.80,
            'penalty':      0.72,
            'arrested':     0.92,
            'warrant':      0.93,

            # urgency phrases
            'last warning':         0.92,
            'final notice':         0.90,
            'immediate action':     0.90,
            'act now':              0.87,
            'within 30 minutes':    0.93,
            'within 24 hours':      0.82,
            'without delay':        0.75,

            # legal / authority
            'legal action':             0.85,
            'police complaint':         0.90,
            'court case':               0.88,
            'cyber crime':              0.85,
            'arrest warrant':           0.99,
            'fir will be filed':        0.99,
            'rbi notice':               0.97,
            'trai notice':              0.97,
            'income tax notice':        0.93,
            'government of india':      0.90,

            # account threats
            'security breach':              0.90,
            'unauthorized access':          0.88,
            'your account has been blocked': 0.97,
            'your account will be blocked':  0.97,
            'account has been compromised':  0.97,
            'sim will be blocked':           0.98,
            'number will be deactivated':    0.97,

            # credential harvesting
            'share your otp':    0.99,
            'share your pin':    0.99,
            'share your cvv':    0.99,
            'share your password': 0.99,
            'provide your aadhaar': 0.97,
            'provide your pan':  0.97,

            # financial scams
            'lottery winner':    0.99,
            'you have won':      0.97,
            'claim your prize':  0.97,
            'prize money':       0.95,
            'cashback pending':  0.82,
            'refund on hold':    0.83,
            'emi bounced':       0.85,
            'cheque bounced':    0.85,

            # malware / device
            'your device is infected': 0.99,
            'virus detected':          0.95,
            'remote access':           0.88,

            # suspicious links
            'bit.ly':               0.95,
            'click here to verify': 0.93,
            'login to verify':      0.90,
        }

    # ------------------------------------------------------------------ #
    #  PUBLIC ENTRY POINT                                                  #
    # ------------------------------------------------------------------ #

    async def process_sms(self, image_data: bytes, session_id: str) -> Dict:
        try:
            ocr_result = self.ocr.process_image(image_data)
            words      = ocr_result.get('words', [])

            if not words:
                return self._create_empty_response(session_id)

            # Rebuild searchable text from the word list so char positions
            # in scan_text are guaranteed to match char_start in words.
            scan_text    = ' '.join(w['text'] for w in words)
            display_text = ocr_result.get('extracted_text', '') or scan_text

            entities = self.entity_extractor.extract_entities(display_text)

            word_starts = sorted(
                [(w['char_start'], idx) for idx, w in enumerate(words)],
                key=lambda t: t[0]
            )
            psychographic = self._analyze_psychographic(
                scan_text, words, word_starts
            )

            category_result = await self.categorizer.categorize(
                display_text,
                entities,
                psychographic['urgency_score'],
            )

            return self._build_final_response(
                session_id=session_id,
                extracted_text=display_text,
                entities=entities,
                psychographic=psychographic,
                category_result=category_result,
            )

        except Exception as e:
            print(f"Stage 1 Processing Error: {e}")
            return self._create_error_response(session_id, str(e))

    # ------------------------------------------------------------------ #
    #  PSYCHOGRAPHIC ANALYSIS                                              #
    # ------------------------------------------------------------------ #

    def _analyze_psychographic(
        self,
        scan_text:   str,
        words:       List[Dict],
        word_starts: List[tuple],
    ) -> Dict:
        lower_text      = scan_text.lower()
        flagged_phrases = []
        heatmap_data    = []
        seen_positions  = set()
        total_intensity = 0.0
        MIN_INTENSITY_TO_FLAG = 0.85  # ignore anything below this

        for phrase, base_intensity in self.urgency_lexicon.items():
            if base_intensity < MIN_INTENSITY_TO_FLAG:
                continue 
            start = 0
            while True:
                idx = lower_text.find(phrase, start)
                if idx == -1:
                    break

                key = (phrase, idx)
                if key not in seen_positions:
                    bbox = self._find_phrase_bbox(
                        phrase, idx, words, word_starts
                    )
                    if bbox:
                        intensity = self._adjust_intensity(
                            base_intensity, phrase, scan_text[idx: idx + 60]
                        )
                        flagged_phrases.append(phrase)
                        heatmap_data.append({
                            'text':      phrase,
                            'intensity': intensity,
                            'position':  [
                                bbox['x0'], bbox['y0'],
                                bbox['x1'], bbox['y1'],
                            ],
                        })
                        total_intensity += intensity
                    seen_positions.add(key)

                start = idx + 1

        # After the for-loop in _analyze_psychographic, before building urgency_score:
        MAX_HIGHLIGHTS = 3
        heatmap_data.sort(key=lambda x: x['intensity'], reverse=True)
        heatmap_data = heatmap_data[:MAX_HIGHLIGHTS]

        # Recalculate total_intensity from the trimmed list
        total_intensity = sum(h['intensity'] for h in heatmap_data)
        urgency_score = 0
        if heatmap_data:
            avg_intensity = total_intensity / len(heatmap_data)
            urgency_score = min(100, int(avg_intensity * 100))

        return {
            'urgency_score':   urgency_score,
            'flagged_phrases': list(dict.fromkeys(flagged_phrases)),
            'heatmap_data':    heatmap_data,
        }

    # ------------------------------------------------------------------ #
    #  BBOX LOOKUP                                                         #
    # ------------------------------------------------------------------ #

    def _find_phrase_bbox(self, phrase, start_idx, words, word_starts):
        if not words:
            return None

        phrase_tokens = phrase.split()
        
        # Single-word phrase — fast path
        if len(phrase_tokens) == 1:
            keys = [ws[0] for ws in word_starts]
            pos = bisect.bisect_right(keys, start_idx) - 1
            if pos < 0:
                return None
            _, word_idx = word_starts[pos]
            if word_idx >= len(words):
                return None
            b = words[word_idx]['bbox']
            return {'x0': b['x0'], 'y0': b['y0'], 'x1': b['x1'], 'y1': b['y1']}

        # Multi-word: require CONSECUTIVE matches only
        keys = [ws[0] for ws in word_starts]
        pos = bisect.bisect_right(keys, start_idx) - 1
        if pos < 0:
            pos = 0

        _, word_idx = word_starts[pos]

        for start_w in range(word_idx, len(words)):
            matched = []
            for p_tok_idx, p_tok in enumerate(phrase_tokens):
                w_idx = start_w + p_tok_idx
                if w_idx >= len(words):
                    break
                ocr_word = words[w_idx]['text'].lower()
                # Require the token to be substantially present
                if p_tok not in ocr_word and ocr_word not in p_tok:
                    break
                matched.append(w_idx)

            if len(matched) == len(phrase_tokens):
                bboxes = [words[i]['bbox'] for i in matched]
                return {
                    'x0': min(b['x0'] for b in bboxes),
                    'y0': min(b['y0'] for b in bboxes),
                    'x1': max(b['x1'] for b in bboxes),
                    'y1': max(b['y1'] for b in bboxes),
                }

        return None
    # ------------------------------------------------------------------ #
    #  INTENSITY ADJUSTMENT                                                #
    # ------------------------------------------------------------------ #

    def _adjust_intensity(
        self,
        base_intensity: float,
        phrase:         str,
        context:        str,
    ) -> float:
        intensity     = base_intensity
        context_lower = context.lower()

        if any(w in phrase for w in ['police', 'court', 'legal', 'fir', 'arrest']):
            intensity = min(1.0, intensity + 0.10)
        if any(w in phrase for w in ['minute', 'hour', '30', '24']):
            intensity = min(1.0, intensity + 0.05)
        if any(w in phrase for w in ['blocked', 'suspended', 'terminated', 'deactivated']):
            intensity = min(1.0, intensity + 0.07)
        if any(w in context_lower for w in ['bank', 'account', 'money', 'payment', 'otp']):
            intensity = min(1.0, intensity + 0.05)
        if any(w in context_lower for w in ['immediately', 'urgent', 'emergency', 'now']):
            intensity = min(1.0, intensity + 0.03)

        return round(intensity, 2)

    # ------------------------------------------------------------------ #
    #  RESPONSE BUILDERS                                                   #
    # ------------------------------------------------------------------ #

    def _build_final_response(
        self,
        session_id:      str,
        extracted_text:  str,
        entities:        Dict,
        psychographic:   Dict,
        category_result: Dict,
    ) -> Dict:
        return {
            "stage1_output": {
                "extracted_text":   extracted_text,
                "extracted_urls":   entities.get('urls', []),
                "extracted_phones": entities.get('phones', []),
                "category":         category_result.get('category', 'Other'),
                "urgency_score":    psychographic.get('urgency_score', 0),
                "flagged_phrases":  psychographic.get('flagged_phrases', []),
                "heatmap_data":     psychographic.get('heatmap_data', []),
            }
        }

    def _create_empty_response(self, session_id: str) -> Dict:
        return {
            "stage1_output": {
                "extracted_text":   "",
                "extracted_urls":   [],
                "extracted_phones": [],
                "category":         "Other",
                "urgency_score":    0,
                "flagged_phrases":  [],
                "heatmap_data":     [],
            }
        }

    def _create_error_response(self, session_id: str, error: str) -> Dict:
        print(f"Stage 1 Error for session {session_id}: {error}")
        return self._create_empty_response(session_id)