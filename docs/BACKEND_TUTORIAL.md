# Backend Tutorial: พื้นฐานสู่ขั้นสูง

> คู่มือเรียนรู้ Backend Development ผ่านโปรเจกต์ Linkdinger
> ตั้งแต่พื้นฐานจนถึงเทคนิคขั้นสูง

---

## 📚 สารบัญ

1. [Backend คืออะไร?](#1-backend-คืออะไร)
2. [Python Backend พื้นฐาน](#2-python-backend-พื้นฐาน)
3. [File System Operations](#3-file-system-operations)
4. [Event-Driven Programming](#4-event-driven-programming)
5. [Working with External APIs](#5-working-with-external-apis)
6. [Database Basics (Redis)](#6-database-basics-redis)
7. [Authentication & Security](#7-authentication--security)
8. [Deployment & DevOps](#8-deployment--devops)

---

## 1. Backend คืออะไร?

### 1.1 ความแตกต่าง Frontend vs Backend

```
┌─────────────────────────────────────────────────────────────┐
│                      WEB APPLICATION                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FRONTEND (Client-side)                                     │
│  ├── ทำงานบน Browser (Chrome, Firefox, Safari)             │
│  ├── ภาษา: HTML, CSS, JavaScript, TypeScript               │
│  ├── Framework: React, Vue, Angular, Next.js               │
│  └── หน้าที่: แสดงผล, รับ input, ส่ง request               │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  BACKEND (Server-side)                                      │
│  ├── ทำงานบน Server (Linux, Windows, macOS)                │
│  ├── ภาษา: Python, Node.js, Go, Java, Rust                 │
│  ├── Framework: FastAPI, Express, Django, Flask            │
│  └── หน้าที่: ประมวลผล, จัดการข้อมูล, รักษาความปลอดภัย      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Backend ใน Linkdinger

> **สำคัญ**: Linkdinger ใช้ **Python Daemon** เป็น backend ไม่ใช่ Next.js API Routes

```
Linkdinger Backend Components:

1. Python Daemon (linkdinger.py)
   └── Long-running process ที่ทำงานเป็น background service

2. File Watcher (obsidian_watcher.py)
   └── Monitor file system changes แบบ real-time

3. Auto Git (auto_git.py)
   └── Event-driven git synchronization

4. CMS Sync (content_sync.py)
   └── Content management system synchronization
```

---

## 2. Python Backend พื้นฐาน

### 2.1 Daemon Process คืออะไร?

Daemon = Background process ที่ทำงานตลอดเวลา ไม่มี user interaction

```python
# โครงสร้างพื้นฐานของ Daemon

import time
import signal

def main():
    """Main daemon loop"""
    print("Daemon started...")
    
    # Setup signal handlers for graceful shutdown
    def shutdown(signum, frame):
        print("Shutting down...")
        exit(0)
    
    signal.signal(signal.SIGINT, shutdown)   # Ctrl+C
    signal.signal(signal.SIGTERM, shutdown)  # kill command
    
    # Main loop - ทำงานตลอดจนกว่าจะถูกหยุด
    while True:
        # Do work here
        time.sleep(1)

if __name__ == "__main__":
    main()
```

### 2.2 Configuration Management

#### YAML Configuration

```yaml
# config.yaml
vault:
  path: "D:/Obsidian/Notes"
  assets_dir: "_assets"

watcher:
  debounce_sec: 0.5
  formats: [".png", ".jpg"]
```

#### Loading Config in Python

```python
import yaml
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

class Config:
    def __init__(self, config_path: str = "config.yaml"):
        # 1. Load YAML file
        with open(config_path, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)
        
        # 2. Access nested values
        self.vault_path = cfg["vault"]["path"]
        self.debounce_sec = cfg["watcher"]["debounce_sec"]
        
        # 3. Load secrets from environment
        self.r2_endpoint = os.getenv("R2_ENDPOINT")
        self.r2_access_key = os.getenv("R2_ACCESS_KEY")
        
        # 4. Validate required values
        self._validate()
    
    def _validate(self):
        if not self.vault_path:
            raise ValueError("vault.path is required")
        if not self.r2_endpoint:
            raise ValueError("R2_ENDPOINT is required")

# Usage
config = Config()
print(config.vault_path)  # "D:/Obsidian/Notes"
```

### 2.3 Logging

```python
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Usage
logger.debug("Debug message - สำหรับ development")
logger.info("Info message - ข้อมูลทั่วไป")
logger.warning("Warning message - มีปัญหาเล็กน้อย")
logger.error("Error message - มีปัญหา serious")
logger.critical("Critical message - ร้ายแรง")
```

**Output:**

```
2024-03-03 10:30:45 - INFO - Processing image: screenshot.png
2024-03-03 10:30:46 - ERROR - Upload failed: Connection timeout
```

---

## 3. File System Operations

### 3.1 Path Handling

```python
import os
from pathlib import Path

# ❌ Bad - Hardcoded paths (ไม่ cross-platform)
path = "D:\\Obsidian\\Notes\\image.png"

# ✅ Good - Using os.path (cross-platform)
path = os.path.join("D:", "Obsidian", "Notes", "image.png")

# ✅ Better - Using pathlib (modern Python)
path = Path("D:/Obsidian/Notes/image.png")

# Path operations
path.name          # "image.png"
path.stem          # "image"
path.suffix        # ".png"
path.parent        # Path("D:/Obsidian/Notes")
path.exists()      # True/False
path.is_file()     # True/False
path.is_dir()      # True/False
```

### 3.2 Reading and Writing Files

```python
# Reading files
def read_file(filepath: str) -> str:
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()

# Writing files
def write_file(filepath: str, content: str):
    # Create directory if not exists
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

# JSON files
import json

def read_json(filepath: str) -> dict:
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

def write_json(filepath: str, data: dict):
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
```

### 3.3 File Watching with Watchdog

```python
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class MyHandler(FileSystemEventHandler):
    """Custom event handler for file changes"""
    
    def on_created(self, event):
        """Called when a file/directory is created"""
        if not event.is_directory:
            print(f"File created: {event.src_path}")
    
    def on_modified(self, event):
        """Called when a file/directory is modified"""
        if not event.is_directory:
            print(f"File modified: {event.src_path}")
    
    def on_deleted(self, event):
        """Called when a file/directory is deleted"""
        print(f"Deleted: {event.src_path}")
    
    def on_moved(self, event):
        """Called when a file/directory is moved/renamed"""
        print(f"Moved: {event.src_path} → {event.dest_path}")

# Setup observer
observer = Observer()
handler = MyHandler()

# Watch directory recursively
observer.schedule(handler, path="/path/to/watch", recursive=True)
observer.start()

# Keep running
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    observer.stop()

observer.join()
```

---

## 4. Event-Driven Programming

### 4.1 Callback Pattern

```python
# Callback = Function ที่ส่งเป็น parameter เพื่อเรียกทีหลัง

def process_image(filepath: str, on_complete=None):
    """Process image and call callback when done"""
    
    # Do work
    print(f"Processing: {filepath}")
    time.sleep(1)
    result = f"processed_{filepath}"
    
    # Call callback if provided
    if on_complete:
        on_complete(result)
    
    return result

# Usage
def handle_complete(result):
    print(f"Done! Result: {result}")

process_image("image.png", on_complete=handle_complete)
```

### 4.2 Observer Pattern

```python
# Observer Pattern = Multiple callbacks for same event

class EventEmitter:
    """Simple event emitter"""
    
    def __init__(self):
        self._listeners = {}
    
    def on(self, event: str, callback):
        """Register callback for event"""
        if event not in self._listeners:
            self._listeners[event] = []
        self._listeners[event].append(callback)
    
    def emit(self, event: str, *args, **kwargs):
        """Trigger all callbacks for event"""
        if event in self._listeners:
            for callback in self._listeners[event]:
                callback(*args, **kwargs)

# Usage
emitter = EventEmitter()

emitter.on("image_uploaded", lambda url: print(f"Uploaded: {url}"))
emitter.on("image_uploaded", lambda url: send_notification(url))

emitter.emit("image_uploaded", "https://example.com/image.webp")
```

### 4.3 Debounce Pattern

```python
import threading

class Debouncer:
    """Debounce - รอให้หยุดก่อนแล้วค่อยทำ"""
    
    def __init__(self, delay_seconds: float):
        self.delay = delay_seconds
        self._timer = None
        self._lock = threading.Lock()
    
    def call(self, func, *args, **kwargs):
        """Call function after delay (resets timer on each call)"""
        with self._lock:
            # Cancel existing timer
            if self._timer:
                self._timer.cancel()
            
            # Start new timer
            self._timer = threading.Timer(
                self.delay,
                func,
                args=args,
                kwargs=kwargs
            )
            self._timer.start()

# Usage
debouncer = Debouncer(delay_seconds=5.0)

def sync_to_git():
    print("Syncing to git...")

# Rapid calls - only last one executes
debouncer.call(sync_to_git)  # Timer starts
debouncer.call(sync_to_git)  # Timer resets
debouncer.call(sync_to_git)  # Timer resets
# After 5 seconds of no calls → sync_to_git() runs
```

---

## 5. Working with External APIs

### 5.1 HTTP Requests

```python
import requests

# GET request
response = requests.get("https://api.example.com/data")
if response.status_code == 200:
    data = response.json()

# POST request
response = requests.post(
    "https://api.example.com/upload",
    json={"file": "image.png"},
    headers={"Authorization": "Bearer token"}
)

# With error handling
try:
    response = requests.get(url, timeout=30)
    response.raise_for_status()  # Raise exception for 4xx/5xx
    data = response.json()
except requests.Timeout:
    print("Request timed out")
except requests.RequestException as e:
    print(f"Request failed: {e}")
```

### 5.2 S3-Compatible Storage (Cloudflare R2)

```python
import boto3
from botocore.config import Config

# R2 client setup
r2_client = boto3.client(
    "s3",
    endpoint_url="https://xxx.r2.cloudflarestorage.com",
    aws_access_key_id="your_access_key",
    aws_secret_access_key="your_secret_key",
    config=Config(
        signature_version="s3v4",
        retries={"max_attempts": 3}
    )
)

# Upload file
def upload_to_r2(filepath: str, key: str) -> str:
    """Upload file to R2 and return public URL"""
    
    # Determine content type
    content_type = "image/webp"
    
    # Upload
    r2_client.upload_file(
        filepath,
        "my-bucket",
        key,
        ExtraArgs={"ContentType": content_type}
    )
    
    # Return public URL
    return f"https://pub-xxx.r2.dev/{key}"

# Download file
def download_from_r2(key: str, filepath: str):
    """Download file from R2"""
    r2_client.download_file("my-bucket", key, filepath)

# List files
def list_r2_files(prefix: str = ""):
    """List all files in R2 bucket"""
    response = r2_client.list_objects_v2(
        Bucket="my-bucket",
        Prefix=prefix
    )
    return [obj["Key"] for obj in response.get("Contents", [])]
```

### 5.3 Redis REST API (Upstash)

```python
import os
import requests

class UpstashRedis:
    """Upstash Redis via REST API"""
    
    def __init__(self):
        self.url = os.getenv("UPSTASH_REDIS_REST_URL")
        self.token = os.getenv("UPSTASH_REDIS_REST_TOKEN")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def get(self, key: str) -> str | None:
        """Get value by key"""
        response = requests.get(
            f"{self.url}/get/{key}",
            headers=self.headers
        )
        if response.ok:
            result = response.json()["result"]
            return result
        return None
    
    def set(self, key: str, value: str):
        """Set key-value pair"""
        response = requests.get(
            f"{self.url}/set/{key}/{value}",
            headers=self.headers
        )
        return response.ok
    
    def incr(self, key: str) -> int:
        """Increment counter"""
        response = requests.get(
            f"{self.url}/incr/{key}",
            headers=self.headers
        )
        if response.ok:
            return int(response.json()["result"])
        return 0

# Usage
redis = UpstashRedis()
redis.set("page_views:home", "0")
views = redis.incr("page_views:home")
print(f"Total views: {views}")
```

---

## 6. Database Basics (Redis)

### 6.1 Redis Data Types

```
Redis Data Types:

1. STRING - ค่าเดียว (text, number, binary)
   SET key value
   GET key
   INCR key (counter)

2. LIST - รายการตามลำดับ
   LPUSH key value
   RPUSH key value
   LRANGE key 0 -1

3. SET - ชุดข้อมูลไม่ซ้ำ
   SADD key member
   SMEMBERS key

4. HASH - Key-value pairs (object)
   HSET key field value
   HGET key field
   HGETALL key

5. SORTED SET - Set with scores
   ZADD key score member
   ZRANGE key 0 -1 WITHSCORES
```

### 6.2 Use Cases in Linkdinger

```python
# View Counter - STRING with INCR
redis.incr("page_views:my-post-slug")
# Result: 1, 2, 3, ...

# Upload Log - HASH
redis.hset("upload_log", "screenshot.png", "https://r2.dev/abc123.webp")
url = redis.hget("upload_log", "screenshot.png")

# Popular Posts - SORTED SET
redis.zadd("popular_posts", {"post-1": 100, "post-2": 50})
top_posts = redis.zrange("popular_posts", 0, 9, desc=True)
```

---

## 7. Authentication & Security

### 7.1 Environment Variables

```python
# .env file (NEVER commit this!)
R2_ACCESS_KEY=secret_key_here
R2_SECRET_KEY=super_secret_here
DATABASE_PASSWORD=another_secret

# .gitignore
.env
*.env.local

# Python code
import os
from dotenv import load_dotenv

load_dotenv()  # Load from .env file

# Access variables
api_key = os.getenv("R2_ACCESS_KEY")
if not api_key:
    raise ValueError("R2_ACCESS_KEY not set")
```

### 7.2 Input Validation

```python
import re
from pathlib import Path

def validate_filename(filename: str) -> bool:
    """Validate filename for security"""
    
    # Check for path traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise ValueError("Invalid filename: path traversal detected")
    
    # Check allowed extensions
    allowed_extensions = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
    ext = Path(filename).suffix.lower()
    if ext not in allowed_extensions:
        raise ValueError(f"Invalid extension: {ext}")
    
    # Check filename length
    if len(filename) > 255:
        raise ValueError("Filename too long")
    
    return True

def sanitize_filename(filename: str) -> str:
    """Remove dangerous characters from filename"""
    # Keep only alphanumeric, dash, underscore, dot
    return re.sub(r'[^\w\-.]', '_', filename)
```

### 7.3 Secure File Operations

```python
import tempfile
import os

def process_file_safely(input_path: str):
    """Process file with security considerations"""
    
    # 1. Validate input path
    real_path = os.path.realpath(input_path)
    allowed_dir = "/safe/directory"
    
    if not real_path.startswith(allowed_dir):
        raise ValueError("Access denied: path outside allowed directory")
    
    # 2. Use temp directory for processing
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_file = os.path.join(temp_dir, "processing.tmp")
        
        # Do processing in temp directory
        # ...
        
        # Temp directory is automatically cleaned up
    
    # 3. Set proper permissions
    os.chmod(output_file, 0o644)  # rw-r--r--
```

---

## 8. Deployment & DevOps

### 8.1 Running as System Service (systemd)

```ini
# /etc/systemd/system/linkdinger.service

[Unit]
Description=Linkdinger Daemon
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/home/youruser/linkdinger
ExecStart=/usr/bin/python3 linkdinger.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable linkdinger
sudo systemctl start linkdinger
sudo systemctl status linkdinger

# View logs
journalctl -u linkdinger -f
```

### 8.2 Docker Deployment

```dockerfile
# Dockerfile

FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Run daemon
CMD ["python", "linkdinger.py"]
```

```yaml
# docker-compose.yml

version: '3.8'

services:
  linkdinger:
    build: .
    restart: always
    volumes:
      - ./config.yaml:/app/config.yaml
      - ./obsidian:/obsidian:ro
    environment:
      - R2_ENDPOINT=${R2_ENDPOINT}
      - R2_ACCESS_KEY=${R2_ACCESS_KEY}
      - R2_SECRET_KEY=${R2_SECRET_KEY}
```

### 8.3 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest
      
      - name: Run tests
        run: pytest tests/ -v
      
      - name: Lint
        run: |
          pip install ruff
          ruff check .
```

---

## Summary: Backend Checklist

### พื้นฐานที่ควรรู้

- [ ] Python syntax และ data structures
- [ ] File I/O operations
- [ ] Error handling (try/except)
- [ ] Logging
- [ ] Configuration management (YAML, .env)

### ขั้นกลาง

- [ ] Event-driven programming
- [ ] Callbacks และ observers
- [ ] Threading basics
- [ ] HTTP requests
- [ ] Working with databases (Redis)

### ขั้นสูง

- [ ] Daemon processes
- [ ] File system watching
- [ ] Cloud storage integration
- [ ] Security best practices
- [ ] CI/CD pipelines

---

*Last updated: March 2026*
