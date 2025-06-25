import os
import pinecone
from pymongo import MongoClient
from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec
from google import genai
from sklearn.feature_extraction.text import TfidfVectorizer
from fastapi import FastAPI, Request, HTTPException, UploadFile, File
from pydantic import BaseModel
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
import fitz  
from sentence_transformers import SentenceTransformer
import logging
import re
import redis
from openai import OpenAI as OpenRouterClient

logging.basicConfig(
    level=logging.INFO,  # You can use DEBUG for more verbosity
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


app = FastAPI()

#cors middleware cuz backend and frontend are running on localhost for now
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    model : str

@app.get("/")
def root():
    return {"hello" : "world"}

@app.post("/text")
async def process_text(request: Request, query_request: QueryRequest):
    
    api_key = request.headers.get("Authorization")
    if not api_key:
        raise HTTPException(status_code=400, detail="API key is missing in the request header")

    user = users_collection.find_one({"apikey": api_key})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    username = user["username"]
    pinecone_index_name = username  
    selected_model = query_request.model

    try:
        logger.info("Initializing Pinecone index.")
        index = pc.Index(pinecone_index_name)

        logger.info("Loading SentenceTransformer model.")
        model = SentenceTransformer("all-MiniLM-L6-v2")

        query = query_request.query
        logger.info(f"Query received: {query}")

        query_vector = model.encode(query).tolist()
        logger.info(f"Query vector length: {len(query_vector)}")

        logs_collection.insert_one({
            "type" : "query",
            "username" : username,
            "apikey" : api_key,
            "text" : query,
            "model" : selected_model,
            "timestamp" : datetime.utcnow().isoformat()
        })

        logger.info("Querying Pinecone index.")
        results = index.query(
            vector=query_vector,
            top_k=5,
            include_metadata=True
        )

        data = ""

        if results and results.matches:
            top_matches = [match.metadata.get("text", "") if match.metadata else "" for match in results.matches]
            big_string = " ".join(top_matches)
            data = big_string

        else:
            logger.info("No matches found.")
            data = ""  

    except Exception as e:
        logger.info(f"Error querying Pinecone: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error querying Pinecone: {str(e)}")

    prompt = f"""Context: You are an AI assistant trained on specific domain data provided below.
            You can only answer questions based on this data. If the answer to the question is not available in the provided data,
            reply with the word 'nil'. Make sure your response is concise and relevant to the provided data, but
            also maintain a friendly tone and behave like a friendly and helpful assistant. Dont just
            spit out points bluntly, explain little .If you can't find an answer within the data,
            do not try to generate an answer beyond it. Do NOT use special formatting or hidden tokens like ◁think▷. 
            Data Provided: {data}, User Query: {query}"""
    prompt = f"""
             You are an AI assistant that can ONLY answer using the information provided below.

             Strict Rules:
             1. If the answer to the user's question is NOT explicitly available in the provided data, respond with exactly: nil
             2. Do NOT attempt to guess, elaborate, or make up any information.
             3. Do NOT apologize or explain why you can't answer.
             4. Do NOT rephrase or summarize the query.
             5. Do NOT use any formatting or special tokens.
             Be concise, friendly, and factual — but NEVER respond outside the bounds of the given data.
             --- Data Start ---
             {data}
             --- Data End ---
             --- User Query ---
             {query}
             """
                
    try:
        if selected_model == "mistral":
            model_id = "mistralai/mistral-small-3.2-24b-instruct:free"
        elif selected_model == "deepseek":
            model_id = "deepseek/deepseek-r1-0528-qwen3-8b:free"
        else:
            model_id = None

        if model_id:
            logger.info('using',model_id)
            openrouter_client = OpenRouterClient(
                base_url="https://openrouter.ai/api/v1",
                api_key=os.getenv("OPENAI_API_KEY")
            )
            response = openrouter_client.chat.completions.create(
                model=model_id,
                messages=[{"role": "user", "content": prompt}]
            )
            response_text = response.choices[0].message.content.strip()

        else:
            logger.info("Using Gemini model.")
            gemini_client = genai.Client(api_key=gemini_key)
            response = gemini_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
            response_text = response.candidates[0].content.parts[0].text.strip()

        if response_text == 'nil':
            logger.info("Model returned 'nil', replacing with fallback user message.")
            response_text = user["message"]

    except Exception as e:
        logger.error(f"Error from LLM: {str(e)}")
        response_text = user["message"]

    logs_collection.insert_one({
        "type": "response",
        "username": username,
        "apikey": api_key,
        "text": response_text,
        "model" :selected_model,
        "timestamp": datetime.utcnow().isoformat()
    })

    return {"response": response_text}


@app.post("/upload-pdf")
async def upload_pdf(request: Request, file: UploadFile = File(...)):

    api_key = request.headers.get("Authorization")
    if not api_key:
        raise HTTPException(status_code=400, detail="API key is missing in the request header")

    #using the apikey to map the corresponding username
    user = users_collection.find_one({"apikey": api_key})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    username = user["username"]  #username found and stored here
    pinecone_index_name = username

    temp_path = f"/tmp/{file.filename}"
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    doc = fitz.open(temp_path)
    text = "\n".join(page.get_text() for page in doc)
    doc.close()
    os.remove(temp_path)

    if not text.strip():
        raise HTTPException(status_code=400, detail="The PDF appears to be empty or unreadable.")

    try:
    # Split the text into chunks -> chunk size = 500 with overlap of 50
        chunk_size = 500
        overlap = 50
        chunks = []
        start = 0
        while start < len(text):
            end = min(start + chunk_size, len(text))
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            start += chunk_size - overlap
        logger.info("split into chunks")

        model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info('finished loading model')

        vectors = []

        #sanitizing the file so that the model does not crash
        safe_filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', file.filename)

        for i, chunk in enumerate(chunks):
            embedding = model.encode(chunk).tolist()
            vectors.append({
                "id": f"{safe_filename}-chunk-{i}",
                "values": embedding,
                    "metadata": {
                        "text": chunk 
                    }
            })
        logger.info('put chuks in the array')

        index = pc.Index(pinecone_index_name)
        index.upsert(vectors=vectors)# make sure `index` is defined from pinecone.Index(...)
        logger.info('added to db')
        return "Successfully uploaded and stored embeddings."

    except Exception as e:
        logger.error(f"Exception in upload_pdf: {e}", exc_info=True)
        logger.info(str(e))
        raise HTTPException(status_code=500, detail="Internal server error. Try again later.")

