#!/bin/bash
set -e

# ==============================================================================
# Mimicord Portfolio Upstream Sync Script
# ==============================================================================
# このスクリプトは、履歴をクリーン（単一コミット）に保ったまま、
# upstream リモートの最新状態をポートフォリオ・スナップショットに反映します。
#
# 使用方法:
#   ./scripts/sync-upstream.sh           # 実行
#   ./scripts/sync-upstream.sh --dry-run # 変更内容をプレビュー（実際には変更しない）
# ==============================================================================

# ==============================================================================
# 除外するディレクトリ（upstream にあるがポートフォリオには持ってこない）
# ==============================================================================
EXCLUDE_DIRS=(
  "obsolete-docs"
  # 必要に応じて追加
)

# ==============================================================================
# オプション解析
# ==============================================================================
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "🔍 DRY-RUN モード: 変更内容をプレビューします（実際には変更しません）"
  echo ""
fi

echo "--- 1. Fetching latest from upstream..."
git fetch upstream

echo "--- 2. Building exclude pathspec..."
EXCLUDE_PATHSPEC=()
for dir in "${EXCLUDE_DIRS[@]}"; do
  EXCLUDE_PATHSPEC+=(":(exclude)${dir}")
  echo "  除外: ${dir}"
done

echo "--- 3. Checking files to update from upstream/main..."
if [[ "$DRY_RUN" == true ]]; then
  # dry-run: 変更されるファイルをリスト表示
  echo "  以下のファイルが更新されます:"
  # 除外パターンを考慮した diff
  CHANGED_FILES=$(git diff HEAD upstream/main --name-only -- . "${EXCLUDE_PATHSPEC[@]}" 2>/dev/null || true)
  if [[ -n "$CHANGED_FILES" ]]; then
    echo "$CHANGED_FILES" | while read -r file; do
      echo "    更新: $file"
    done
  else
    echo "    （変更なし）"
  fi
else
  git checkout upstream/main -- . "${EXCLUDE_PATHSPEC[@]}"
fi

echo "--- 4. Checking files deleted in upstream..."
DELETED_FILES=$(git diff upstream/main --name-only --diff-filter=D 2>/dev/null || true)
if [[ -n "$DELETED_FILES" ]]; then
  while IFS= read -r file; do
    # 除外ディレクトリ内のファイルは無視
    SKIP=false
    for exclude in "${EXCLUDE_DIRS[@]}"; do
      if [[ "$file" == "$exclude"* ]]; then
        SKIP=true
        break
      fi
    done
    if [[ "$SKIP" == false && -f "$file" ]]; then
      if [[ "$DRY_RUN" == true ]]; then
        echo "  削除予定: $file"
      else
        echo "  削除: $file"
        git rm -f "$file" 2>/dev/null || true
      fi
    fi
  done <<< "$DELETED_FILES"
else
  echo "  削除対象なし"
fi

echo "--- 5. README.md portfolio notice..."
if [[ "$DRY_RUN" == true ]]; then
  echo "  README.md の冒頭にポートフォリオ用注意書きを挿入します"
else
  # README.md の冒頭に注意書きを挿入
  # macOS の sed 互換性を考慮した記述
  sed -i '' '1i\
# Mimicord (Portfolio Snapshot)\
\
> [!CAUTION]\
> **これはポートフォリオ用に作成されたスナップショットであり、このリポジトリ上での動作を意図していません。**\
> 動作に必要なデータベース接続情報や環境変数、一部の構築済みファイルはセキュリティの観点から除外されています。\
> オリジナルの開発環境とは異なりますのでご注意ください。\
\
---\
' README.md
fi

echo "--- 6. Committing changes..."
if [[ "$DRY_RUN" == true ]]; then
  echo "  git add . && git commit --amend --no-edit を実行します"
else
  git add .
  git commit --amend --no-edit
fi

echo ""
if [[ "$DRY_RUN" == true ]]; then
  echo "🔍 DRY-RUN 完了"
  echo "実際に同期するには、--dry-run オプションなしで実行してください："
  echo "  ./scripts/sync-upstream.sh"
else
  echo "✅ Upstream sync complete!"
  echo "履歴を汚さずに最新状態が取り込まれ、単一のコミットに集約されました。"
  echo "リモートを更新するには、以下のコマンドを実行してください："
  echo "  git push -f origin main"
fi
