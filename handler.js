'use strict';
var Featureflow = require('featureflow-node-sdk');

var featureflow = new Featureflow.Client({apiKey: 'sdk-srv-env-YOUR-KEY'});

exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;
  const country = headers['cloudfront-viewer-country'] ? headers['cloudfront-viewer-country'][0].value : "US";
  const cohort = headers['x-cohort'] ? headers['x-cohort'][0].value : "none";
  console.log(`country: ${country} cohort: ${cohort}`);
  let user = new Featureflow.UserBuilder("oliver@featureflow.io")
      .withAttribute('country', country)
      .withAttribute('cohort', cohort)
      .withAttributes('role', ['USER_ADMIN', 'BETA_CUSTOMER'])
      .build();
  await featureflow.waitForReady();
  let response;
  if (featureflow.evaluate('lambda-redirect', user).is("old")){
    response = {
      status: '302',
      statusDescription: 'Found',
      headers: {
        location: [{
          key: 'Location',
          value: 'https://featureflow.io'
        }],
      },
    };
  }else if (featureflow.evaluate('lambda-redirect', user).is("new")){
    response = {
      status: '302',
      statusDescription: 'Found',
      headers: {
        location: [{
          key: 'Location',
          value: 'https://featureflow.com'
        }],
      },
    };
  }else{
    response = {
      status: '302',
      statusDescription: 'Found',
      headers: {
        location: [{
          key: 'Location',
          value: 'https://www.featureflow.io/',
        }],
      },
    };
  }
  return response;
};
