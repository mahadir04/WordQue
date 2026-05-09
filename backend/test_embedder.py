import asyncio
from services.embedder import get_vector_store

async def test_embed():
    print("Getting store...")
    store = get_vector_store()
    print("Store initialized. Chunks:", len(store.chunks))
    
    chunks = [{"text": "Hello world", "doc_id": "1", "filename": "test.pdf", "page": 1, "chunk_index": 0}]
    meta = {"doc_id": "1", "filename": "test.pdf"}
    
    print("Adding chunk...")
    await store.add_chunks_async(chunks, meta)
    print("Added successfully!")
    
if __name__ == "__main__":
    asyncio.run(test_embed())
