const domain = 'lumi.ajani.me';
const environment = $app.stage === 'production' ? '' : `${$app.stage}.`;

export const webDNS = `${environment}${domain}`;
export const apiDNS = `api.${environment}${domain}`;
