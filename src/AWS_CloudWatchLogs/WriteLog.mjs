import { aws } from "aws_lib"

/**
 * Write log events to AWS CloudWatch.
 * Sends formatted log messages to specified CloudWatch log stream.
 * 
 * @param {string} LogGroupName - AWS CloudWatch log group name (required)
 * @param {string} LogStreamName - AWS CloudWatch log stream name (required)
 * @param {Array<string>} message - Array of log message strings (required)
 * @param {string} sequenceToken - CloudWatch sequence token for ordering (optional)
 * @returns {Promise<Object>} Response object with log write status and next sequence token
 * 
 * @example
 * const result = await WriteLog_AWS_CloudWatch("/local/MyApp", "/local/MyApp/2024/01/15/10", ["[0][INFO][2024-01-15T10:00:00Z]:App started"]);
 * 
 * @example
 * const result = await WriteLog_AWS_CloudWatch("/local/MyApp", "/local/MyApp/2024/01/15/10", ["[2][ERROR][2024-01-15T10:00:01Z]:Connection failed"], "token123");
 */
export async function WriteLog_AWS_CloudWatch(LogGroupName, LogStreamName, message, sequenceToken) {
    try {
        const Verifications = Verification(LogGroupName, LogStreamName, message)
        if (Verifications.statusCode !== 200) {
            return Verifications
        }

        const result = await Call_WriteLog_AWS_CloudWatch(LogGroupName, LogStreamName, message, sequenceToken)

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
//  FUNCTION: Write CloudWatch Log Events
//----------------------------------------------
/**
 * Send log events to AWS CloudWatch.
 * 
 * @param {string} LogGroupName - CloudWatch log group name
 * @param {string} LogStreamName - CloudWatch log stream name
 * @param {Array<string>} message - Log message array
 * @param {string} sequenceToken - CloudWatch sequence token
 * @returns {Object} Response object with status and next sequence token
 */
async function Call_WriteLog_AWS_CloudWatch(LogGroupName, LogStreamName, message, sequenceToken) {
    let statusCode
    let body

    try {
        // Step 1: Send log events to CloudWatch
        const PutLogEvent_result = await aws.sdk.cloudwatch.LogEvent.PutLogEvents(
            LogGroupName, 
            LogStreamName, 
            message, 
            sequenceToken
        )

        if (PutLogEvent_result.statusCode !== 200) {
            return PutLogEvent_result
        }

        // Step 2: Return success with CloudWatch response
        statusCode = 200
        body = PutLogEvent_result.body
    } catch (e) {
        console.error("Error writing to CloudWatch:", e)
        statusCode = 500

        if (e.name === 'InvalidParameterException') {
            statusCode = 400
            body = {
                Code: 'InvalidParameterException',
                Message: 'Invalid parameter provided to CloudWatch.',
                Details: e.message,
            }
        } else if (e.name === 'ResourceNotFoundException') {
            statusCode = 404
            body = {
                Code: 'ResourceNotFoundException',
                Message: 'Log group or stream not found.',
                Details: e.message,
            }
        } else if (e.name === 'InvalidSequenceTokenException') {
            statusCode = 400
            body = {
                Code: 'InvalidSequenceTokenException',
                Message: 'Invalid sequence token. Log events out of order.',
                Details: e.message,
            }
        } else if (e.name === 'DataAlreadyAcceptedException') {
            statusCode = 409
            body = {
                Code: 'DataAlreadyAcceptedException',
                Message: 'Log events already accepted.',
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

function Verification(LogGroupName, LogStreamName, message) {
    const Verification_LogGroupName = Verifications_LogGroupName(LogGroupName)
    const Verification_LogStreamName = Verifications_LogStreamName(LogStreamName)
    const Verification_message = Verifications_message(message)

    const errors = []

    if (Verification_LogGroupName.statusCode !== 200) {
        errors.push(Verification_LogGroupName.body.Message)
    }
    if (Verification_LogStreamName.statusCode !== 200) {
        errors.push(Verification_LogStreamName.body.Message)
    }
    if (Verification_message.statusCode !== 200) {
        errors.push(Verification_message.body.Message)
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

/**
 * Verify message parameter.
 * 
 * @param {Array<string>} message - Message array to validate
 * @returns {Object} Validation result
 */
function Verifications_message(message) {
    if (!message) {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'message' parameter is required.",
            },
        }
    }

    if (!Array.isArray(message)) {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'message' parameter must be an array.",
            },
        }
    }

    if (message.length === 0) {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'message' array cannot be empty.",
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
  PutLogEvents: https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_PutLogEvents.html

* Purpose:
  Send log events to AWS CloudWatch Logs. Supports batching of multiple log
  messages in a single API call for efficiency. Uses sequence tokens to ensure
  log events are written in order. Returns next sequence token for subsequent
  calls, enabling continuous ordered logging.

* Use Cases:
  - Real-time application logging to cloud
  - Centralized log aggregation
  - Cloud-based log analysis and monitoring
  - Alert triggers based on log patterns
  - Compliance and audit trail logging

* Parameters:
  - LogGroupName (required): CloudWatch log group path
  - LogStreamName (required): CloudWatch log stream path
  - message (required): Array of formatted log message strings
  - sequenceToken (optional): Token from previous PutLogEvents call

* Response Format:
  {
    "nextSequenceToken": "string",
    "rejectedLogEventsInfo": {
      "tooNewLogEventStartIndex": number,
      "tooOldLogEventEndIndex": number,
      "expiredLogEventEndIndex": number
    }
  }

* Error Handling:
  - 400: InvalidParameterException - Invalid CloudWatch parameters
  - 400: InvalidSequenceTokenException - Log events out of order
  - 404: ResourceNotFoundException - Log group/stream not found
  - 409: DataAlreadyAcceptedException - Duplicate log events
  - 500: Internal server error
  - 503: ServiceUnavailableException - CloudWatch unavailable

* Security Considerations:
  - Sanitize log messages to prevent injection attacks
  - Use IAM roles with PutLogEvents permission only
  - Monitor CloudWatch costs for high-volume logging
  - Implement log retention policies
  - Protect sensitive data in log messages (PII, secrets)

* Important Notes:
  - CloudWatch has quotas: 5 requests/second per log stream
  - Maximum batch size: 1 MB or 10,000 events
  - Log events must be in chronological order
  - Sequence tokens ensure ordering across multiple clients
  - First call to stream doesn't require sequence token
  - Store and reuse nextSequenceToken for subsequent calls
  - Log group and stream must exist before calling (use Start_Logs_AWS_CloudWatch)
  - CloudWatch charges per GB ingested and stored

=======================================================================
*/
