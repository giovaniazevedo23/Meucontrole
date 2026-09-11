import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Criar a Tabela do DynamoDB
    const itemsTable = new dynamodb.Table(this, 'ItemsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Free tier friendly
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Para ambiente de dev
    });

    // 2. Criar a Função Lambda
    const apiHandler = new lambda.Function(this, 'ApiHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      handler: 'index.handler',
      environment: {
        TABLE_NAME: itemsTable.tableName,
      },
    });

    // Dar permissão para a Lambda ler e escrever no DynamoDB
    itemsTable.grantReadWriteData(apiHandler);

    // 3. Criar o API Gateway
    const api = new apigateway.RestApi(this, 'ItemsApi', {
      restApiName: 'Estoque Service',
      description: 'API para controle de estoque de produtos.',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const getItemsIntegration = new apigateway.LambdaIntegration(apiHandler);

    // Definir rotas da API
    // /items
    const items = api.root.addResource('items');
    items.addMethod('GET', getItemsIntegration);
    items.addMethod('POST', getItemsIntegration);

    // /items/{id}
    const singleItem = items.addResource('{id}');
    singleItem.addMethod('GET', getItemsIntegration);
    singleItem.addMethod('PUT', getItemsIntegration);
    singleItem.addMethod('DELETE', getItemsIntegration);
  }
}
