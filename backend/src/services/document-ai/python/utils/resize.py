import cv2

def smart_resize(image):
    """
    Smart resize based on DPI approximation for Tesseract.
    If width < 1200: upscale 2x.
    If width > 2500: resize to 2000px width.
    """
    h, w = image.shape[:2]
    
    if w < 1200:
        # Upscale 2x
        resized = cv2.resize(image, (w * 2, h * 2), interpolation=cv2.INTER_CUBIC)
    elif w > 2500:
        # Downscale to 2000 width
        new_w = 2000
        new_h = int((new_w / w) * h)
        resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
    else:
        resized = image
        
    return resized
