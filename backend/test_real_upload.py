import requests
import os

url = "http://localhost:8000/api/upload"

pdf_path = "data/pdfs/chap_4_c73c02bded15.pdf"

if not os.path.exists(pdf_path):
    print("PDF not found!")
else:
    with open(pdf_path, "rb") as f:
        files = {"files": ("test.pdf", f, "application/pdf")}
        data = {"session_id": "test_session_123"}
        
        print("Uploading...")
        response = requests.post(url, files=files, data=data)
        
    print("Status Code:", response.status_code)
    print("Response:", response.text)
