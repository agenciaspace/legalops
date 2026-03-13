ALTER TABLE user_pipeline_entries
ADD COLUMN IF NOT EXISTS email_alias_id uuid REFERENCES user_email_aliases(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS user_pipeline_entries_email_alias_idx
  ON user_pipeline_entries (email_alias_id);

WITH preferred_aliases AS (
  SELECT DISTINCT ON (user_id)
    user_id,
    id
  FROM user_email_aliases
  WHERE status = 'active'
  ORDER BY user_id, is_primary DESC, created_at ASC
)
UPDATE user_pipeline_entries AS entries
SET email_alias_id = preferred_aliases.id
FROM preferred_aliases
WHERE entries.user_id = preferred_aliases.user_id
  AND entries.email_alias_id IS NULL
  AND entries.status IN ('applied', 'interview', 'offer');
