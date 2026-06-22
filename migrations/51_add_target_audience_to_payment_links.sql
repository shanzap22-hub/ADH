-- Migration: Add target_audience column to payment_links table
-- This allows admins to specify if a payment link is for a New Student or an Existing Student.

ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'new';
