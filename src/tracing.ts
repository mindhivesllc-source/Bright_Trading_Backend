import 'dotenv/config';

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const posthogHost = process.env.POSTHOG_HOST;
const posthogProjectToken = process.env.POSTHOG_PROJECT_TOKEN;

if (!posthogHost || !posthogProjectToken) {
  if (process.env.NODE_ENV !== 'production') {
    const variable = posthogHost
      ? 'POSTHOG_PROJECT_TOKEN'
      : 'POSTHOG_HOST';

    // Warn instead of throwing: a missing analytics key must never stop the API.
    console.warn(
      `${variable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This warning stops appearing once ${variable} is configured`,
    );
  }
}

const logRecordProcessors =
  posthogHost && posthogProjectToken
    ? [
        new BatchLogRecordProcessor({
          exporter: new OTLPLogExporter({
            url: new URL('/i/v1/logs', posthogHost).toString(),
            headers: {
              Authorization: `Bearer ${posthogProjectToken}`,
            },
          }),
        }),
      ]
    : undefined;

if (endpoint || logRecordProcessors) {
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]:
        process.env.OTEL_SERVICE_NAME ?? 'bright-trading-backend',
    }),

    ...(endpoint
      ? {
          traceExporter: new OTLPTraceExporter({
            url: `${endpoint}/v1/traces`,
          }),
        }
      : {}),

    ...(logRecordProcessors
      ? { logRecordProcessors }
      : {}),

    instrumentations: [
      getNodeAutoInstrumentations(),
    ],
  });

  sdk.start();

  process.on('SIGTERM', () => {
    void sdk.shutdown();
  });
} else {
  console.log(
    'OpenTelemetry tracing and PostHog log export disabled because configuration is not set.',
  );
}
