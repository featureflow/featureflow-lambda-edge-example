import Featureflow from 'featureflow-node-sdk';
import type { CloudFrontRequestEvent, CloudFrontResultResponse } from 'aws-lambda';

const featureflow = new Featureflow.Client({
  apiKey: process.env.FEATUREFLOW_SERVER_KEY ?? 'srv-env-YOUR_SERVER_ENVIRONMENT_KEY',
});

const REDIRECT_URLS: Record<string, string> = {
  original: 'https://featureflow.io',
  new: 'https://featureflow.com',
};

const DEFAULT_URL = 'https://www.featureflow.io/';

function getHeader(headers: CloudFrontRequestEvent['Records'][0]['cf']['request']['headers'], name: string): string {
  const entry = headers[name.toLowerCase()];
  return entry?.[0]?.value ?? '';
}

function redirectResponse(location: string): CloudFrontResultResponse {
  return {
    status: '302',
    statusDescription: 'Found',
    headers: {
      location: [{ key: 'Location', value: location }],
    },
  };
}

export const handler = async (event: CloudFrontRequestEvent): Promise<CloudFrontResultResponse> => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  const country = getHeader(headers, 'cloudfront-viewer-country') || 'US';
  const cohort = getHeader(headers, 'x-cohort') || 'none';

  const user = new Featureflow.UserBuilder('anonymous')
    .withAttribute('country', country)
    .withAttribute('cohort', cohort)
    .withAttributes('role', ['USER_ADMIN', 'BETA_CUSTOMER'])
    .build();

  await new Promise<void>((resolve, reject) => {
    featureflow.ready(((err?: Error | null) => (err ? reject(err) : resolve())) as () => void);
  });

  const variant = (featureflow as { evaluate(key: string, user?: unknown): { value(): string } })
    .evaluate('lambda-redirect', user)
    .value();
  console.log('variant', variant);
  const location = REDIRECT_URLS[variant] ?? DEFAULT_URL;
  console.log('location', location);
  return redirectResponse(location);
};
