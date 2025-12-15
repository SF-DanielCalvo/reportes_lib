import { aws } from "aws_lib"
import * as config from "./config.mjs"

/**
 * Initialize AWS CloudWatch log group and stream.
 * Creates log group if it doesn't exist, then creates log stream if needed.
 * 
 * @param {string} LogGroupName - AWS CloudWatch log group name (required)
 * @param {string} LogStreamName - AWS CloudWatch log stream name (required)
 * @returns {Promise<Object>} Response object with initialization status
 * 
 * @example
 * const result = await Start_Logs_AWS_CloudWatch("/local/MyApp", "/local/MyApp/2024/01/15/10");
 * 
 * @example
 * const result = await Start_Logs_AWS_CloudWatch("/local/DataProcessor", "/local/DataProcessor/2024/01/15/11");
 */
export async function Start_Logs_AWS_CloudWatch(LogGroupName, LogStreamName) {
    try {
        const Verifications = Verification(LogGroupName, LogStreamName)
        if (Verifications.statusCode !== 200) {
            return Verifications
        }

        const result = await Call_Start_Logs_AWS_CloudWatch(LogGroupName, LogStreamName)

        return result
    } catch (error) {
        return {
            statusCode: 500,
            headers: defaultHeaders(),
            body: {
                Code: "InternalError",
                Message: "An error occurred while processing the request.",
                Error: error.message,
            },
        }
    }
}

//----------------------------------------------
//  FUNCTION: Initialize CloudWatch Logs
//----------------------------------------------
/**
 * Initialize AWS CloudWatch log group and stream resources.
 * 
 * @param {string} LogGroupName - CloudWatch log group name
 * @param {string} LogStreamName - CloudWatch log stream name
 * @returns {Object} Response object with initialization status
 */
async function Call_Start_Logs_AWS_CloudWatch(LogGroupName, LogStreamName) {
    let statusCode
    let body

    try {
        // Step 1: Check if log group exists
        const LogDescribe_Result = await aws.sdk.cloudwatch.LogGroup.DescribeLogGroups(LogGroupName)
        if (LogDescribe_Result.statusCode !== 200) {
            return LogDescribe_Result
        }

        // Step 2: Create log group if it doesn't exist
        if (LogDescribe_Result.body.LogGroups.length === 0) {
            const CreateGroup_Result = await aws.sdk.cloudwatch.LogGroup.CreateLogGroup(
                LogGroupName, 
                undefined, 
                undefined, 
                config.AMAZON_LOG_GROUP_CLASS
            )
            if (CreateGroup_Result.statusCode !== 200) {
                return CreateGroup_Result
            }
        }

        // Step 3: Check if log stream exists
        const LogStreamDescribe = await aws.sdk.cloudwatch.LogStream.DescribeLogStreams(LogGroupName, LogStreamName)
        if (LogStreamDescribe.statusCode !== 200) {
            return LogStreamDescribe
        }

        // Step 4: Create log stream if it doesn't exist
        if (LogStreamDescribe.body.LogStreams.length === 0) {
            const LogStreamCreate = await aws.sdk.cloudwatch.LogStream.CreateLogStream(LogGroupName, LogStreamName)
            if (LogStreamCreate.statusCode !== 200) {
                return LogStreamCreate
            }
        }

        // Step 5: Return success
        statusCode = 200
        body = {
            Code: "Success",
            Message: "CloudWatch log infrastructure initialized successfully.",
        }
    } catch (e) {
        console.error("Error initializing CloudWatch logs:", e)
        statusCode = 500

        if (e.name === 'InvalidParameterException') {
            statusCode = 400
            body = {
                Code: 'InvalidParameterException',
                Message: 'Invalid parameter provided to CloudWatch.',
                Details: e.message,
            }
        } else if (e.name === 'ResourceAlreadyExistsException') {
            statusCode = 409
            body = {
                Code: 'ResourceAlreadyExistsException',
                Message: 'Log group or stream already exists.',
                Details: e.message,
            }
        } else if (e.name === 'ServiceUnavailableException') {
            statusCode = 503
            body = {
                Code: 'ServiceUnavailableException',
                Message: 'CloudWatch service is unavailable.',
                Details: e.message,
            }
        } else {
            body = {
                Code: e.code || 'UnknownError',
                Message: e.message,
            }
        }
    }

    return {
        statusCode,
        body,
    }
}

//----------------------------------------------
//  VERIFICATIONS
//----------------------------------------------

function Verification(LogGroupName, LogStreamName) {
    const Verification_LogGroupName = Verifications_LogGroupName(LogGroupName)
    const Verification_LogStreamName = Verifications_LogStreamName(LogStreamName)

    const errors = []

    if (Verification_LogGroupName.statusCode !== 200) {
        errors.push(Verification_LogGroupName.body.Message)
    }
    if (Verification_LogStreamName.statusCode !== 200) {
        errors.push(Verification_LogStreamName.body.Message)
    }

    if (errors.length > 0) {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: errors,
            },
        }
    }

    return {
        statusCode: 200,
        headers: defaultHeaders(),
        body: {},
    }
}

/**
 * Verify LogGroupName parameter.
 * 
 * @param {string} LogGroupName - CloudWatch log group name to validate
 * @returns {Object} Validation result
 */
function Verifications_LogGroupName(LogGroupName) {
    if (!LogGroupName) {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'LogGroupName' parameter is required.",
            },
        }
    }

    if (typeof LogGroupName !== 'string') {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'LogGroupName' parameter must be a string.",
            },
        }
    }

    return {
        statusCode: 200,
        headers: defaultHeaders(),
        body: {},
    }
}

/**
 * Verify LogStreamName parameter.
 * 
 * @param {string} LogStreamName - CloudWatch log stream name to validate
 * @returns {Object} Validation result
 */
function Verifications_LogStreamName(LogStreamName) {
    if (!LogStreamName) {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'LogStreamName' parameter is required.",
            },
        }
    }

    if (typeof LogStreamName !== 'string') {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'LogStreamName' parameter must be a string.",
            },
        }
    }

    return {
        statusCode: 200,
        headers: defaultHeaders(),
        body: {},
    }
}

//----------------------------------------------
//  DEFAULT RESPONSE HEADERS
//----------------------------------------------

/**
 * Generate default HTTP response headers for CORS and content type.
 * 
 * @returns {Object} HTTP headers object
 */
function defaultHeaders() {
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
    }
}

/*
=======================================================================
                             REFERENCE
=======================================================================

* Package Documentation:
  AWS SDK for JavaScript: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/
  AWS CloudWatch Logs: https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/

* API/Command Reference:
  DescribeLogGroups: https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_DescribeLogGroups.html
  CreateLogGroup: https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_CreateLogGroup.html
  DescribeLogStreams: https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_DescribeLogStreams.html
  CreateLogStream: https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_CreateLogStream.html

* Purpose:
  Initialize AWS CloudWatch log infrastructure by ensuring log groups and streams exist.
  This function is idempotent - it checks for existing resources before creating them.
  Supports hierarchical log organization with configurable log group classes for
  cost optimization.

* Use Cases:
  - Application startup log initialization
  - Microservice log infrastructure setup
  - Multi-tenant logging with isolated log streams
  - Time-based log stream organization (hourly/daily)
  - Development and production environment separation

* Parameters:
  - LogGroupName (required): CloudWatch log group path (e.g., /local/MyApp)
  - LogStreamName (required): CloudWatch log stream path with hierarchy (e.g., /local/MyApp/2024/01/15/10)

* Response Format:
  {
    "Code": "Success",
    "Message": "string"
  }

* Error Handling:
  - 400: InvalidParameterException - Invalid CloudWatch parameters
  - 409: ResourceAlreadyExistsException - Resource conflict
  - 500: Internal server error
  - 503: ServiceUnavailableException - CloudWatch service unavailable

* Security Considerations:
  - Ensure AWS credentials are properly configured
  - Use IAM roles with least-privilege permissions
  - Monitor CloudWatch costs for log group/stream creation
  - Implement log retention policies to manage storage costs
  - Validate log group/stream names to prevent injection

* Important Notes:
  - Idempotent operation (safe to call multiple times)
  - Log group class configured via config.AMAZON_LOG_GROUP_CLASS
  - Default log class is STANDARD for general-purpose logging
  - Log groups and streams are never deleted by this function
  - Log stream names should include timestamp hierarchy for organization
  - Must be called before PutLogEvents operations
  - CloudWatch has quotas on number of log groups and streams per account

=======================================================================
*/
