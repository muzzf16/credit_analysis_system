import cv2
import numpy as np
import sys
import os

# Add parent directory to path to allow absolute imports if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.clahe import apply_clahe
from utils.threshold import apply_adaptive_threshold
from utils.morphology import apply_morphology
from utils.deskew import deskew
from utils.resize import smart_resize

def process_ktp(image):
    """
    KTP Processing Pipeline:
    Grayscale -> CLAHE -> Resize
    """
    # 1. Grayscale conversion
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
        
    # 2. Contrast Normalization (CLAHE) - enhances faint text
    clahe_img = apply_clahe(gray, clip_limit=2.0, tile_grid_size=(8,8))
    
    # 3. Smart resize
    resized = smart_resize(clahe_img)
    
    # We return the high-contrast grayscale image.
    return resized
