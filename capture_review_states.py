import os
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
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
    options.add_argument(f'--window-size={width},{height}')
    driver = webdriver.Chrome(options=options)
    driver.set_window_size(width, height)
    return driver

def save(driver, name):
    local_path = f"screenshots/{name}.png"
    art_path = os.path.join(ARTIFACT_DIR, f"{name}.png")
    driver.save_screenshot(local_path)
    driver.save_screenshot(art_path)
    print(f"Captured: {name} -> {local_path} and {art_path}")

def set_theme(driver, theme):
    driver.execute_script(f"""
        localStorage.setItem('gcc-atlas-theme', '{theme}');
        if ('{theme}' === 'dark') {{
            document.documentElement.classList.add('dark');
        }} else {{
            document.documentElement.classList.remove('dark');
        }}
    """)
    time.sleep(0.5)

def open_ask_drawer(driver, width):
    if width <= 640:
        menu_btn = WebDriverWait(driver, 6).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "header button[aria-label='Open navigation menu']"))
        )
        menu_btn.click()
        time.sleep(0.6)
        # Find all buttons in header that contain Ask
        ask_btns = driver.find_elements(By.XPATH, "//header//button[contains(., 'Ask')]")
        clicked = False
        for b in ask_btns:
            if b.is_displayed():
                driver.execute_script("arguments[0].click();", b)
                clicked = True
                break
        if not clicked and ask_btns:
            driver.execute_script("arguments[0].click();", ask_btns[-1])
    else:
        ask_btn = WebDriverWait(driver, 6).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "header button[aria-label='Ask the record']"))
        )
        driver.execute_script("arguments[0].click();", ask_btn)

    # Wait for the drawer input to be present and visible
    WebDriverWait(driver, 8).until(
        EC.visibility_of_element_located((By.ID, "drawer-ask-input"))
    )
    time.sleep(0.8)

def capture_all():
    themes = ["light", "dark"]
    viewports = [
        (1440, 1080, "1440"),
        (360, 840, "360")
    ]

    # --- 1. RECONCILE (4 screenshots) ---
    for theme in themes:
        for width, height, vp_tag in viewports:
            name = f"reconcile-{theme}-{vp_tag}"
            print(f"\nCapturing {name}...")
            driver = get_driver(width, height)
            try:
                driver.get("http://localhost:3000/reconcile")
                WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "h1")))
                set_theme(driver, theme)
                time.sleep(1)
                save(driver, name)
            finally:
                driver.quit()

    # --- 2. PROVIDERS: Closed, Drawer Empty, Drawer Answered, Drawer No-Answer (16 screenshots) ---
    for theme in themes:
        for width, height, vp_tag in viewports:
            # 2.1 Closed state
            name_closed = f"providers-closed-{theme}-{vp_tag}"
            print(f"\nCapturing {name_closed}...")
            driver = get_driver(width, height)
            try:
                driver.get("http://localhost:3000/providers")
                WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "h1")))
                set_theme(driver, theme)
                time.sleep(1)
                save(driver, name_closed)
            finally:
                driver.quit()

            # 2.2 Drawer Empty state
            name_empty = f"providers-drawer-empty-{theme}-{vp_tag}"
            print(f"\nCapturing {name_empty}...")
            driver = get_driver(width, height)
            try:
                driver.get("http://localhost:3000/providers")
                WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "h1")))
                set_theme(driver, theme)
                open_ask_drawer(driver, width)
                save(driver, name_empty)
            finally:
                driver.quit()

            # 2.3 Drawer Answered state
            name_answered = f"providers-drawer-answered-{theme}-{vp_tag}"
            print(f"\nCapturing {name_answered}...")
            driver = get_driver(width, height)
            try:
                driver.get("http://localhost:3000/providers")
                WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "h1")))
                set_theme(driver, theme)
                open_ask_drawer(driver, width)
                drawer_input = driver.find_element(By.ID, "drawer-ask-input")
                drawer_input.clear()
                drawer_input.send_keys("Which real estate advisors represented Google India or Boeing?")
                submit_btn = driver.find_element(By.CSS_SELECTOR, "aside form button[type='submit'], [role='dialog'] form button[type='submit']")
                driver.execute_script("arguments[0].click();", submit_btn)
                # Wait for answer block
                WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'JLL') or contains(text(), 'CBRE')]"))
                )
                time.sleep(1.5)
                save(driver, name_answered)
            finally:
                driver.quit()

            # 2.4 Drawer No-Answer state
            name_noanswer = f"providers-drawer-noanswer-{theme}-{vp_tag}"
            print(f"\nCapturing {name_noanswer}...")
            driver = get_driver(width, height)
            try:
                driver.get("http://localhost:3000/providers")
                WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "h1")))
                set_theme(driver, theme)
                open_ask_drawer(driver, width)
                drawer_input = driver.find_element(By.ID, "drawer-ask-input")
                drawer_input.clear()
                drawer_input.send_keys("What is the internal budget of Acme Corp GCC in 2030?")
                submit_btn = driver.find_element(By.CSS_SELECTOR, "aside form button[type='submit'], [role='dialog'] form button[type='submit']")
                driver.execute_script("arguments[0].click();", submit_btn)
                # Wait for refusal state
                WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'The Atlas has no sourced data on this yet')]"))
                )
                time.sleep(1.5)
                save(driver, name_noanswer)
            finally:
                driver.quit()

    print("\nAll 20 screenshots captured successfully!")

if __name__ == "__main__":
    capture_all()
