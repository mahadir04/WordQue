import asyncio
from backend.services.pdf_parser import process_pdf
from backend.services.doc_classifier import classify_document

def test():
    with open('dummy.pdf', 'rb') as f:
        content = f.read()
    print("Testing process_pdf...")
    try:
        doc_id, chunks, metadata = process_pdf(content, 'dummy.pdf')
        print(doc_id, len(chunks))
    except Exception as e:
        print("Error in process_pdf:", repr(e))

    print("Testing classify_document...")
    try:
        doc_type = classify_document("Hello world")
        print(doc_type)
    except Exception as e:
        print("Error in classify_document:", repr(e))

if __name__ == '__main__':
    test()
