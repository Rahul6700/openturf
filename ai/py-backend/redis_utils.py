from redis.commands.search.field import VectorField, TextField, TagField
from redis.commands.search.query import Query
from redis.commands.search.document import Document
import numpy as np
import logging
logger = logging.getLogger(__name__)

#upserting doc schema
def create_index(r, index_name="query_cache", dim=384):
    try:
        r.ft(index_name).info()
        logger.info("Redis index already exists.")
    except Exception:
        logger.info("Creating new Redis vector index.")
        r.ft(index_name).create_index([
            TagField("username"), 
            TextField("query"),
            TextField("response"),
            VectorField("embedding", "FLAT", {
                "TYPE": "FLOAT32",
                "DIM": dim,
                "DISTANCE_METRIC": "COSINE"
            }),
        ])
        logger.info("Redis index created.")

# this is how the schema looks
# {
#   "id": "user:rahul:query:-8039573495", #unique key      
#   "username": "rahul",                        
#   "query": "what languages does rahul use",    
#   "response": "Python, Go, C++",               
#   "embedding": [0.013, -0.038, ..., 0.115]#VectorField (384-dim)
# }

def store_cache(r, model, username, query, response_text, index_name="query_cache"):
    try:
        embedding = model.encode(query, normalize_embeddings=True).astype(np.float32).tobytes()
        doc_id = f"user:{username}:query:{hash(query)}"
        r.ft(index_name).add_document(
            doc_id,
            replace=True,
            partial=True,
            embedding=embedding,
            query=query,
            response=response_text,
            username=username
        )
        
        #setting ttl for the cache, 21,600 seconds (6 hours) now
        r.expire(doc_id, 21600)

        logger.info(f"Cached response for user '{username}' and query '{query}'")
    except Exception as e:
        logger.error(f"Failed to store cache: {str(e)}")


def search_cache(r, model, username, query, index_name="query_cache", threshold=0.15):
    try:
        embedding = model.encode(query, normalize_embeddings=True).astype(np.float32).tobytes()
        #performing a KNN search for the 5th closest neighbours
        knn_query = f"*=>[KNN 5 @embedding $vec_param AS score]"
        
        query_obj = Query(knn_query) \
            .return_fields("response", "score", "query", "username") \
            .sort_by("score") \
            .dialect(2)
        
        results = r.ft(index_name).search(query_obj, query_params={"vec_param": embedding})
        logger.info(f"Alternative search results: {results.total} documents found")
        
        if results.total > 0:
            for doc in results.docs:
                doc_username = getattr(doc, 'username', '')
                score = float(doc.score)
                logger.info(f"Doc username: '{doc_username}', score: {score}, query: '{getattr(doc, 'query', 'N/A')}'")
                
                if doc_username == username and score <= threshold:
                    logger.info(f"Cache hit with score: {score}")
                    logger.info(doc.response)
                    return {"response" : doc.response }
            
            logger.info(f"Cache miss (no matching user or score too high)")
        else:
            logger.info("Cache miss (no results found)")
            
        return None
        
    except Exception as e:
        logger.error(f"Error during alternative Redis search: {str(e)}")
        return None
