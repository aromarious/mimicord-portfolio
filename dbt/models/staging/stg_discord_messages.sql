-- すべてのメッセージの JSON ファイルを読み込む
WITH source_data AS (
    SELECT
        *,
        filename AS source_file
    FROM {{ source('discord', 'messages') }}
)

SELECT
    attachments,
    source_file,
    id AS message_id,
    timestamp AS message_timestamp,
    contents AS message_content,
    regexp_extract(source_file, 'c([0-9]+)', 1) AS channel_id
FROM source_data
