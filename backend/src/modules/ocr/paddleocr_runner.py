import sys
from pathlib import Path

import numpy as np
from PIL import Image

try:
    from paddleocr import PaddleOCR
except Exception as exc:  # pragma: no cover - runtime dependency check
    sys.stderr.write(f"Failed to import paddleocr: {exc}\n")
    sys.exit(2)


def main():
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: paddleocr_runner.py <image_path>\n")
        sys.exit(2)

    image_path = Path(sys.argv[1]).resolve()
    if not image_path.exists():
        sys.stderr.write(f"Image path not found: {image_path}\n")
        sys.exit(2)

    try:
        ocr = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
        image = Image.open(image_path).convert("RGB")
        result = ocr.ocr(np.array(image), cls=True)

        lines = []
        if result:
            for line in result:
                if line and len(line) > 1 and line[1]:
                    text = str(line[1][0]).strip()
                    if text:
                        lines.append(text)

        sys.stdout.write("\n".join(lines))
    except Exception as exc:  # pragma: no cover - runtime failure handling
        sys.stderr.write(f"PaddleOCR failed: {exc}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
