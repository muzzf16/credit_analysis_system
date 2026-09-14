import os
import tempfile
from typing import Any

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import JSONResponse
from paddleocr import PaddleOCR

app = FastAPI(title='Credit Analysis PaddleOCR Worker', version='1.0.0')

DEVICE = os.getenv('PADDLE_DEVICE', 'gpu:0')
LANG = os.getenv('PADDLE_LANG', 'en')

print(f'[PaddleOCR Worker] Initializing device={DEVICE}, lang={LANG}')
ocr = PaddleOCR(lang=LANG, device=DEVICE)
print('[PaddleOCR Worker] Ready')


def to_builtin(value: Any):
    if hasattr(value, 'tolist'):
        return value.tolist()
    if isinstance(value, dict):
        return {str(k): to_builtin(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [to_builtin(v) for v in value]
    return value


@app.get('/health')
def health():
    return {'ok': True, 'engine': 'paddleocr', 'device': DEVICE, 'lang': LANG}


@app.post('/ocr')
async def ocr_document(file: UploadFile = File(...), type: str = Form('general')):
    temp_path = None
    try:
        suffix = os.path.splitext(file.filename or '')[1] or '.bin'
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            temp_path = tmp.name
            tmp.write(await file.read())

        results = list(ocr.predict(temp_path))
        if not results:
            return JSONResponse(status_code=422, content={'success': False, 'error': 'Tidak ada hasil OCR.'})

        result = results[0]
        data = result['res'] if isinstance(result, dict) and 'res' in result else result

        rec_texts = to_builtin(data.get('rec_texts', []))
        rec_scores = to_builtin(data.get('rec_scores', []))
        rec_boxes = to_builtin(data.get('rec_boxes', []))

        scores = [float(x) for x in rec_scores if x is not None]
        confidence = sum(scores) / len(scores) if scores else 0.0

        return {
            'success': True,
            'engineUsed': 'paddleocr',
            'type': type,
            'rec_texts': rec_texts,
            'rec_scores': rec_scores,
            'rec_boxes': rec_boxes,
            'confidence': confidence,
            'count': len(rec_texts)
        }
    except Exception as exc:
        return JSONResponse(status_code=500, content={'success': False, 'error': str(exc)})
    finally:
        if temp_path:
            try:
                os.unlink(temp_path)
            except OSError:
                pass
