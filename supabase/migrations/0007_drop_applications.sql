-- The per-job application tracker was removed from the panel. Drops its table
-- (including the single saved row, deleted at the owner's request) and function.
drop function if exists stats_applications();
drop table if exists applications;
