"""Minimal test: does watchdog see ANY file events in the vault?"""
import os
import time
import yaml
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

with open("config.yaml", "r", encoding="utf-8") as f:
    cfg = yaml.safe_load(f)

vault = cfg["vault"]["path"]
print(f"Vault path: {vault}")
print(f"Exists? {os.path.exists(vault)}")
print(f"Is dir? {os.path.isdir(vault)}")

# List immediate contents
print(f"\nContents of vault root:")
for item in os.listdir(vault)[:10]:
    print(f"  {item}")

class DebugHandler(FileSystemEventHandler):
    def on_any_event(self, event):
        print(f"[EVENT] {event.event_type}: {event.src_path}")

handler = DebugHandler()
observer = Observer()
observer.schedule(handler, vault, recursive=True)
observer.start()

print(f"\n✅ Watching: {vault}")
print("Now paste an image in Obsidian, or create any file in the vault folder.")
print("You should see [EVENT] lines appear below.")
print("Press Ctrl+C to stop\n")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    observer.stop()
observer.join()
