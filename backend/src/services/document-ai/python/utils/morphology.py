import cv2
import numpy as np

def apply_morphology(image, operation='open', kernel_size=(3, 3), iterations=1):
    """
    Applies morphological operations (opening, closing, dilation, erosion).
    """
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, kernel_size)
    
    if operation == 'open':
        return cv2.morphologyEx(image, cv2.MORPH_OPEN, kernel, iterations=iterations)
    elif operation == 'close':
        return cv2.morphologyEx(image, cv2.MORPH_CLOSE, kernel, iterations=iterations)
    elif operation == 'dilate':
        return cv2.dilate(image, kernel, iterations=iterations)
    elif operation == 'erode':
        return cv2.erode(image, kernel, iterations=iterations)
    else:
        return image
