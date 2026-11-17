# -*- coding: utf-8 -*-
"""
push-api.py - 当 github.com 被网络阻断、但 api.github.com 仍可访问时，用 GitHub REST API 推送当前分支

用法：
    npm run push:api              # 推送当前分支（默认 main）
    python scripts/push-api.py --branch main

原理：把本地 HEAD 相对远端 HEAD 的差异逐文件上传为 blob，自下而上重建目录树，
再用与本地完全相同的 tree / parent / 作者 / 时间 / 提交消息创建 commit，最后快进分支。
因为提交内容逐字节一致，远端 SHA 与本地相同（脚本结束会校验）。

凭据：直接复用 git 已缓存的 GitHub 登录（git credential fill），无需额外配置 token。
"""

import base64
import json
import os
import posixpath
import subprocess
import sys
import urllib.error
import urllib.request
import datetime

BRANCH = 'main'
if '--branch' in sys.argv:
    BRANCH = sys.argv[sys.argv.index('--branch') + 1]

REMOTE_URL = subprocess.run(['git', 'remote', 'get-url', 'origin'],
                            capture_output=True, text=True).stdout.strip()
if not REMOTE_URL:
    sys.exit('未配置 origin 远端')

slug = REMOTE_URL.rstrip('/').removesuffix('.git').split('github.com')[-1].strip(':/')
OWNER, REPO = slug.split('/')[:2]
API = 'https://api.github.com'


def git(*args, binary=False):
    out = subprocess.run(['git', *args], capture_output=True)
    if out.returncode:
        sys.exit('git %s 失败: %s' % (' '.join(args), out.stderr.decode(errors='replace')[:300]))
    return out.stdout if binary else out.stdout.decode().rstrip('\n')


def token():
    p = subprocess.run(['git', 'credential', 'fill'],
                       input='protocol=https\nhost=github.com\n\n',
                       capture_output=True, text=True,
                       env={**os.environ, 'GIT_TERMINAL_PROMPT': '0'})
    for line in p.stdout.splitlines():
        if line.startswith('password='):
            return line[len('password='):].strip()
    sys.exit('没有可用的 GitHub 凭据，请先执行一次 git push 完成登录')


TOKEN = token()


def call(method, path, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(API + path, data=data, method=method)
    req.add_header('Authorization', 'Bearer ' + TOKEN)
    req.add_header('Accept', 'application/vnd.github+json')
    req.add_header('X-GitHub-Api-Version', '2022-11-28')
    if data:
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            body = r.read().decode()
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        sys.exit('%s %s 失败: %s %s' % (method, path, e.code, e.read().decode()[:400]))


def iso(epoch_tz):
    ts, tz = epoch_tz
    sign = 1 if tz[0] == '+' else -1
    offset = datetime.timezone(sign * datetime.timedelta(hours=int(tz[1:3]), minutes=int(tz[3:5])))
    return datetime.datetime.fromtimestamp(ts, offset).isoformat()


def main():
    raw = git('cat-file', 'commit', 'HEAD', binary=True)
    head_sha = git('rev-parse', 'HEAD')
    header, _, message = raw.partition(b'\n\n')

    fields = {'parent': []}
    for line in header.decode().splitlines():
        key, _, value = line.partition(' ')
        if key == 'parent':
            fields['parent'].append(value)
        else:
            fields[key] = value

    def who(line):
        name_email, _, stamp = line.rpartition('> ')
        name, _, email = name_email.partition(' <')
        ts, _, tz = stamp.partition(' ')
        return {'name': name, 'email': email}, (int(ts), tz)

    author, author_t = who(fields['author'])
    committer, committer_t = who(fields['committer'])
    message_text = message.decode('utf-8')

    print('本地 HEAD %s' % head_sha[:7])

    ref = call('GET', '/repos/%s/%s/git/ref/heads/%s' % (OWNER, REPO, BRANCH))
    remote_head = ref['object']['sha']
    if remote_head == head_sha:
        print('远端已是最新，无需推送')
        return
    print('远端 %s' % remote_head[:7])

    # ---- 差异对比：本地 HEAD 树 vs 远端 HEAD 树 ----
    local = {}
    for line in git('ls-tree', '-r', 'HEAD').splitlines():
        meta, path = line.split('\t')
        local[path] = meta.split()[2]

    remote_commit = call('GET', '/repos/%s/%s/git/commits/%s' % (OWNER, REPO, remote_head))
    remote_tree = call('GET', '/repos/%s/%s/git/trees/%s?recursive=1'
                       % (OWNER, REPO, remote_commit['tree']['sha']))
    remote = {i['path']: i['sha'] for i in remote_tree['tree'] if i['type'] == 'blob'}
    remote_dirs = {i['path']: i['sha'] for i in remote_tree['tree'] if i['type'] == 'tree'}

    updates = []      # (path, sha or None)
    for path, sha in local.items():
        if remote.get(path) != sha:
            updates.append((path, sha))
    for path in remote:
        if path not in local:
            updates.append((path, None))
    if not updates:
        print('内容无差异，仅提交元信息不同，跳过')
        return
    print('差异文件 %d 个' % len(updates))

    by_dir = {}
    for path, sha in updates:
        by_dir.setdefault(posixpath.dirname(path), []).append((posixpath.basename(path), sha))

    # ---- 上传内容有变化的 blob ----
    uploaded = {}
    for d, items in by_dir.items():
        for name, sha in items:
            if sha is None:
                continue
            content = git('cat-file', 'blob', sha, binary=True)
            blob = call('POST', '/repos/%s/%s/git/blobs' % (OWNER, REPO),
                        {'content': base64.b64encode(content).decode(), 'encoding': 'base64'})
            uploaded[sha] = blob['sha']

    # ---- 自下而上重建目录树 ----
    need = set()
    for d in by_dir:
        cur = d
        while True:
            need.add(cur)
            if not cur:
                break
            cur = posixpath.dirname(cur)

    built = {}
    for d in sorted(need, key=lambda x: -len([s for s in x.split('/') if s])):
        items = []
        for name, sha in by_dir.get(d, []):
            items.append({'path': name, 'mode': '100644', 'type': 'blob',
                          'sha': None if sha is None else uploaded[sha]})
        for sub, sub_sha in built.items():
            if posixpath.dirname(sub) == d:
                items.append({'path': posixpath.basename(sub), 'mode': '040000',
                              'type': 'tree', 'sha': sub_sha})
        base = remote_commit['tree']['sha'] if not d else remote_dirs.get(d)
        built[d] = call('POST', '/repos/%s/%s/git/trees' % (OWNER, REPO),
                        {'base_tree': base, 'tree': items} if base else {'tree': items})['sha']

    new_root = built.get('')
    local_root = git('rev-parse', 'HEAD^{tree}')
    if new_root != local_root:
        sys.exit('目录树不一致（远端 %s / 本地 %s），已中止，未改动远端' % (new_root[:7], local_root[:7]))

    # ---- 创建提交 ----
    commit = call('POST', '/repos/%s/%s/git/commits' % (OWNER, REPO), {
        'message': message_text,
        'tree': new_root,
        'parents': [remote_head],
        'author': {**author, 'date': iso(author_t)},
        'committer': {**committer, 'date': iso(committer_t)},
    })

    call('PATCH', '/repos/%s/%s/git/refs/heads/%s' % (OWNER, REPO, BRANCH),
         {'sha': commit['sha'], 'force': False})

    print('已推送 → %s' % commit['sha'][:7])
    if commit['sha'] != head_sha:
        print('注意：远端 SHA 与本地不同（元信息被服务端规范化），内容一致')
        print('      下次 git push 前建议先 git fetch && git reset --hard origin/%s' % BRANCH)
    else:
        # 同步本地远端跟踪引用，保持 git status 干净
        subprocess.run(['git', 'update-ref', 'refs/remotes/origin/%s' % BRANCH, commit['sha']])


main()
