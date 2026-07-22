#!/bin/bash
BACKUP_DIR=/opt/infrapilot/backups
mkdir -p $BACKUP_DIR
docker compose -f /opt/infrapilot/docker-compose.yml exec -T db \
  pg_dump -U infrapilot InfraPilot | gzip > $BACKUP_DIR/db_$(date +%Y%m%d_%H%M).sql.gz

# Usuń backupy starsze niż 14 dni
find $BACKUP_DIR -name "*.sql.gz" -mtime +14 -delete

chmod +x /opt/infrapilot/ops/backup.sh
# Cron — backup codziennie o 3:00
(crontab -l; echo "0 3 * * * /opt/infrapilot/ops/backup.sh") | crontab -
