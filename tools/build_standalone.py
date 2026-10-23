"""Turn the claude.ai artifact page into the standalone site.

Usage: python tools/build_standalone.py src/drift-kart.artifact.html index.html
"""
import sys, os
src, out = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
s = open(src, encoding='utf8').read()
peer = open(os.path.join(here, 'mqttroom.js'), encoding='utf8').read()

def rep(a, b):
    global s
    assert s.count(a) == 1, a[:80]
    s = s.replace(a, b)

three = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
rep(three, '<script src="https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js"></script>\n' + three)
rep("(window.claude&&window.claude.use?window.claude.use('room'):Promise.resolve(null))", "Promise.resolve(NetRoom)")
rep("const NET={room:null,", peer + "\nconst NET={room:null,")
i = s.index("if(!NET.room){netNote('"); j = s.index("',true);", i)
s = s[:i] + "if(!NET.room){netNote('連線元件載入失敗，請確認網路後重新整理頁面" + s[j:]
rep("把代碼傳給朋友，他們打開這個頁面、選「多人連線」輸入代碼就能加入。",
    "把代碼傳給朋友，他們打開這個網址、選「多人連線」輸入代碼就能加入。房主暫時切出去也沒關係，回到頁面就會繼續。")
rep("netNote(e&&e.code==='limit_reached'?'房間暫時滿了，請稍後再試。':'加入失敗，請再試一次。',true);",
    "netNote('連不上連線伺服器，請確認網路後再試一次；有些公司或學校網路會擋這類連線。',true);")

head = ('<!doctype html>\n<html lang="zh-Hant">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<style>[hidden]{display:none!important}html,body{margin:0}</style>\n</head>\n<body>\n')
if os.path.dirname(out):
    os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w', encoding='utf8').write(head + s + '\n</body>\n</html>\n')
print('wrote', out)
