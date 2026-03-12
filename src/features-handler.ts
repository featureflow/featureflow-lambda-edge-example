import Featureflow from 'featureflow-node-sdk';
import type { CloudFrontRequestEvent, CloudFrontResultResponse } from 'aws-lambda';

const featureflow = new Featureflow.Client({
  apiKey: process.env.FEATUREFLOW_SERVER_KEY ?? 'sdk-srv-env-054a632e4fc34ca08acda979ed3914d9',
});

function getHeader(headers: CloudFrontRequestEvent['Records'][0]['cf']['request']['headers'], name: string): string {
  const entry = headers[name.toLowerCase()];
  return entry?.[0]?.value ?? '';
}

function jsonResponse(body: Record<string, unknown>): CloudFrontResultResponse {
  return {
    status: '200',
    statusDescription: 'OK',
    headers: {
      'content-type': [{ key: 'Content-Type', value: 'application/json' }],
    },
    body: JSON.stringify(body),
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

  const features = (featureflow as { evaluateAll(user?: unknown): Record<string, string> }).evaluateAll(user);

  return jsonResponse({ features });
};
