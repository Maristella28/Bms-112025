#!/bin/bash

# =============================================================================
# Enterprise Backup Script for Barangay Management System
# =============================================================================
# This script provides comprehensive backup functionality for:
# - Database backups with compression
# - File storage backups
# - Configuration backups
# - Automated cleanup of old backups
# - Email notifications for backup status
# =============================================================================

# Configuration
BACKUP_DIR="/backups"
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USERNAME:-root}"
DB_PASS="${DB_PASSWORD:-}"
DB_NAME="${DB_DATABASE:-bms}"
APP_DIR="/var/www/html"
RETENTION_DAYS=30
LOG_FILE="/var/log/backup.log"
EMAIL_RECIPIENT="${BACKUP_EMAIL:-admin@barangay.gov.ph}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Create backup directory if it doesn't exist
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log "Created backup directory: $BACKUP_DIR"
    fi
}

# Database backup function
backup_database() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/db_backup_${timestamp}.sql.gz"
    
    log "Starting database backup..."
    
    # Create database backup with compression
    # Note: --add-drop-table is used but AUTO_INCREMENT values may be lost during restore
    # The post-restore migration will fix AUTO_INCREMENT issues automatically
    if mysqldump --single-transaction \
                 --routines \
                 --triggers \
                 --add-drop-table \
                 --add-locks \
                 --create-options \
                 --disable-keys \
                 --extended-insert \
                 --quick \
                 --lock-tables=false \
                 --complete-insert \
                 -h "$DB_HOST" \
                 -u "$DB_USER" \
                 -p"$DB_PASS" \
                 "$DB_NAME" | gzip > "$backup_file"; then
        
        local size=$(du -h "$backup_file" | cut -f1)
        log "Database backup completed successfully: $backup_file ($size)"
        echo "$backup_file"
    else
        error "Database backup failed!"
        return 1
    fi
}

# File storage backup function
backup_storage() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/storage_backup_${timestamp}.tar.gz"
    
    log "Starting file storage backup..."
    
    # Backup storage directory
    if tar -czf "$backup_file" -C "$APP_DIR" storage/; then
        local size=$(du -h "$backup_file" | cut -f1)
        log "File storage backup completed successfully: $backup_file ($size)"
        echo "$backup_file"
    else
        error "File storage backup failed!"
        return 1
    fi
}

# Configuration backup function
backup_config() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/config_backup_${timestamp}.tar.gz"
    
    log "Starting configuration backup..."
    
    # Backup configuration files
    if tar -czf "$backup_file" \
             -C "$APP_DIR" \
             .env \
             config/ \
             composer.json \
             composer.lock \
             package.json \
             package-lock.json; then
        
        local size=$(du -h "$backup_file" | cut -f1)
        log "Configuration backup completed successfully: $backup_file ($size)"
        echo "$backup_file"
    else
        error "Configuration backup failed!"
        return 1
    fi
}

# Uploads backup function
backup_uploads() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/uploads_backup_${timestamp}.tar.gz"
    
    log "Starting uploads backup..."
    
    # Backup public uploads directory
    if tar -czf "$backup_file" -C "$APP_DIR" public/uploads/; then
        local size=$(du -h "$backup_file" | cut -f1)
        log "Uploads backup completed successfully: $backup_file ($size)"
        echo "$backup_file"
    else
        error "Uploads backup failed!"
        return 1
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    local deleted_count=0
    
    # Find and delete old database backups
    while IFS= read -r -d '' file; do
        rm "$file"
        ((deleted_count++))
        log "Deleted old backup: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -print0)
    
    # Find and delete old storage backups
    while IFS= read -r -d '' file; do
        rm "$file"
        ((deleted_count++))
        log "Deleted old backup: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "storage_backup_*.tar.gz" -mtime +$RETENTION_DAYS -print0)
    
    # Find and delete old config backups
    while IFS= read -r -d '' file; do
        rm "$file"
        ((deleted_count++))
        log "Deleted old backup: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "config_backup_*.tar.gz" -mtime +$RETENTION_DAYS -print0)
    
    # Find and delete old uploads backups
    while IFS= read -r -d '' file; do
        rm "$file"
        ((deleted_count++))
        log "Deleted old backup: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "uploads_backup_*.tar.gz" -mtime +$RETENTION_DAYS -print0)
    
    log "Cleanup completed. Deleted $deleted_count old backup files."
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    local backup_type="$2"
    
    log "Verifying $backup_type backup: $(basename "$backup_file")"
    
    case "$backup_type" in
        "database")
            if gzip -t "$backup_file" 2>/dev/null; then
                log "Database backup integrity verified"
                return 0
            else
                error "Database backup integrity check failed!"
                return 1
            fi
            ;;
        "storage"|"config"|"uploads")
            if tar -tzf "$backup_file" >/dev/null 2>&1; then
                log "$backup_type backup integrity verified"
                return 0
            else
                error "$backup_type backup integrity check failed!"
                return 1
            fi
            ;;
    esac
}

# Send email notification
send_notification() {
    local status="$1"
    local message="$2"
    local backup_files="$3"
    
    if [ -n "$EMAIL_RECIPIENT" ]; then
        local subject="Backup $status - $(date '+%Y-%m-%d %H:%M:%S')"
        local body="Backup Status: $status\n\n$message\n\nBackup Files:\n$backup_files\n\nTimestamp: $(date)\nServer: $(hostname)"
        
        echo -e "$body" | mail -s "$subject" "$EMAIL_RECIPIENT" 2>/dev/null || {
            warning "Failed to send email notification"
        }
    fi
}

# Get backup statistics
get_backup_stats() {
    local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    local file_count=$(find "$BACKUP_DIR" -type f | wc -l)
    
    echo "Total backup size: $total_size"
    echo "Total backup files: $file_count"
}

# Main backup function
main() {
    local start_time=$(date +%s)
    local backup_files=""
    local failed_backups=""
    
    log "Starting comprehensive backup process..."
    
    # Create backup directory
    create_backup_dir
    
    # Database backup
    if db_backup=$(backup_database); then
        if verify_backup "$db_backup" "database"; then
            backup_files="$backup_files\n$db_backup"
        else
            failed_backups="$failed_backups\nDatabase backup verification failed"
        fi
    else
        failed_backups="$failed_backups\nDatabase backup failed"
    fi
    
    # Storage backup
    if storage_backup=$(backup_storage); then
        if verify_backup "$storage_backup" "storage"; then
            backup_files="$backup_files\n$storage_backup"
        else
            failed_backups="$failed_backups\nStorage backup verification failed"
        fi
    else
        failed_backups="$failed_backups\nStorage backup failed"
    fi
    
    # Configuration backup
    if config_backup=$(backup_config); then
        if verify_backup "$config_backup" "config"; then
            backup_files="$backup_files\n$config_backup"
        else
            failed_backups="$failed_backups\nConfiguration backup verification failed"
        fi
    else
        failed_backups="$failed_backups\nConfiguration backup failed"
    fi
    
    # Uploads backup
    if uploads_backup=$(backup_uploads); then
        if verify_backup "$uploads_backup" "uploads"; then
            backup_files="$backup_files\n$uploads_backup"
        else
            failed_backups="$failed_backups\nUploads backup verification failed"
        fi
    else
        failed_backups="$failed_backups\nUploads backup failed"
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Calculate total time
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local duration_formatted=$(printf '%02d:%02d:%02d' $((duration/3600)) $((duration%3600/60)) $((duration%60)))
    
    # Get backup statistics
    local stats=$(get_backup_stats)
    
    # Determine overall status
    if [ -z "$failed_backups" ]; then
        local status="SUCCESS"
        local message="All backups completed successfully in $duration_formatted\n\n$stats"
        log "Backup process completed successfully in $duration_formatted"
    else
        local status="PARTIAL"
        local message="Some backups failed in $duration_formatted\n\nFailed backups:$failed_backups\n\n$stats"
        warning "Backup process completed with some failures in $duration_formatted"
    fi
    
    # Send notification
    send_notification "$status" "$message" "$backup_files"
    
    log "Backup process finished. Status: $status"
    
    # Exit with appropriate code
    if [ -z "$failed_backups" ]; then
        exit 0
    else
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "database")
        create_backup_dir
        backup_database
        ;;
    "storage")
        create_backup_dir
        backup_storage
        ;;
    "config")
        create_backup_dir
        backup_config
        ;;
    "uploads")
        create_backup_dir
        backup_uploads
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "stats")
        get_backup_stats
        ;;
    "verify")
        if [ -n "$2" ]; then
            verify_backup "$2" "database"
        else
            error "Please provide backup file path for verification"
            exit 1
        fi
        ;;
    *)
        main
        ;;
esac
