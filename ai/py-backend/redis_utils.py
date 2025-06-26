from redis.commands.search.field import VectorField, TextField
from redis.commands.search.query import Query
from redis.commands.search.document import Document
import logging

logger = logging.getLogger(__name__)

# 🔁 Index creation/upsert (run once)
def create_index(r, index_name="query_cache", dim=384):
    try:
        r.ft(index_name).info()
        logger.info("Redis index already exists.")
    except Exception:
        logger.info("Creating new Redis vector index.")
        r.ft(index_name).create_index([
            TagField("username"),  # For per-user filtering
            TextField("query"),
            TextField("response"),
            VectorField("embedding", "FLAT", {
                "TYPE": "FLOAT32",
                "DIM": dim,
                "DISTANCE_METRIC": "COSINE"
            }),
        ])
        logger.info("Redis index created.")

def store_cache(r, model, username, query, response_text, index_name="query_cache"):
    embedding = model.encode(query, normalize_embeddings=True).astype("float32").tobytes()
    doc_id = f"user:{username}:query:{abs(hash(query))}"

    try:
        r.ft(index_name).add_document(
            doc_id,
            username=username,
            query=query,
            response=response_text,
            embedding=embedding
        )
        logger.info(f"📦 Cached response for user '{username}' and query '{query}'")
    except Exception as e:
        logger.error(f"Failed to store cache: {str(e)}")


# ✅ Perform vector similarity search
def search_cache(r, model, username, query, index_name="query_cache", threshold=0.85):
    embedding = model.encode(query, normalize_embeddings=True).astype("float32").tobytes()

    logger.info(f"🔍 Searching Redis cache for user '{username}' and query '{query}'")

    q = f"@username:{{{username}}}=>[KNN 1 @embedding $vec_param AS score]"
    params = {"vec_param": embedding}

    try:
        query_obj = Query(q) \
            .return_fields("response", "score") \
            .dialect(2)

        results = r.ft(index_name).search(query_obj, query_params=params)
    except Exception as e:
        logger.error(f"Redis search failed: {e}")
        return None

    if results.total > 0:
        top = results.docs[0]
        score = float(top.score)
        logger.info(f"Top score: {score}")
        if score < (1 - threshold):  # Lower score = closer cosine match
            logger.info(f"✅ Cache hit (score: {score})")
            return top.response
    logger.info("❌ Cache miss (no close enough match found)")
    return None

