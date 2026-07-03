import cv2
import numpy as np
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.clahe import apply_clahe
from utils.deskew import deskew
from utils.resize import smart_resize

def process_shm(image, doc_type="shm"):
    """
    SHM Processing Pipeline branching by page type.
    - Cover & Pendaftaran: Use Green Channel (strips yellow watermarks/backgrounds).
    - Surat Ukur & Peta: Use KTP-style Grayscale (best for faint text on white paper).
    """
    if doc_type in ['shm_surat_ukur', 'shm_peta']:
        # --- KTP STYLE (Grayscale -> CLAHE -> Smart Resize) ---
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        clahe_img = apply_clahe(gray, clip_limit=2.0, tile_grid_size=(8, 8))
        deskewed = deskew(clahe_img)
        resized = smart_resize(deskewed)
        return resized
    else:
        # --- ORIGINAL GREEN CHANNEL STYLE (For Cover & Pendaftaran) ---
        if len(image.shape) == 3:
            b, g, r = cv2.split(image)
            gray = g
        else:
            gray = image.copy()
        # Bilateral Filter: smooth background noise (watermarks) but preserve sharp text edges
        bilateral = cv2.bilateralFilter(gray, d=5, sigmaColor=50, sigmaSpace=50)
        # Moderate CLAHE: enhance text contrast against the background
        clahe_img = apply_clahe(bilateral, clip_limit=2.0, tile_grid_size=(8, 8))
        deskewed = deskew(clahe_img)
        # Resize to 200% — upscale helps Tesseract read smaller fonts
        h, w = deskewed.shape[:2]
        resized = cv2.resize(deskewed, (w * 2, h * 2), interpolation=cv2.INTER_CUBIC)
        return resized
