from selenium import webdriver
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--headless')
driver = webdriver.Chrome(options=options)
driver.set_window_size(1440, 900)
driver.get('http://localhost:3000/registry')

res = driver.execute_script("""
    const tableContainer = document.querySelector('.overflow-x-auto');
    const tableWrapper = document.querySelector('.overflow-x-auto').parentElement;
    return {
        tableContainerHeight: tableContainer.offsetHeight,
        tableContainerMaxHeight: window.getComputedStyle(tableContainer).maxHeight,
        tableWrapperHeight: tableWrapper.offsetHeight,
        tableHeight: document.querySelector('table').offsetHeight
    };
""")
print("Table container:", res)
driver.quit()
