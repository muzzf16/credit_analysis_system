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
from utils.shadow import remove_shadow

def process_shm(image):
    """
    SHM (Sertifikat Hak Milik) Processing Pipeline:
    Extract Green Channel -> Remove Shadow -> CLAHE -> Adaptive Threshold -> Morph -> Deskew -> Resize
    """
    # Extract Green channel to minimize the green/yellow patterned background and Garuda watermark
    if len(image.shape) == 3:
        b, g, r = cv2.split(image)
        gray = g
    else:
        gray = image
        
    # Remove shadows and uneven illumination (critical for folded/scanned SHM)
    no_shadow = remove_shadow(gray)
    
    # Contrast Normalization (CLAHE) to enhance text
    clahe_img = apply_clahe(no_shadow, clip_limit=2.0, tile_grid_size=(8,8))
    
    # Adaptive Thresholding
    thresh = apply_adaptive_threshold(clahe_img, block_size=21, C=10)
    
    # Morphology Open to remove small noise dots
    cleaned = apply_morphology(thresh, operation='open', kernel_size=(2,2), iterations=1)
    
    # Deskew to fix slight rotation
    deskewed = deskew(cleaned)
    
    # Smart resize to normalize resolution for OCR engines
    final = smart_resize(deskewed)
    
    return final
