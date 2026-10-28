import {
  logs,
} from '@opentelemetry/api-logs';

const logger =
  logs.getLogger(
    'posthog-exporter',
  );

export function logInventorySyncStarted(): void {
  logger.emit({
    severityText: 'INFO',
    body: 'inventory_sync_started',
    attributes: {
      sync_type: 'full',
    },
  });
}

export function logInventorySyncCompleted(
  processedRecords: number,
): void {
  logger.emit({
    severityText: 'INFO',
    body: 'inventory_sync_completed',
    attributes: {
      sync_type: 'full',
      processed_records: processedRecords,
    },
  });
}

export function logInventorySyncFailed(): void {
  logger.emit({
    severityText: 'ERROR',
    body: 'inventory_sync_failed',
    attributes: {
      sync_type: 'full',
    },
  });
}
