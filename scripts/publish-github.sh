#!/usr/bin/env bash
# 把本仓库发布到 GitHub（Stars-XK/dsh-bitwarden），并打上 dsh-plugin topic。
#
# 用法：
#   TOKEN_FILE=/path/.github-token ./scripts/publish-github.sh
#   或把 token 写到默认位置：<workspace 根>/.github-token
#
# 需要的 PAT 权限：repo（classic token）。脚本不会打印 token。
# 完成后请到 GitHub 设置里撤销这个 token。
set -euo pipefail

OWNER="${OWNER:-Stars-XK}"
REPO="${REPO:-dsh-bitwarden}"
DESCRIPTION="${DESCRIPTION:-DeepSeek Harness 的 Bitwarden / Vaultwarden 密码库插件：AI 只拿元数据、密码明文不出仓、受控执行通道}"
TOPICS="${TOPICS:-dsh-plugin deepseek-harness bitwarden vaultwarden password-manager}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOKEN_FILE="${TOKEN_FILE:-$(cd "$ROOT/.." && pwd)/.github-token}"

if [ ! -s "$TOKEN_FILE" ]; then
  echo "找不到 token 文件：$TOKEN_FILE" >&2
  echo "先把 PAT 写进去：printf '%s' 'ghp_xxx' > \"$TOKEN_FILE\" && chmod 600 \"$TOKEN_FILE\"" >&2
  exit 1
fi
TOKEN="$(tr -d '\r\n' < "$TOKEN_FILE")"
if [ -z "$TOKEN" ]; then
  echo "token 文件为空：$TOKEN_FILE" >&2
  exit 1
fi

api() { # method url [data]
  local method="$1" url="$2" data="${3:-}"
  if [ -n "$data" ]; then
    curl -sS -X "$method" -H "Authorization: Bearer $TOKEN" \
      -H 'Accept: application/vnd.github+json' -H 'X-GitHub-Api-Version: 2022-11-28' \
      "$url" -d "$data" -w '\n%{http_code}'
  else
    curl -sS -X "$method" -H "Authorization: Bearer $TOKEN" \
      -H 'Accept: application/vnd.github+json' -H 'X-GitHub-Api-Version: 2022-11-28' \
      "$url" -w '\n%{http_code}'
  fi
}

echo "==> 检查 $OWNER/$REPO 是否存在"
code=$(curl -sS -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" \
  "https://api.github.com/repos/$OWNER/$REPO")
if [ "$code" = "200" ]; then
  echo "仓库已存在，跳过创建"
elif [ "$code" = "404" ]; then
  echo "==> 创建仓库"
  resp=$(api POST "https://api.github.com/user/repos" "$(printf '{"name":"%s","description":%s,"private":false,"has_issues":true,"has_discussions":false}' "$REPO" "$(printf '%s' "$DESCRIPTION" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))')")")
  echo "$resp" | tail -1 | grep -Eq '^20[01]$' || { echo "创建失败：$resp" >&2; exit 1; }
else
  echo "无法确认仓库状态（HTTP $code），token 可能无效" >&2
  exit 1
fi

echo "==> 设置 description"
api PATCH "https://api.github.com/repos/$OWNER/$REPO" \
  "$(printf '{"description":%s}' "$(printf '%s' "$DESCRIPTION" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))')")" \
  | tail -1 | grep -Eq '^200$' || echo "description 设置失败（可忽略，可手动改）"

echo "==> 设置 topics: $TOPICS"
TOPIC_JSON=$(python3 -c 'import json,sys;print(json.dumps({"names":sys.argv[1:]}))' $TOPICS)
api PUT "https://api.github.com/repos/$OWNER/$REPO/topics" "$TOPIC_JSON" \
  | tail -1 | grep -Eq '^200$' || echo "topics 设置失败（可忽略，可手动改）"

echo "==> 推送 main"
cd "$ROOT"
git remote remove github >/dev/null 2>&1 || true
askpass=$(mktemp)
cat > "$askpass" <<ASKPASS
#!/bin/sh
case "\$1" in
  *Username*) printf '%s' '$OWNER' ;;
  *) printf '%s' '$TOKEN' ;;
esac
ASKPASS
chmod 700 "$askpass"
GIT_ASKPASS="$askpass" GIT_TERMINAL_PROMPT=0 \
  git push "https://github.com/$OWNER/$REPO.git" main
rm -f "$askpass"
git remote remove github >/dev/null 2>&1 || true

echo "==> 完成：https://github.com/$OWNER/$REPO"
echo "记得撤销这个 PAT。"
