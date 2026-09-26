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

# 先修复已知的具体问题
specific_fixes = [
    # 第539行附近: 收益率列
    ("'<td class=\"pnl-' + dir + '\">' + (h.pnlRate >= 0 ? '+' : '' + h.pnlRate.toFixed(2) + '%</td>';",
     "'<td class=\"pnl-' + dir + '\">' + (h.pnlRate >= 0 ? '+' : '') + h.pnlRate.toFixed(2) + '%</td>'"),
    
    # console.log 中多余的 '
    ("console.log('[K线] 使用缓存', code, klineCache[code].length, ');",
     "console.log('[K线] 使用缓存', code, klineCache[code].length);"),
    ("console.log('[K线] 代理响应状, res.status);",
     "console.log('[K线] 代理响应状态', res.status);"),
    ("console.log('[K线] 直连响应状, res.status);",
     "console.log('[K线] 直连响应状态', res.status);"),
    ("console.log('[热门榜] 响应状, res.status);",
     "console.log('[热门榜] 响应状态', res.status);"),
    ("console.log('[热门榜] API返回空数);",
     "console.log('[热门榜] API返回空数据');"),
    ("console.log('[热门榜] 本地环境，使用内置数);",
     "console.log('[热门榜] 本地环境，使用内置数据');"),
    ("console.log('[热门榜] 回退到内置数);",
     "console.log('[热门榜] 回退到内置数据');"),
    ("console.log('[热门榜] fallback=false，设置为);",
     "console.log('[热门榜] fallback=false，设置为空');"),
    ("console.log('[K线] 开始加, code);",
     "console.log('[K线] 开始加载', code);"),
    ("console.log('[K线] 开始绘canvas=' + canvas.width + 'x' + canvas.",
     "console.log('[K线] 开始绘制 canvas=' + canvas.width + 'x' + canvas.height);"),
    ("if (!canvas) { console.error('[K线] canvas不存); return; }",
     "if (!canvas) { console.error('[K线] canvas不存在'); return; }"),
    ("if (!currentKlineData || !currentKlineData.length) { console",
     "if (!currentKlineData || !currentKlineData.length) { console.error('[K线] 无数据'); return; }"),
    
    # 数字格式化
    ("if (num >= 100000000) return (num / 100000000).toFixed(2) + ",
     "if (num >= 100000000) return (num / 100000000).toFixed(2) + '亿';"),
    ("if (num >= 10000) return (num / 10000).toFixed(2) + ';",
     "if (num >= 10000) return (num / 10000).toFixed(2) + '万';"),
    
    # K线提示
    ("if (infoEl) infoEl.textContent = '暂无K线数据（API请求失败，请稍后重试;",
     "if (infoEl) infoEl.textContent = '暂无K线数据（API请求失败，请稍后重试）';"),
    
    # 标题
    ("if (titleEl) titleEl.textContent = name + ' (' + code.toUppe",
     "if (titleEl) titleEl.textContent = name + ' (' + code.toUpperCase() + ')';"),
    
    # 热门榜标题
    ("hotSectionTitle.textContent = '策略 + currentStrategyName;",
     "hotSectionTitle.textContent = '策略: ' + currentStrategyName;"),
    ("hotSectionTip.textContent = '' + list.length + ' 只符合条· 可在搜索框",
     "hotSectionTip.textContent = '' + list.length + ' 只符合条件 · 可在搜索框搜索';"),
    ("stockSearch.placeholder = '' + list.length + ' 只策略结果中搜索（清空恢复",
     "stockSearch.placeholder = '' + list.length + ' 只策略结果中搜索（清空恢复热门榜）';"),
    ("btn.textContent = '恢复热门;",
     "btn.textContent = '恢复热门榜';"),
    ("if (hotSectionTitle) hotSectionTitle.textContent = '人气热门;",
     "if (hotSectionTitle) hotSectionTitle.textContent = '人气热门榜';"),
    ("if (hotSectionTip) hotSectionTip.textContent = '综合股吧/雪球/社区热度",
     "if (hotSectionTip) hotSectionTip.textContent = '综合股吧/雪球/社区热度';"),
    ("if (stockSearch) stockSearch.placeholder = '输入股票名称或代码，回车搜索（如",
     "if (stockSearch) stockSearch.placeholder = '输入股票名称或代码，回车搜索（如：茅台、600519）';"),
    
    # 搜索结果
    ("if (searchResultTitle) searchResultTitle.textContent = '搜索 +",
     "if (searchResultTitle) searchResultTitle.textContent = '搜索结果';"),
    ("if (searchResultTip) searchResultTip.textContent = '找到 ' + m",
     "if (searchResultTip) searchResultTip.textContent = '找到 ' + matched.length + ' 只股票';"),
    ("showProgress(100, '找到 ' + matched.length + ' );",
     "showProgress(100, '找到 ' + matched.length + ' 只');"),
    ("showProgress(100, '热门池找' + quickMatched.length + ' );",
     "showProgress(100, '热门池找到' + quickMatched.length + ' 只');"),
    
    # 行情获取
    ("console.warn('获取行情失败，尝试从全市场缓存获, e);",
     "console.warn('获取行情失败，尝试从全市场缓存获取', e);"),
    ("tip.textContent = '获取实时行情失败，已用搜索结果价格加入自;",
     "tip.textContent = '获取实时行情失败，已用搜索结果价格加入自选';"),
    
    # 移除自选
    ("if (confirm('确定移除该自选股)) removeFromFavorites(btn.dataset.code",
     "if (confirm('确定移除该自选股？')) removeFromFavorites(btn.dataset.code);"),
    
    # 云图
    ("ctx.fillText('添加自选股后显示盈利云, W / 2, H / 2);",
     "ctx.fillText('添加自选股后显示盈利云图', W / 2, H / 2);"),
    ("ctx.fillText('收益, padL + plotW / 2, padT + plotH + 40);",
     "ctx.fillText('收益率', padL + plotW / 2, padT + plotH + 40);"),
    
    # 策略筛选
    ("if (prog) prog.textContent = '使用缓存数据 + count + ' 只）· 正在筛..';",
     "if (prog) prog.textContent = '使用缓存数据 ' + count + ' 只）· 正在筛选...';"),
    
    # 策略保存
    ("if (!name) { alert('请输入策略名); return; }",
     "if (!name) { alert('请输入策略名称'); return; }"),
    ("if (!Object.keys(conditions).length) { alert('请至少选择一个筛选条); r",
     "if (!Object.keys(conditions).length) { alert('请至少选择一个筛选条件'); return; }"),
    
    # 导入
    ("} else { alert('文件格式不正); }",
     "} else { alert('文件格式不正确'); }"),
    ("} catch (err) { alert('导入失败 + err.message); }",
     "} catch (err) { alert('导入失败: ' + err.message); }"),
    
    # 热门榜提示
    ("hotSectionTip.textContent = srcInfo + '点击自选」加入，默认买入100;",
     "hotSectionTip.textContent = srcInfo + '点击「+自选」加入，默认买入100股';"),
    
    # 加载按钮
    ("loadAllBtn.textContent = '已加载（' + allStocksCache.length + '只",
     "loadAllBtn.textContent = '已加载（' + allStocksCache.length + '只）';"),
    ("loadAllBtn.textContent = '加载全市场数;",
     "loadAllBtn.textContent = '加载全市场数据';"),
]

fixed = 0
for old, new in specific_fixes:
    for i, line in enumerate(lines):
        if old.strip() in line:
            lines[i] = line.replace(old.strip(), new.strip())
            fixed += 1
            break

print(f'Fixed {fixed} specific issues')

with open(r'C:\Users\冒泡可乐\Desktop\web\lengmeng-site\js\stock.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

# 检查语法
result = check_syntax(r'C:\Users\冒泡可乐\Desktop\web\lengmeng-site\js\stock.js')
if result:
    print(f'\nRemaining error at line {result[0]}: {result[1]}')
    print(f'  Content: {lines[result[0]-1].rstrip()[:150]}')
else:
    print('\n✓ Syntax OK!')