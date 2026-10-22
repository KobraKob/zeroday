import os
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

VIEWPORTS = [
    (1440, 1080, '1440'),
    (360, 900, '360')
]

ARTIFACT_DIR = r"C:\Users\badhu\.gemini\antigravity\brain\2de9dad2-c159-4ec1-9adb-0ce44a514860"

def capture(prefix='after-reconcile-v2'):
    os.makedirs('screenshots', exist_ok=True)
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    
    driver = webdriver.Chrome(options=options)
    
    for width, height, tag in VIEWPORTS:
        driver.set_window_size(width, height)
        driver.get('http://localhost:3000/reconcile')
        time.sleep(2.5)
        
        # Save screenshot
        filename = f'screenshots/{prefix}-{tag}.png'
        driver.save_screenshot(filename)
        
        # Also copy to artifact dir for markdown rendering
        artifact_filename = os.path.join(ARTIFACT_DIR, f'{prefix}-{tag}.png')
        driver.save_screenshot(artifact_filename)
        print(f'Captured {filename} and {artifact_filename}')
        
    driver.quit()

if __name__ == '__main__':
    prefix = sys.argv[1] if len(sys.argv) > 1 else 'after-reconcile-v2'
    capture(prefix)
