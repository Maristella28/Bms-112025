# Database Restore Issues & Fix Guide

## Problem Overview

When restoring a database from a backup, several issues can occur that cause functionality to break:

### Common Issues After Database Restore:

1. **AUTO_INCREMENT Values Lost**
   - The `id` columns lose their AUTO_INCREMENT property
   - Error: `Field 'id' doesn't have a default value`
   - This happens because tables are dropped and recreated during restore

2. **Foreign Key Constraints Disabled**
   - Foreign keys may be disabled during restore
   - Can cause referential integrity issues

3. **Indexes Missing**
   - Some indexes might not be properly restored
   - Can cause performance degradation

4. **SQL_MODE Issues**
   - SQL_MODE might be set incorrectly during restore
   - Can cause unexpected behavior

## Solution

### Automatic Fix Migration

A post-restore migration has been created that automatically fixes these issues:

**File:** `database/migrations/2025_11_20_200000_fix_database_after_restore.php`

This migration:
- ✅ Automatically detects all tables with `id` columns
- ✅ Restores AUTO_INCREMENT property on all primary key `id` columns
- ✅ Sets AUTO_INCREMENT values to the next available ID
- ✅ Re-enables foreign key constraints
- ✅ Resets SQL_MODE to proper values

### How It Works

1. **During Restore** (via BackupController):
   - The restore process automatically runs the post-restore fix migration
   - No manual intervention needed

2. **Manual Fix** (if needed):
   ```bash
   php artisan migrate --path=database/migrations/2025_11_20_200000_fix_database_after_restore.php
   ```

3. **For Specific Tables** (if migration doesn't catch them):
   ```sql
   -- Fix AUTO_INCREMENT for a specific table
   ALTER TABLE `table_name` MODIFY COLUMN `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
   
   -- Set AUTO_INCREMENT to next available ID
   SELECT MAX(id) FROM `table_name`; -- Get max ID
   ALTER TABLE `table_name` AUTO_INCREMENT = [max_id + 1];
   ```

## Best Practices for Database Backups

### Creating Backups

The backup script (`scripts/backup.sh`) includes:
- `--single-transaction`: Ensures consistent backup
- `--routines`: Includes stored procedures
- `--triggers`: Includes triggers
- `--complete-insert`: More detailed INSERT statements

### Restoring Backups

1. **Via UI** (Recommended):
   - Use the Backup Management interface
   - The restore process automatically runs the fix migration

2. **Via Command Line**:
   ```bash
   # Restore database
   mysql -u username -p database_name < backup_file.sql
   
   # Run post-restore fix
   php artisan migrate --path=database/migrations/2025_11_20_200000_fix_database_after_restore.php
   ```

3. **Manual SQL Restore**:
   ```sql
   -- Disable foreign key checks
   SET FOREIGN_KEY_CHECKS=0;
   
   -- Restore database
   SOURCE backup_file.sql;
   
   -- Re-enable foreign key checks
   SET FOREIGN_KEY_CHECKS=1;
   
   -- Run Laravel migrations to fix issues
   -- (via command line: php artisan migrate)
   ```

## Verification After Restore

After restoring, verify the database is working correctly:

1. **Check AUTO_INCREMENT**:
   ```sql
   SHOW CREATE TABLE activity_logs;
   -- Should show AUTO_INCREMENT in the id column definition
   ```

2. **Test Insert**:
   ```sql
   -- This should work without errors
   INSERT INTO activity_logs (user_id, action, description, created_at, updated_at)
   VALUES (1, 'test', 'Test entry', NOW(), NOW());
   ```

3. **Check Foreign Keys**:
   ```sql
   SELECT * FROM information_schema.TABLE_CONSTRAINTS 
   WHERE CONSTRAINT_TYPE = 'FOREIGN KEY' 
   AND TABLE_SCHEMA = 'your_database_name';
   ```

## Troubleshooting

### Issue: Migration says "Nothing to migrate"
- The migration has already been run
- Check if tables already have AUTO_INCREMENT: `SHOW CREATE TABLE table_name;`

### Issue: Some tables still have problems
- Manually fix specific tables using the SQL commands above
- Check Laravel logs for specific error messages

### Issue: Foreign key errors after restore
- Ensure foreign key constraints are enabled: `SET FOREIGN_KEY_CHECKS=1;`
- Verify referenced tables exist and have data

## Prevention

To prevent issues in the future:

1. **Always use the built-in backup/restore system** - It automatically handles fixes
2. **Test restores in a development environment first**
3. **Keep backups up to date**
4. **Document any manual changes** to database structure

## Related Files

- `backend/database/migrations/2025_11_20_200000_fix_database_after_restore.php` - Post-restore fix migration
- `backend/app/Http/Controllers/BackupController.php` - Restore controller with automatic fix
- `backend/scripts/backup.sh` - Backup script
- `backend/database/migrations/2025_11_20_000000_fix_activity_logs_auto_increment.php` - Specific fix for activity_logs

## Support

If you encounter issues:
1. Check Laravel logs: `storage/logs/laravel.log`
2. Check database error logs
3. Verify migration status: `php artisan migrate:status`
4. Run the fix migration manually if needed

