from selenium import webdriver
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--headless')
driver = webdriver.Chrome(options=options)
driver.set_window_size(1024, 547)
driver.get('http://localhost:3000/registry')

import time; time.sleep(1)
# Scroll to bottom
driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
time.sleep(0.5)

driver.save_screenshot("test_bottom_1024.png")

info = driver.execute_script("""
    const footer = document.querySelector('footer');
    return {
        scrollY: window.scrollY,
        scrollHeight: document.body.scrollHeight,
        innerHeight: window.innerHeight,
        footerRect: footer.getBoundingClientRect(),
        footerTop: footer.offsetTop,
        footerHeight: footer.offsetHeight,
        distanceFromFooterBottomToWindowBottom: window.innerHeight - footer.getBoundingClientRect().bottom
    };
""")
print(info)
driver.quit()
