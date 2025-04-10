import os
import json
from pathlib import Path

# Try to read version from package.json if available
try:
    package_path = Path(__file__).parent.parent / 'package.json'
    if package_path.exists():
        with open(package_path, 'r') as f:
            package_data = json.load(f)
            __version__ = package_data.get('version', '26.3.1')
    else:
        __version__ = '26.3.1'
except Exception:
    # Fallback to hardcoded version if package.json can't be read
    __version__ = '26.3.1'