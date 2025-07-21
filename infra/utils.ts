export const appify = (val: string) => `lumi-${$app.stage}-${val}`;

const callerIdentity: $util.Output<aws.GetCallerIdentityResult> = aws.getCallerIdentityOutput();
export const $accountId = callerIdentity.accountId;
export const $region = aws.getRegionOutput().name;
