from zipfile import ZipFile
import xml.etree.ElementTree as ET
path = r'd:\Da1\be-e.commerce\SRS.docx'
with ZipFile(path) as z:
    print('\n'.join(z.namelist()))
    root = ET.fromstring(z.read('word/document.xml'))
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    texts = []
    for para in root.findall('.//w:p', ns):
        t = ''.join(node.text or '' for node in para.findall('.//w:t', ns))
        if t.strip():
            texts.append(t)
    for i, t in enumerate(texts[:300], 1):
        print(f'{i}: {t}')
