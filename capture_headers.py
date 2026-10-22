import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

ARTIFACT_DIR = r"C:\Users\badhu\.gemini\antigravity\brain\2de9dad2-c159-4ec1-9adb-0ce44a514860"

options = Options()
options.add_argument('--headless')
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')
options.add_argument('--window-size=1440,900')

driver = webdriver.Chrome(options=options)
try:
    # Light
    driver.get("http://localhost:3000/registry")
    time.sleep(1.5)
    driver.save_screenshot("screenshots/header-v2-active-ink-pill-1440.png")
    driver.save_screenshot(os.path.join(ARTIFACT_DIR, "header-v2-active-ink-pill-1440.png"))
    print("Saved light header screenshot")

    # Dark
    driver.execute_script("""
        localStorage.setItem('gcc-atlas-theme', 'dark');
        document.documentElement.classList.add('dark');
    """)
    time.sleep(1)
    driver.save_screenshot("screenshots/header-v2-dark-pill-1440.png")
    driver.save_screenshot(os.path.join(ARTIFACT_DIR, "header-v2-dark-pill-1440.png"))
    print("Saved dark header screenshot")
finally:
    driver.quit()
