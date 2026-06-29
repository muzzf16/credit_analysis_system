import cv2
import numpy as np

def remove_shadow(image):
    """
    Removes shadows and uneven illumination from an image.
    Uses dilation and median blur to estimate background, then subtracts it.
    """
    if len(image.shape) == 3:
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()
        
    # Dilate the image to get the background (removes text)
    dilated_img = cv2.dilate(gray, np.ones((7, 7), np.uint8))
    
    # Apply median blur to smooth the background
    bg_img = cv2.medianBlur(dilated_img, 21)
    
    # Calculate the difference between original and background
    diff_img = 255 - cv2.absdiff(gray, bg_img)
    
    # Normalize the result
    norm_img = cv2.normalize(diff_img, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8UC1)
    
    return norm_img
