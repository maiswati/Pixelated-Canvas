import numpy as np
import cv2
import pytesseract
import sys
import json
import re
from PIL import Image, ImageEnhance, ImageFilter

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

img = cv2.imread(sys.argv[1], 0)
template1 = cv2.imread('./img/whiteTemplate.jpg', 0)
template2 = cv2.imread('./img/black template 2.jpg', 0)

result1 = cv2.matchTemplate(img, template1, cv2.TM_CCORR_NORMED)
result2 = cv2.matchTemplate(img, template2, cv2.TM_CCORR_NORMED)
_, maxVal1, _, _ = cv2.minMaxLoc(result1)
_, maxVal2, _, _ = cv2.minMaxLoc(result2)
score = max(maxVal1, maxVal2)

pil_img = Image.open(sys.argv[1])

pil_img = pil_img.convert('L') 
pil_img = pil_img.filter(ImageFilter.SHARPEN)
enhancer = ImageEnhance.Contrast(pil_img)
pil_img = enhancer.enhance(2)

ocr_result = pytesseract.image_to_string(pil_img)

ocr_result = ocr_result.replace('\n', ' ')
ocr_result = re.sub(r'\s+', ' ', ocr_result)

amount_match = re.search(r'(₹|Rs\.?)?\s*([0-9][0-9,]*\.?\d{0,2})', ocr_result)
if amount_match:
    amt = amount_match.group(2)
    amt = amt.replace(',', '').replace(' ', '')

    if amt.startswith('2') and len(amt) > 4:
        amt = amt[1:]  

    amount = amt
else:
    amount = None

upi_match = re.search(r'([a-zA-Z0-9.\-_]+@[a-zA-Z]+)', ocr_result)
upi_id = upi_match.group(1) if upi_match else None

def fix_upi_id(upi_id):
    if upi_id:
        upi_id = re.sub(r'O(?=\d)', '0', upi_id)  
        upi_id = upi_id.replace(' ', '')          
    return upi_id

upi_id = fix_upi_id(upi_id)

output = {
    "score": score,
    "amount": amount,
    "upi_id": upi_id,
}

print(json.dumps(output))
