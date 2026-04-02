-- Migration 0002: add passwordHash and enforce unique email on users table

ALTER TABLE users
  ADD COLUMN passwordHash varchar(128),
  MODIFY email varchar(320) UNIQUE;
