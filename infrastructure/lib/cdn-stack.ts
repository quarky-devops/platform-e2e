import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export interface QuarkfinCdnStackProps extends cdk.StackProps {
  projectName: string;
  environment: string;
  loadBalancer: elbv2.ApplicationLoadBalancer;
}

export class QuarkfinCdnStack extends cdk.Stack {
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: QuarkfinCdnStackProps) {
    super(scope, id, props);

    // CloudFront distribution for global performance and basic security
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: `${props.projectName} ${props.environment} CDN`,
      
      // Default behavior (frontend)
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(props.loadBalancer, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          httpPort: 80,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        compress: true,
      },
      
      // Additional behavior for API
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.LoadBalancerV2Origin(props.loadBalancer, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
            httpPort: 8080,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // Don't cache API responses
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
      },
      
      // Geographic restrictions (optional security measure)
      geoRestriction: cloudfront.GeoRestriction.denylist(
        'CN', 'RU', 'KP', 'IR' // Block high-risk countries
      ),
      
      // Price class (optimize costs)
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US, Canada, Europe
      
      // Error pages
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      
      // Enable logging for security monitoring
      enableLogging: true,
      logBucket: undefined, // Use default bucket
      logFilePrefix: `${props.projectName}-${props.environment}/`,
    });

    // Outputs
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
      exportName: `${props.projectName}-${props.environment}-cdn-domain`,
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront distribution ID',
      exportName: `${props.projectName}-${props.environment}-cdn-id`,
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'Frontend URL (use this for app.quarkfin.ai CNAME)',
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: `https://${this.distribution.distributionDomainName}/api`,
      description: 'API URL',
    });
  }
}
