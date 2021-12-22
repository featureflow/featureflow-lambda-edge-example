# lambda-edge-example
An example of using featureflow in lambda @ edge

Featureflow controls are incredibly powerful at directing logic within an application, they may be employed at any point in the application
stack and in multiple languages.

However, there are times, such as when deploying a complete re-write of an application, 
that you may wish to deploy the application as a separate resource, and manage the release as a load-balanced green-blue deployment.

A way to do this is to include the redirect logic in a Lambda@Edge function.

Featureflow provides a simple way to do this by adding real time control to a Lambda@Edge function. 

This example show how to use featureflow to control 302 redirects based on specific headers.

We will use the serverless framework to deploy the application, serverless greatly simplifies the creation and deployment of lambda functions.

A lambda @ edge function is deployed to cloudfront which will redirect based on a feature flag

    Request
        |
    featureflow-edge
    |           |
    blue   green

### Blue Green Static Deployments
Web Blue and Web Green are very simple deployments, 
serverless creates a cloudfront distribution for each.

The cloudfront distribution points to an s3 bucket which contains the contents of the build directory.

Each deployment has a unique domain name, `serverless deploy` gives a summary, e.g:

```shell
bucket:          website-whwv1y
distributionUrl: https://d2p2be3uxw9rcw.cloudfront.net
bucketUrl:       http://website-whwv1y.s3-website.us-east-1.amazonaws.com
url:             https://d2p2be3uxw9rcw.cloudfront.net

```


### Lambda @ Edge deployment
The edge deployment will too have it's own url, and a cloudfront distribution.

It will contain a lambda function which will be triggered by a cloudfront event.

This lambda function will be triggered by a cloudfront event, and will return a redirect to the correct blue/green deployment URL.

# Build and deploy
```shell
cd web-blue
npm build
serverless deploy
```

```shell
cd web-green
npm build
serverless deploy
```

```shell
cd featureflow-edge
npm build
serverless deploy
```

