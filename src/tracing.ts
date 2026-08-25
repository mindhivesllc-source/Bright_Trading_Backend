import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

if (endpoint) {
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]:
        process.env.OTEL_SERVICE_NAME ?? 'bright-trading-backend',
    }),

    traceExporter: new OTLPTraceExporter({
      url: `${endpoint}/v1/traces`,
    }),

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
    'OTEL_EXPORTER_OTLP_ENDPOINT not set — tracing disabled.',
  );
}
