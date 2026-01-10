---
description: upstream の変更を履歴を一本化したまま同期する
---

1. `upstream` リモートが設定されているか確認する（未設定の場合は `git remote add upstream git@github.com:aromarious/mimicord-app.git` を促す）
2. ローカルの `main` ブランチにいることを確認する
3. `scripts/sync-upstream.sh` を実行して同期を行う
// turbo
4. 同期が完了したら、`git push -f origin main` を実行してリモートを更新するようユーザに伝える
