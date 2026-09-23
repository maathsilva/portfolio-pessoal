-- The ?ref= campaigns table was removed from the panel; its query function is now unused.
-- (The ref/utm columns stay: the site still records them and they appear in the CSV export.)
drop function if exists stats_campaigns(int);
