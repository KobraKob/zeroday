import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

ARTIFACT_DIR = r"C:\Users\badhu\.gemini\antigravity\brain\2de9dad2-c159-4ec1-9adb-0ce44a514860"

options = Options()
options.add_argument('--headless')
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')
options.add_argument('--window-size=360,840')
driver = webdriver.Chrome(options=options)
driver.set_window_size(360, 840)

driver.get("http://localhost:3000/reconcile")
time.sleep(2)

# Click hamburger
btn = WebDriverWait(driver, 10).until(
    EC.element_to_be_clickable((By.CSS_SELECTOR, "header button[aria-label='Open navigation menu']"))
)
btn.click()
time.sleep(1)

# Find button with Ask text inside header
ask_btns = driver.find_elements(By.TAG_NAME, "button")
for b in ask_btns:
    if "Ask" in b.text:
        b.click()
        break

time.sleep(1.5)
driver.save_screenshot("screenshots/ask-drawer-reconcile-360.png")
driver.save_screenshot(os.path.join(ARTIFACT_DIR, "ask-drawer-reconcile-360.png"))
print("Captured ask-drawer-reconcile-360.png")
driver.quit()
