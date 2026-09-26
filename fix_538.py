with open(r'C:\Users\冒泡可乐\Desktop\web\lengmeng-site\js\stock.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 修复第538行（索引537）
for i, line in enumerate(lines):
    if "h.pnl >= 0 ? '+' : '' + '¥' + h.pnl.toFixed(2)" in line:
        lines[i] = "                '<td class=\"pnl-' + dir + '\">' + (h.pnl >= 0 ? '+' : '') + '¥' + h.pnl.toFixed(2) + '</td>' +\n"
        print(f'Fixed line {i+1}: pnl column')
    if "h.pnlRate >= 0 ? '+' : '') + h.pnlRate.toFixed(2) + '%</td>'" in line and not line.rstrip().endswith(';'):
        lines[i] = "                '<td class=\"pnl-' + dir + '\">' + (h.pnlRate >= 0 ? '+' : '') + h.pnlRate.toFixed(2) + '%</td>';\n"
        print(f'Fixed line {i+1}: pnlRate column')

with open(r'C:\Users\冒泡可乐\Desktop\web\lengmeng-site\js\stock.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Done')