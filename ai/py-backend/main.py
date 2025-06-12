import os
import pinecone
from pymongo import MongoClient
from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec
from google import genai
from sklearn.feature_extraction.text import TfidfVectorizer
from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()

load_dotenv('../../.env')

pc = Pinecone(
    api_key=os.getenv("PINECONE_API_KEY"),
    environment="us-east1-gcp" 
) 
gemini_key = os.getenv("GEMINI_API_KEY")
mongo_client = MongoClient(os.getenv("MONGODB_URI"))
db = mongo_client.get_database("widget")  
users_collection = db.get_collection("users")
logs_collection = db.get_collection("logs")

class QueryRequest(BaseModel):
    query : str

@app.get("/")
def root():
    return {"hello" : "world"}

@app.post("/text")
async def process_text(request: Request, query_request: QueryRequest):
    
    api_key = request.headers.get("Authorization")
    if not api_key:
        raise HTTPException(status_code=400, detail="API key is missing in the request header")

    #using the apikey to map the corresponding username
    user = users_collection.find_one({"apikey": api_key})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    username = user["username"]  #username found and stored here
    pinecone_index_name = username  

    try:
        index = pc.Index(pinecone_index_name)

        def vectorize_query(query: str):
            vectorizer = TfidfVectorizer()
            vectors = vectorizer.fit_transform([query])
            vector = vectors.toarray()[0]
            return vector
        
        query = query_request.query
        query_vector = vectorize_query(query).tolist() 

        logs_collection.insert_one({
            "type" : "query",
            "username" : username,
            "apikey" : api_key,
            "query" : query,
            "timestamp" : datetime.utcnow().isoformat()
        })

        results = index.query(
            vector=query_vector,
            top_k=5,  #the top 5 closest matches 
            include_metadata=True
        )

        data = ""

        if results and results.get("matches"):
            top_matches = [match["metadata"].get("text", "") for match in results["matches"]]  #assuming "text" is the field in metadata
            big_string = " ".join(top_matches)  #'big_streing' is a big string of all top 5 matches
            data = big_string
        else:
            data = ""  

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
    try:
        response_text = response.candidates[0].content.parts[0].text.strip()
    except Exception:
        response_text = "nil"

    logs_collection.insert_one({
        "type" : "response",
        "username" : username,
        "apikey" : api_key,
        "response" : response_text,
        "timestamp" : datetime.utcnow().isoformat()
    })
    
    return {"response": response_text}
