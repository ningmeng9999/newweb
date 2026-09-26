import re
import subprocess

def check_syntax(filepath):
    result = subprocess.run(['node', '--check', filepath], capture_output=True, text=True)
    if result.returncode == 0:
        return None
    stderr = result.stderr
    match = re.search(r':(\d+)\n', stderr)
    if match:
        line_num = int(match.group(1))
        msg_match = re.search(r'SyntaxError: (.+)', stderr)
        msg = msg_match.group(1) if msg_match else 'Unknown'
        return line_num, msg
    return None

with open(r'C:\Users\冒泡可乐\Desktop\web\lengmeng-site\js\stock.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 批量修复模式1: (xxx >= 0 ? '+' : '' + 'yyy' + expr + '</td>'
# 应该是: (xxx >= 0 ? '+' : '') + 'yyy' + expr + '</td>'
content = re.sub(
    r"\(([\w.]+)\s*>=\s*0\s*\?\s*'\+'\s*:\s*''\s*\+\s*'([^']*)'\s*\+\s*([\w.()]+)\s*\+\s*'(</td>|</strong>)'",
    r"(\1 >= 0 ? '+' : '') + '\2' + \3 + '\4'",
    content
)
print('Fixed pattern 1: ternary with extra quotes')

# 批量修复模式2: (xxx >= 0 ? '+' : '' + expr + '%</td>'
# 应该是: (xxx >= 0 ? '+' : '') + expr + '%</td>'
content = re.sub(
    r"\(([\w.]+)\s*>=\s*0\s*\?\s*'\+'\s*:\s*''\s*\+\s*([\w.()]+)\s*\+\s*'(%</td>|%<)",
    r"(\1 >= 0 ? '+' : '') + \2 + '\3'",
    content
)
print('Fixed pattern 2: ternary with percent')

# 批量修复模式3: 损坏的中文字符 ۼӯ -> 总盈亏
content = content.replace('ۼӯ', '总盈亏')
content = content.replace('ӯ��', '盈亏')
print('Fixed pattern 3: corrupted chars')

# 批量修复模式4: statEl.innerHTML 行
content = re.sub(
    r"statEl\.innerHTML\s*=\s*'共 <strong>' \+ history\.length \+ '</strong> 笔 \| 盈利 <strong class=\"pnl-up\">' \+ winCount \+ '</strong>  \| (总盈亏|盈亏) <strong class=\"pnl-' \+ dir \+ '\">' \+ \(totalPnl >= 0 \? '\+' : ''\) \+ totalPnl\.toFixed\(2\) \+ '</strong>';",
    "statEl.innerHTML = '共 <strong>' + history.length + '</strong> 笔 | 盈利 <strong class=\"pnl-up\">' + winCount + '</strong> | 总盈亏 <strong class=\"pnl-' + dir + '\">' + (totalPnl >= 0 ? '+' : '') + totalPnl.toFixed(2) + '</strong>';",
    content
)
print('Fixed pattern 4: statEl.innerHTML')

with open(r'C:\Users\冒泡可乐\Desktop\web\lengmeng-site\js\stock.js', 'w', encoding='utf-8') as f:
    f.write(content)

# 检查语法
result = check_syntax(r'C:\Users\冒泡可乐\Desktop\web\lengmeng-site\js\stock.js')
if result:
    print(f'\nRemaining error at line {result[0]}: {result[1]}')
    lines = content.split('\n')
    print(f'  Content: {lines[result[0]-1].rstrip()[:150]}')
else:
    print('\n✓ Syntax OK!')