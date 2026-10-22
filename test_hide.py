from selenium import webdriver
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--headless')
driver = webdriver.Chrome(options=options)
driver.set_window_size(1440, 900)
driver.get('http://localhost:3000/registry')

res = driver.execute_script("""
    // Hide mobile cards manually to simulate display: none
    const mobileEl = document.querySelector('.block.md\\\\:hidden');
    if (mobileEl) mobileEl.style.display = 'none';

    return {
        bodyScrollHeight: document.body.scrollHeight,
        mainHeight: document.querySelector('main').offsetHeight,
        footerTop: document.querySelector('footer').offsetTop,
        footerHeight: document.querySelector('footer').offsetHeight
    };
""")
print("With mobile cards hidden:", res)
driver.quit()
