import cv2
import numpy as np

def deskew(image):
    # Convert to grayscale if it's not
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
        
    # Threshold the image, setting all foreground pixels to 255 and all background pixels to 0
    # Use bitwise_not to invert since we want foreground to be white for minAreaRect
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]
    
    # Grab the (x, y) coordinates of all pixel values that are greater than zero
    coords = np.column_stack(np.where(thresh > 0))
    
    # Compute the minimum bounding box for all points
    angle = cv2.minAreaRect(coords)[-1]
    
    # cv2.minAreaRect returns values in the range [-90, 0)
    # The angle indicates how much the bounding box needs to be rotated to become upright
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
        
    # Rotate the image to deskew it
    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    
    return rotated
