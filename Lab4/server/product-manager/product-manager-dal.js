// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

//TODO: Use Partition manager to get the tablename and definition instead of hardcoding in DAL

'use strict';

const logManager = require('/opt/nodejs/log-manager.js');
const helper = require('/opt/nodejs/helper.js');
const metricsManager = require('/opt/nodejs/metrics-manager.js');
const doc = require('dynamodb-doc');
const dynamodb = new doc.DynamoDB();

const tableName = "Product";
const tableDefinition = {
    AttributeDefinitions: [ 
    {
      AttributeName: "ProductId", 
      AttributeType: "S"
    } ], 
    KeySchema: [ 
    {
      AttributeName: "ProductId", 
      KeyType: "HASH"
    } ], 
    ProvisionedThroughput: {
     ReadCapacityUnits: 5, 
     WriteCapacityUnits: 5
    }, 
    TableName: tableName
};

// Get a product from DynamoDB
module.exports.getProduct = function(event, callback) {
    logManager.log(event, "ProductManager", { "Message": "DAL GetProduct() called.", "ProductId" : event.pathParameters.resourceId});

    const start = new Date().getTime();
    const params = {
        "TableName": tableName,
        "Key": {
            ProductId: event.pathParameters.resourceId
        }
    };

    dynamodb.getItem(params, (err, data) => {
        let response;
        if (err)
            response = createResponse(500, err);
        else
            response = createResponse(200, data.Item ? data.Item.doc : null);

        const end = new Date().getTime();
        metricsManager.recordMetricEvent(event, "ProductManager", "GetProduct", event, end - start);
        callback(response);
    });
    
};

// Add or update a product to DynamoDB
module.exports.updateProduct = (event, callback) => {
    logManager.log(event, "ProductManager", {"Message": "DAL UpdateProduct() called.", "ProductId" : event.pathParameters.resourceId});

    const start = new Date().getTime();    
    helper.createTable(tableDefinition, function() {
        const item = {
            "ProductId": event.pathParameters.resourceId,
            "doc": event.body
        };

        const params = {
            "TableName": tableName,
            "Item": item
        };
        
        dynamodb.putItem(params, (err) => {
            let response;
            if (err)
                response = createResponse(500, err);
            else
                response = createResponse(200, null);
            
            const end = new Date().getTime();
            metricsManager.recordMetricEvent(event, "ProductManager", "UpdateProduct", event, end - start);   
            callback(response);
        });        
    });
};

// delete a product from DynamoDB
module.exports.deleteProduct = (event, callback) => {
    logManager.log(event, "ProductManager", {"Message": "DAL deleteProduct() called.", "ProductId" : event.pathParameters.resourceId});

    const start = new Date().getTime();    
    const params = {
        "TableName": tableName,
        "Key": {
            "ProductId": event.pathParameters.resourceId
        }
    };

    dynamodb.deleteItem(params, (err) => {
        let response;
        if (err)
            response = createResponse(500, err);
        else
            response = createResponse(200, null);

        const end = new Date().getTime();
        metricsManager.recordMetricEvent(event, "ProductManager", "DeleteProduct", event, end - start);1
        callback(response);
    });
};

const createResponse = (statusCode, body) => {
    return {
        "statusCode": statusCode,
        "body": body || ""
    }
};