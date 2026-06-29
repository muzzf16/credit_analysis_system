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
    RGB -> Red Channel -> CLAHE -> Adaptive Threshold -> Morphology -> Sharpen -> Deskew -> Resize -> Output
    """
    # Extract Red channel to remove blue watermark
    if len(image.shape) == 3:
        b, g, r = cv2.split(image)
        gray = r
    else:
        gray = image
        
    # Contrast Normalization (CLAHE)
    clahe_img = apply_clahe(gray, clip_limit=2.0, tile_grid_size=(8,8))
    
    # Adaptive Thresholding
    thresh = apply_adaptive_threshold(clahe_img, block_size=15, C=9)
    
    # Morphology Open and Close to remove noise and connect text
    m_open = apply_morphology(thresh, operation='open', kernel_size=(2,2), iterations=1)
    m_close = apply_morphology(m_open, operation='close', kernel_size=(2,2), iterations=1)
    
    # Sharpening
    kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
    sharpened = cv2.filter2D(m_close, -1, kernel)
    
    # Deskew
    deskewed = deskew(sharpened)
    
    # Smart resize
    final = smart_resize(deskewed)
    
    return final
