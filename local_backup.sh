#!/bin/bash

# ============================================================
#  chess-vision — Smart Backup Script
#  Version: 2.0
# ============================================================

# --- SETTINGS ---
DESKTOP_BACKUP="$HOME/Documents/chess-vision_backup"
OTHER_DISK_BACKUP="/mnt/Data/chess-vision_backup"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ============================================================
# Logging
# ============================================================
log_info()    { echo -e "${CYAN}[INFO]${NC}  $1"; }
log_success() { echo -e "${GREEN}[✓]${NC}    $1"; }
log_warn()    { echo -e "${YELLOW}[⚠]${NC}    $1"; }
log_error()   { echo -e "${RED}[✗]${NC}    $1"; }

# ============================================================
# Resolve target directory
#
# Logic:
#   - If chess-vision/ exists AND last modified < 24 hours ago
#     → same day → use chess-vision_2, _3 ...
#   - If chess-vision/ doesn't exist OR 24+ hours have passed
#     → new day → delete old numbered folders,
#       delete chess-vision/ and recreate fresh
# ============================================================
resolve_target_dir() {
    local base="$1"
    local main="$base/chess-vision"
    local now
    now=$(date +%s)

    if [ -d "$main" ]; then
        local mtime
        mtime=$(stat -c %Y "$main" 2>/dev/null || stat -f %m "$main" 2>/dev/null)
        local age=$(( now - mtime ))

        if [ "$age" -lt 86400 ]; then
            # Same day → find next available _N slot
            local counter=2
            while [ -d "${base}/chess-vision_${counter}" ]; do
                (( counter++ ))
            done
            echo "${base}/chess-vision_${counter}"
            return
        else
            # 24+ hours passed → new day, clean up old backups
            find "$base" -maxdepth 1 -type d -name "chess-vision_[0-9]*" 2>/dev/null \
                | while read -r old; do
                    log_warn "Deleted old backup: $old"
                    rm -rf "$old"
                done
            log_warn "Deleted stale main backup: $main"
            rm -rf "$main"
            echo "$main"
            return
        fi
    fi

    # Main folder doesn't exist — clean up any stray numbered folders
    find "$base" -maxdepth 1 -type d -name "chess-vision_[0-9]*" 2>/dev/null \
        | while read -r old; do
            log_warn "Removed leftover folder: $old"
            rm -rf "$old"
        done

    echo "$main"
}

# ============================================================
# Run backup
# ============================================================
perform_backup() {
    local base="$1"
    local label="$2"

    echo ""
    echo -e "${BOLD}${BLUE}━━━ $label ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Check if target disk is mounted
    if [[ "$base" == /mnt/* ]]; then
        local mount_point="/mnt/Data"
        if ! mountpoint -q "$mount_point" 2>/dev/null; then
            log_warn "$mount_point is not mounted — skipping."
            return 1
        fi
    fi

    local target
    target=$(resolve_target_dir "$base")

    mkdir -p "$target" || { log_error "Could not create directory: $target"; return 1; }

    log_info "Target: $target"
    log_info "Copying files..."

    rsync -a --delete \
        --exclude 'node_modules/' \
        --exclude '.git/' \
        --exclude '.next/' \
        --exclude 'dist/' \
        --exclude 'build/' \
        --exclude '*.log' \
        --exclude '.env.local' \
        --exclude '.DS_Store' \
        --info=progress2 \
        ./ "$target/" 2>&1

    if [ $? -eq 0 ]; then
        local size
        size=$(du -sh "$target" 2>/dev/null | cut -f1)
        log_success "Backup complete → $target  (${size}B)"
    else
        log_error "rsync failed: $target"
        return 1
    fi
}

# ============================================================
# Summary
# ============================================================
print_summary() {
    echo ""
    echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}  🚀  All backups finished!${NC}"
    echo -e "  Date: $(date '+%d %B %Y, %H:%M:%S')"
    echo ""

    if [ -d "$DESKTOP_BACKUP" ]; then
        echo -e "${CYAN}  Documents:${NC}"
        ls -1 "$DESKTOP_BACKUP" 2>/dev/null | while read -r d; do
            local sz
            sz=$(du -sh "$DESKTOP_BACKUP/$d" 2>/dev/null | cut -f1)
            echo -e "    📁 $d  (${sz}B)"
        done
    fi

    if [ -d "$OTHER_DISK_BACKUP" ]; then
        echo -e "${CYAN}  Data disk:${NC}"
        ls -1 "$OTHER_DISK_BACKUP" 2>/dev/null | while read -r d; do
            local sz
            sz=$(du -sh "$OTHER_DISK_BACKUP/$d" 2>/dev/null | cut -f1)
            echo -e "    📁 $d  (${sz}B)"
        done
    fi

    echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ============================================================
# MAIN
# ============================================================
echo -e "${BOLD}${CYAN}"
echo "  ╔════════════════════════════════════╗"
echo "  ║   chess-vision  Backup  v2.0       ║"
echo "  ╚════════════════════════════════════╝"
echo -e "${NC}"

# Sanity check — are we in the right directory?
if [ ! -f "./package.json" ] && [ ! -d "./src" ] && [ "$(ls -A . 2>/dev/null)" = "" ]; then
    log_warn "Current directory looks empty. Are you in the right project folder?"
    read -rp "  Continue anyway? (y/N): " confirm
    [[ "$confirm" =~ ^[Yy]$ ]] || { log_error "Aborted."; exit 1; }
fi

perform_backup "$DESKTOP_BACKUP" "Documents Backup"
DESKTOP_STATUS=$?

perform_backup "$OTHER_DISK_BACKUP" "Data Disk Backup"
OTHER_STATUS=$?

print_summary

if [ $DESKTOP_STATUS -ne 0 ] && [ $OTHER_STATUS -ne 0 ]; then
    log_error "Both backups failed!"
    exit 1
elif [ $DESKTOP_STATUS -ne 0 ] || [ $OTHER_STATUS -ne 0 ]; then
    log_warn "One backup failed, the other completed."
    exit 2
fi

exit 0