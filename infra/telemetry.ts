import { $region } from './utils';

export const otelExporter = new sst.aws.Function('TelemetryExporter', {
	url: true,
	handler: '',
	layers: [$interpolate`arn:aws:lambda:${$region}:901920570463:layer:aws-otel-nodejs-amd64-ver-1-30-2:1`],
	copyFiles: [
		{
			from: 'collector.yaml',
		},
	],
});
