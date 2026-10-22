from selenium import webdriver
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--headless')
driver = webdriver.Chrome(options=options)
driver.set_window_size(1440, 900)
driver.get('http://localhost:3000/registry')

info = driver.execute_script("""
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map(el => ({
        tag: el.tagName,
        href: el.href || null,
        textLen: el.textContent ? el.textContent.length : 0
    }));
    const mobileEl = document.querySelector('.block.md\\\\:hidden') || document.querySelector('.space-y-3.block');
    return {
        links,
        mobileDisplay: mobileEl ? window.getComputedStyle(mobileEl).display : null,
        mobileClasses: mobileEl ? mobileEl.className : null
    };
""")
print(info)
driver.quit()
