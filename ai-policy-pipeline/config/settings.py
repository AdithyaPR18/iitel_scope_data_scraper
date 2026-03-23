import os
from dotenv import load_dotenv

load_dotenv()

OUTPUT_DIR = os.getenv("OUTPUT_DIR", "./data")
OUTPUT_FILE = os.getenv("OUTPUT_FILE", "policy_db.json")
MAX_PAGES_PER_DOMAIN = int(os.getenv("MAX_PAGES_PER_DOMAIN", 20))
CRAWL_DELAY = float(os.getenv("CRAWL_DELAY_SECONDS", 2))
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT_SECONDS", 15))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", 3))
MIN_TEXT_LENGTH = int(os.getenv("MIN_TEXT_LENGTH", 200))
