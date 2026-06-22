FROM node:20-slim

WORKDIR /app

# Install system dependencies (poppler-utils for PDF, tesseract-ocr for OCR, imagemagick for preprocessing)
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-ind \
    imagemagick \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "src/app.js"]
