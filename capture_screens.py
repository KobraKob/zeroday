import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

PAGES = [
    ('/', 'home'),
    ('/reconcile', 'reconcile'),
    ('/registry', 'registry'),
    ('/radar', 'radar'),
    ('/compare', 'compare'),
    ('/providers', 'providers'),
    ('/methodology', 'methodology'),
]

VIEWPORTS = [
    (1440, 900, '1440'),
    (360, 800, '360')
]

def capture(prefix='before'):
    os.makedirs('screenshots', exist_ok=True)
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    
    driver = webdriver.Chrome(options=options)
    
    for path, name in PAGES:
        for width, height, tag in VIEWPORTS:
            driver.set_window_size(width, height)
            url = f'http://localhost:3000{path}'
            driver.get(url)
            time.sleep(1.5)
            filename = f'screenshots/{prefix}-{name}-{tag}.png'
            driver.save_screenshot(filename)
            print(f'Captured {filename}')
            
    driver.quit()

if __name__ == '__main__':
    import sys
    prefix = sys.argv[1] if len(sys.argv) > 1 else 'before'
    capture(prefix)
