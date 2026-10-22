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

def capture_registry():
    themes = ["light", "dark"]
    viewports = [
        (1440, 1080, "1440"),
        (360, 840, "360")
    ]

    for theme in themes:
        for width, height, vp_tag in viewports:
            name = f"registry-{theme}-{vp_tag}"
            print(f"\nCapturing {name}...")
            driver = get_driver(width, height)
            try:
                driver.get("http://localhost:3000/registry")
                WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "h1")))
                set_theme(driver, theme)
                time.sleep(1.2)
                save(driver, name)

                # For desktop, also capture expanded inline row
                if width == 1440:
                    exp_name = f"registry-expanded-{theme}-1440"
                    print(f"Capturing {exp_name}...")
                    # Click first table row to expand inline audit
                    first_row = driver.find_element(By.CSS_SELECTOR, "table tbody tr.cursor-pointer")
                    driver.execute_script("arguments[0].click();", first_row)
                    time.sleep(1)
                    save(driver, exp_name)

            finally:
                driver.quit()

    print("\nAll Registry screenshots captured successfully!")

if __name__ == "__main__":
    capture_registry()
