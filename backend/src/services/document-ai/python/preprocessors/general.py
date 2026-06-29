import cv2
import numpy as np
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.clahe import apply_clahe
from utils.threshold import apply_adaptive_threshold
from utils.morphology import apply_morphology
from utils.deskew import deskew
from utils.resize import smart_resize
from utils.shadow import remove_shadow

def process_general(image):
    """
    General Processing Pipeline:
    Color -> Gray -> CLAHE -> Bilateral Filter -> Adaptive Threshold -> Morphology -> Deskew -> Resize -> Output
    """
    # Grayscale
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
        
    # Contrast Normalization (CLAHE)
    clahe_img = apply_clahe(gray, clip_limit=2.0, tile_grid_size=(8,8))
    
    # Noise Removal (Bilateral Filter preserves edges better than Gaussian)
    denoised = cv2.bilateralFilter(clahe_img, 9, 75, 75)
    
    # Adaptive Thresholding
    thresh = apply_adaptive_threshold(denoised, block_size=15, C=9)
    
    # Morphology to clean up noise
    cleaned = apply_morphology(thresh, operation='open', kernel_size=(2,2), iterations=1)
    
    # Deskew
    deskewed = deskew(cleaned)
    
    # Smart resize
    final = smart_resize(deskewed)
    
    return final
