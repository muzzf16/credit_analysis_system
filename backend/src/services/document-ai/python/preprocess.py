import cv2
import sys
import os
import argparse

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from preprocessors.ktp import process_ktp
from preprocessors.general import process_general

def main():
    parser = argparse.ArgumentParser(description="Document Image Preprocessor for OCR")
    parser.add_argument('--input', required=True, help="Path to input image")
    parser.add_argument('--output', required=True, help="Path to output image")
    parser.add_argument('--type', required=True, help="Document type (ktp, general, etc)")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        print(f"Error: Input file not found {args.input}")
        sys.exit(1)
        
    # Load image
    image = cv2.imread(args.input)
    if image is None:
        print(f"Error: Failed to load image {args.input}")
        sys.exit(1)
        
    doc_type = args.type.lower()
    
    try:
        # Route to appropriate preprocessor
        if doc_type == 'ktp':
            processed = process_ktp(image)
        else:
            processed = process_general(image)
            
        # Save output
        cv2.imwrite(args.output, processed)
        print(f"Success: Processed {doc_type} saved to {args.output}")
        sys.exit(0)
    except Exception as e:
        print(f"Error during preprocessing: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
