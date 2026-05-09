import requests

url = "http://localhost:8000/api/upload"

# Create a dummy PDF file
with open("dummy.pdf", "wb") as f:
    f.write(b"%PDF-1.4\n%EOF")

with open("dummy.pdf", "rb") as f:
    files = {"files": ("dummy.pdf", f, "application/pdf")}
    data = {"session_id": "test_session_123"}
    
    response = requests.post(url, files=files, data=data)
    
print("Status Code:", response.status_code)
print("Response:", response.text)
