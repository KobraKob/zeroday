import os
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

ARTIFACT_DIR = r"C:\Users\badhu\.gemini\antigravity\brain\2de9dad2-c159-4ec1-9adb-0ce44a514860"
os.makedirs("screenshots", exist_ok=True)
os.makedirs(ARTIFACT_DIR, exist_ok=True)

def get_driver(width, height):
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--window-size=%s,%s' % (width, height))
    driver = webdriver.Chrome(options=options)
    driver.set_window_size(width, height)
    return driver

def save(driver, name):
    local_path = f"screenshots/{name}.png"
    art_path = os.path.join(ARTIFACT_DIR, f"{name}.png")
    driver.save_screenshot(local_path)
    driver.save_screenshot(art_path)
    print(f"Captured: {local_path} and {art_path}")

def run_captures():
    viewports = [
        (1440, 1080, "1440"),
        (360, 840, "360")
    ]

    for width, height, tag in viewports:
        print(f"\n--- CAPTURING VIEWPORT {tag} ({width}x{height}) ---")

        # 1. EMPTY STATE
        driver = get_driver(width, height)
        driver.get("http://localhost:3000/ask")
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "ask-main-input")))
        time.sleep(1.5)
        save(driver, f"ask-empty-{tag}")
        driver.quit()

        # 2. LOADING STATE
        driver = get_driver(width, height)
        driver.get("http://localhost:3000/ask")
        input_el = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "ask-main-input")))
        # Emulate slow network so loading step is visibly active
        driver.execute_cdp_cmd("Network.emulateNetworkConditions", {
            "offline": False,
            "latency": 3500,
            "downloadThroughput": 50000,
            "uploadThroughput": 50000
        })
        input_el.clear()
        input_el.send_keys("What is India's total GCC market revenue in FY26?")
        submit_btn = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "form button[type='submit']")))
        submit_btn.click()
        time.sleep(0.5)
        save(driver, f"ask-loading-{tag}")
        driver.quit()

        # 3. ANSWERED STATE
        driver = get_driver(width, height)
        driver.get("http://localhost:3000/ask")
        input_el = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "ask-main-input")))
        input_el.clear()
        input_el.send_keys("What is India's total GCC market revenue in FY26?")
        submit_btn = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "form button[type='submit']")))
        submit_btn.click()
        # Wait for answer article to appear
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "article"))
        )
        time.sleep(2)
        save(driver, f"ask-answered-{tag}")
        driver.quit()

        # 4. NO-ANSWER STATE
        driver = get_driver(width, height)
        driver.get("http://localhost:3000/ask")
        input_el = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "ask-main-input")))
        input_el.clear()
        input_el.send_keys("What is the internal budget of Acme Corp GCC in 2030?")
        submit_btn = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "form button[type='submit']")))
        submit_btn.click()
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'The Atlas has no sourced data on this yet')]"))
        )
        time.sleep(2)
        save(driver, f"ask-no-answer-{tag}")
        driver.quit()

        # 5. SOURCES-DISAGREE STATE
        driver = get_driver(width, height)
        driver.get("http://localhost:3000/ask")
        input_el = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "ask-main-input")))
        input_el.clear()
        input_el.send_keys("Why do published GCC counts vary from 1,400 to 2,975?")
        submit_btn = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "form button[type='submit']")))
        submit_btn.click()
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Sources Disagree') or contains(text(), 'Sources disagree')]"))
        )
        time.sleep(2)
        save(driver, f"ask-sources-disagree-{tag}")
        driver.quit()

        # 6. CONTEXT-AWARE ASK DRAWER (open on /reconcile)
        driver = get_driver(width, height)
        driver.get("http://localhost:3000/reconcile")
        time.sleep(2)
        if width < 1024:
            # On mobile/tablet, open mobile hamburger menu first
            hamburger = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button[aria-label='Open navigation menu']"))
            )
            hamburger.click()
            time.sleep(0.5)
            # Find the mobile ask button
            mobile_ask_btn = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Ask')]"))
            )
            mobile_ask_btn.click()
        else:
            # Click Ask button in desktop header
            ask_nav_btn = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button[aria-label='Ask the record']"))
            )
            ask_nav_btn.click()

        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "[role='dialog']"))
        )
        time.sleep(1.5)
        save(driver, f"ask-drawer-reconcile-{tag}")
        driver.quit()

if __name__ == "__main__":
    run_captures()
