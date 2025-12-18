#!/bin/bash

# ShieldMaiden - Cleanup Script
# Removes Flight Tracker legacy files and keeps only Security/File Sharing infrastructure

echo "🧹 Cleaning up Flight Tracker legacy code..."

# Files to remove
FILES_TO_REMOVE=(
  # Flight Controllers
  "backend/controllers/flightController.js"
  "backend/controllers/alertController.js"
  "backend/controllers/geofenceController.js"
  
  # Flight Models
  "backend/models/Flight.js"
  "backend/models/Alert.js"
  
  # Frontend Components
  "frontend/src/components/Map/FlightMap.tsx"
  "frontend/src/components/Alerts/AlertManager.tsx"
)

# Create backup directory
BACKUP_DIR="backup_flight_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup in $BACKUP_DIR..."

# Remove files
for file in "${FILES_TO_REMOVE[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ Removing $file"
    # Backup before removing
    mkdir -p "$BACKUP_DIR/$(dirname $file)"
    cp "$file" "$BACKUP_DIR/$file" 2>/dev/null
    rm "$file"
  else
    echo "  ⊘ $file not found (already removed)"
  fi
done

echo ""
echo "✅ Cleanup complete!"
echo "📁 Backup saved to: $BACKUP_DIR"
echo ""
echo "Files kept for ShieldMaiden (Secure File Sharing):"
echo "  ✓ User.js (authentication)"
echo "  ✓ FileMetadata.js (file tracking)"
echo "  ✓ AuditService.js (security logs)"
echo "  ✓ VaultService.js (encryption)"
echo ""
