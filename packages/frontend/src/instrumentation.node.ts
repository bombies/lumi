import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';

const sdk = new NodeSDK({
	traceExporter: new ConsoleSpanExporter(),
	spanProcessor: new SimpleSpanProcessor(new OTLPTraceExporter()),
});
sdk.start();
