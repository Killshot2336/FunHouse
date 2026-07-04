-- Exclude recycling and mopping from daily chore pool
UPDATE master_tasks SET active = false WHERE name IN ('Recycling', 'Floors');
