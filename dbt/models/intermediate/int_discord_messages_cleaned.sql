WITH source_data AS (
    SELECT * FROM {{ ref('stg_discord_messages') }}
    WHERE channel_id = '419875893876490254'
),

url_labeled AS (
    SELECT
        *,
        -- URLのラベル化
        regexp_replace(
            message_content,
            'https?://[^\s{}|\\^~\[\]<>]+',
            '[URL]',
            'g'
        ) AS content_url_labeled
    FROM source_data
),

mentions_removed AS (
    SELECT
        *,
        -- ユーザー、ロール、チャンネルメンションの除去
        regexp_replace(
            content_url_labeled,
            '<@!?\d+>|<@&\d+>|<#\d+>',
            '',
            'g'
        ) AS content_mentions_removed
    FROM url_labeled
),

laugh_normalized AS (
    SELECT
        *,
        -- 連続する「w」「ｗ」を単一の「w」に正規化（トピック抽出のノイズ削減）
        -- 半角全角問わず、2文字以上連続する場合は "w" 1文字に置換
        regexp_replace(
            content_mentions_removed,
            '[wｗWＷ]{4,}',
            'ｗｗｗ',
            'g'
        ) AS content_laugh_normalized
    FROM mentions_removed
),

final AS (
    SELECT
        *,
        trim(content_laugh_normalized) AS cleaned_content
    FROM laugh_normalized
)

SELECT
    attachments,
    source_file,
    message_id,
    message_timestamp,
    message_content,
    channel_id,
    cleaned_content
FROM final
