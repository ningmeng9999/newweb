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
    lines = f.readlines()

# 清理末尾多余的 ' 
# 模式: xxx);'  -> xxx);
# 模式: xxx); '  -> xxx);
fixed = 0
for i, line in enumerate(lines):
    stripped = line.rstrip()
    # 如果行末是 );' 或 ); ' ，去掉末尾的 '
    if re.search(r"\);\s*'$", stripped):
        lines[i] = re.sub(r"\);\s*'$", ");", stripped) + '\n'
        fixed += 1
    # 如果行末是 );'  后面有空格
    elif re.search(r"\);\s*'\s*$", stripped):
        lines[i] = re.sub(r"\);\s*'\s*$", ");", stripped) + '\n'
        fixed += 1

print(f'Cleaned {fixed} lines with trailing quotes')

with open(r'C:\Users\冒泡可乐\Desktop\web\lengmeng-site\js\stock.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

# 循环检查并修复
for iteration in range(30):
    result = check_syntax(r'C:\Users\冒泡可乐\Desktop\web\lengmeng-site\js\stock.js')
    if result is None:
        print(f'\n✓ Syntax OK after {iteration} iterations')
        break
    
    line_num, msg = result
    line = lines[line_num-1]
    print(f'\nIteration {iteration+1}: Line {line_num}: {msg}')
    print(f'  Content: {line.rstrip()[:150]}')
    
    # 修复策略
    if "Invalid or unexpected token" in msg:
        # 检查是否末尾有多余的 '
        if line.rstrip().endswith(";'") or line.rstrip().endswith("; '"):
            lines[line_num-1] = line.rstrip()[:-1].rstrip() + '\n'
            print('  Fixed: removed trailing quote')
        # 检查是否引号不匹配
        elif line.count("'") % 2 != 0:
            # 去掉末尾的 '
            if line.rstrip().endswith("'"):
                lines[line_num-1] = line.rstrip()[:-1] + '\n'
                print('  Fixed: removed trailing quote to balance')
            else:
                # 在末尾加 '
                lines[line_num-1] = line.rstrip() + "'\n"
                print('  Fixed: added quote to balance')
    
    elif "Unexpected token ')'" in msg or "Unexpected token ';'" in msg:
        # 去掉末尾多余的 ) 或 ;
        if line.rstrip().endswith(");"):
            lines[line_num-1] = line.rstrip()[:-2] + ";\n"
            print('  Fixed: removed extra )')
        elif line.rstrip().endswith(")"):
            lines[line_num-1] = line.rstrip()[:-1] + "\n"
            print('  Fixed: removed extra )')
    
    elif "Unexpected identifier" in msg:
        # 可能是缺少 + 或 ,
        # 简单处理：在行末加 +
        if not line.rstrip().endswith('+') and not line.rstrip().endswith(','):
            lines[line_num-1] = line.rstrip() + " +\n"
            print('  Fixed: added + at end')
    
    with open(r'C:\Users\冒泡可乐\Desktop\web\lengmeng-site\js\stock.js', 'w', encoding='utf-8') as f:
        f.writelines(lines)
else:
    print('\n✗ Could not fix after 30 iterations')
    result = check_syntax(r'C:\Users\冒泡可乐\Desktop\web\lengmeng-site\js\stock.js')
    if result:
        print(f'Final error at line {result[0]}: {result[1]}')
        print(f'  Content: {lines[result[0]-1].rstrip()[:150]}')