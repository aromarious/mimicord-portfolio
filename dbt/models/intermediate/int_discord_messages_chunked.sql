WITH base AS (
    SELECT * FROM {{ ref('int_discord_messages_cleaned') }}
    WHERE cleaned_content != ''
),

time_diff AS (
    SELECT
        *,
        lag(message_timestamp) OVER (
            ORDER BY message_timestamp
        ) AS prev_timestamp
    FROM base
),

new_chunk_flag AS (
    SELECT
        *,
        CASE
            WHEN prev_timestamp IS NULL THEN 1
            -- 前のメッセージから指定秒数以上経過していたら新しいチャンクにする
            WHEN date_diff('second', prev_timestamp, message_timestamp) >= {{ var('chunk_gap_seconds') }}
                THEN 1
            ELSE 0
        END AS is_new_chunk
    FROM time_diff
),

chunk_groups AS (
    SELECT
        *,
        sum(is_new_chunk) OVER (
            ORDER BY message_timestamp
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS chunk_id
    FROM new_chunk_flag
)

SELECT
    chunk_id,
    min(message_timestamp) AS start_at,
    max(message_timestamp) AS end_at,
    count(*) AS message_count,
    string_agg(
        cleaned_content, chr(10) ORDER BY message_timestamp
    ) AS combined_content
FROM chunk_groups
GROUP BY chunk_id
HAVING length(combined_content) >= 10
