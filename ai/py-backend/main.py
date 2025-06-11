import os
import pinecone
from pymongo import MongoClient
from dotenv import load_dotenv
from google import genai
from sklearn.feature_extraction.text import TfidfVectorizer
from fastapi import FastAPI, Request, HTTPException

app = FastAPI()

@app.get("/")
def root():
    return {"hello" : "world"}

@app.post("/text")
async def process_text(request: Request, query: str):
    """
    This endpoint receives a text query and returns the closest match from the user's Pinecone index.
    """
    # Get the API key from the request header
    api_key = request.headers.get("Authorization")
    if not api_key:
        raise HTTPException(status_code=400, detail="API key is missing in the request header")

    # Getting the username from the API key
    user = users_collection.find_one({"apikey": api_key})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    username = user["username"]  # Username found and stored here
    pinecone_index_name = username  

    try:
        # Connect to the Pinecone index (or create)
        index = pc.Index(pinecone_index_name)

        def vectorize_query(query: str):
            vectorizer = TfidfVectorizer()
            vectors = vectorizer.fit_transform([query])
            vector = vectors.toarray()[0]
            return vector

        query_vector = vectorize_query(query)  

        # Search for the closest vectors in Pinecone
        results = index.query(
            vector=query_vector,
            top_k=5,  # Returns the top 5 closest matches 
            include_metadata=True
        )

        data = ""

        # Step 4: Combine the results into a single string
        if results and results.get("matches"):
            top_matches = [match["metadata"].get("text", "") for match in results["matches"]]  # Assuming "text" is the field in metadata
            big_string = " ".join(top_matches)  # Join the top 5 matches into a single string
            data = big_string
        else:
            data = ""  # No matches found

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying Pinecone: {str(e)}")

    prompt = f"""Context: You are an AI assistant trained on specific domain data provided below.
            You can only answer questions based on this data. If the answer to the question is not available in the provided data,
            reply with the word 'nil'. Make sure your response is concise and relevant to the provided data. If you can't find an answer within the data,
            do not try to generate an answer beyond it. Data Provided: {data}, User Query: {query}"""

    gemini_client = genai.Client(api_key=gemini_key)

    response = gemini_client.models.generate_content(
        model="gemini-2.0-flash", contents=prompt
    )
    
    return {"response": response}
