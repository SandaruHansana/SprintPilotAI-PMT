import spacy
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

MODEL_NAME = "google/flan-t5-large"

class Resources:
    def __init__(self):
        self.nlp = None
        self.tokenizer = None
        self.model = None
        self.device = None

    def load(self):
        # spaCy
        self.nlp = spacy.load("en_core_web_sm")

        # FLAN-T5
        self.tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(
            MODEL_NAME,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
        )
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = self.model.to(self.device)

RES = Resources()
