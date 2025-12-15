import {Start_Logs_Local} from './Local/index.mjs'
import {Start_Logs_AWS_CloudWatch} from './AWS_CloudWatchLogs/index.mjs'

/**
 * Initialize logging infrastructure for both local file system and AWS CloudWatch.
 * Creates necessary log directories locally and ensures CloudWatch log groups and streams exist.
 * 
 * @param {string} ProjectName - Name of the project for log organization (required)
 * @param {string} LogGroupName - AWS CloudWatch log group name (required)
 * @param {string} LogStreamName - AWS CloudWatch log stream name (required)
 * @returns {Promise<Object>} Response object with initialization status
 * 
 * @example
 * const result = await StartLogs("MyApp", "/local/MyApp", "/local/MyApp/2024/01/15/10");
 * 
 * @example
 * const result = await StartLogs("DataProcessor", "/local/DataProcessor", "/local/DataProcessor/2024/01/15/11");
 */
export async function StartLogs(ProjectName, LogGroupName, LogStreamName) {
    try {
        const Verifications = Verification(ProjectName, LogGroupName, LogStreamName)
        if (Verifications.statusCode !== 200) {
            return Verifications
        }

        const result = await Call_StartLogs(ProjectName, LogGroupName, LogStreamName)

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
//  FUNCTION: Initialize Logs
//----------------------------------------------
/**
 * Initialize logging infrastructure by creating local directories and AWS CloudWatch resources.
 * 
 * @param {string} ProjectName - Project name for log organization
 * @param {string} LogGroupName - CloudWatch log group name
 * @param {string} LogStreamName - CloudWatch log stream name
 * @returns {Object} Response object with initialization status
 */
async function Call_StartLogs(ProjectName, LogGroupName, LogStreamName) {
    let statusCode
    let body

    try {
        // Step 1: Initialize local file system logs
        const Start_Logs_Local_Result = await Start_Logs_Local(ProjectName)
        if (Start_Logs_Local_Result.statusCode !== 200) {
            return Start_Logs_Local_Result
        }

        // Step 2: Initialize AWS CloudWatch logs
        const Start_Logs_AWS_CloudWatch_Result = await Start_Logs_AWS_CloudWatch(LogGroupName, LogStreamName)
        if (Start_Logs_AWS_CloudWatch_Result.statusCode !== 200) {
            return Start_Logs_AWS_CloudWatch_Result
        }

        // Step 3: Return success
        statusCode = 200
        body = {
            Code: "Success",
            Message: "Logging infrastructure initialized successfully.",
        }
    } catch (e) {
        console.error("Error initializing logs:", e)
        statusCode = 500
        body = {
            Code: e.code || 'UnknownError',
            Message: e.message,
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

function Verification(ProjectName, LogGroupName, LogStreamName) {
    const Verification_ProjectName = Verifications_ProjectName(ProjectName)
    const Verification_LogGroupName = Verifications_LogGroupName(LogGroupName)
    const Verification_LogStreamName = Verifications_LogStreamName(LogStreamName)

    const errors = []

    if (Verification_ProjectName.statusCode !== 200) {
        errors.push(Verification_ProjectName.body.Message)
    }
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
 * Verify ProjectName parameter.
 * 
 * @param {string} ProjectName - Project name to validate
 * @returns {Object} Validation result
 */
function Verifications_ProjectName(ProjectName) {
    if (!ProjectName) {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'ProjectName' parameter is required.",
            },
        }
    }

    if (typeof ProjectName !== 'string') {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'ProjectName' parameter must be a string.",
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
  Node.js File System API: https://nodejs.org/api/fs.html
  AWS CloudWatch Logs: https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/

* API/Command Reference:
  CloudWatch CreateLogGroup: https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_CreateLogGroup.html
  CloudWatch CreateLogStream: https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_CreateLogStream.html

* Purpose:
  Initialize dual logging infrastructure (local files + AWS CloudWatch).
  Creates necessary directories on local file system and ensures CloudWatch
  log groups and streams exist. This function must be called before any
  log writing operations to ensure all required resources are available.

* Use Cases:
  - Application startup logging initialization
  - Service deployment log setup
  - Microservice logging configuration
  - Development and production log preparation
  - Disaster recovery log infrastructure

* Parameters:
  - ProjectName (required): Project identifier for log organization
  - LogGroupName (required): CloudWatch log group path
  - LogStreamName (required): CloudWatch log stream path with timestamp hierarchy

* Response Format:
  {
    "Code": "Success",
    "Message": "string"
  }

* Error Handling:
  - 400: Invalid or missing parameters
  - 403: Permission denied (filesystem or AWS)
  - 404: Resource not found
  - 500: Internal server error
  - 503: Service unavailable (AWS)

* Security Considerations:
  - Validate project names to prevent directory traversal
  - Ensure AWS credentials are properly configured
  - Monitor CloudWatch costs for log group creation
  - Implement log retention policies

* Important Notes:
  - Must be called before WriteLog operations
  - Creates both local and CloudWatch resources
  - Deletes existing local temp and log directories
  - CloudWatch resources are idempotent (safe to call multiple times)
  - Local directories follow pattern: C:\ProgramData\SNOWFACTORY\{ProjectName}
  - CloudWatch paths follow pattern: /local/{ProjectName}/{year}/{month}/{day}/{hour}

=======================================================================
*/
