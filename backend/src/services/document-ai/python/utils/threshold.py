import cv2

def apply_adaptive_threshold(image, block_size=15, C=9):
    """
    Applies Adaptive Gaussian Thresholding to an image.
    The image must be grayscale.
    """
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
        
    thresh = cv2.adaptiveThreshold(
        gray, 
        255, 
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY, 
        block_size, 
        C
    )
    return thresh
