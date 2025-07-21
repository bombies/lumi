import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import {
	AlwaysOnSampler,
	BatchSpanProcessor,
	TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-node';
import { registerOTel } from '@vercel/otel';

const exporter = new OTLPTraceExporter({
	url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
});

registerOTel({
	serviceName: 'your-service-name',
	traceSampler:
      process.env.NODE_ENV === 'development' ? new AlwaysOnSampler() : new TraceIdRatioBasedSampler(0.1),
	spanProcessors: [new BatchSpanProcessor(exporter)],
	traceExporter: exporter,
});
