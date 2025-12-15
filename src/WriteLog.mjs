import { WriteLog_AWS_CloudWatch } from "./AWS_CloudWatchLogs/index.mjs"
import { WriteLog_Local } from "./Local/index.mjs"

/**
 * Write log entry to both local file system and AWS CloudWatch.
 * Formats log entry locally, then sends the formatted message to CloudWatch.
 * 
 * @param {string} Log_Level - Log level (TRACE, DEBUG, INFO, WARN, ERROR, FATAL) (required)
 * @param {number} identLevel - Indentation level for nested operations (0-9) (required)
 * @param {string} message - Log message content (required)
 * @param {string} LogFileName - Path to local log file (required)
 * @param {string} LogGroupName - AWS CloudWatch log group name (required)
 * @param {string} LogStreamName - AWS CloudWatch log stream name (required)
 * @param {string} sequenceToken - CloudWatch sequence token for ordering (optional)
 * @returns {Promise<Object>} Response object with log write status
 * 
 * @example
 * const result = await WriteLogs("INFO", 0, "Application started", "/path/to/app.log", "/local/MyApp", "/local/MyApp/2024/01/15/10");
 * 
 * @example
 * const result = await WriteLogs("ERROR", 2, "Connection failed", "/path/to/app.log", "/local/MyApp", "/local/MyApp/2024/01/15/10", "token123");
 */
export async function WriteLogs(Log_Level, identLevel, message, LogFileName, LogGroupName, LogStreamName, sequenceToken) {
    try {
        const Verifications = Verification(Log_Level, identLevel, message, LogFileName, LogGroupName, LogStreamName)
        if (Verifications.statusCode !== 200) {
            return Verifications
        }

        const result = await Call_WriteLogs(Log_Level, identLevel, message, LogFileName, LogGroupName, LogStreamName, sequenceToken)

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
//  FUNCTION: Write Logs
//----------------------------------------------
/**
 * Write log entry to local file and AWS CloudWatch.
 * 
 * @param {string} Log_Level - Log level
 * @param {number} identLevel - Indentation level
 * @param {string} message - Log message
 * @param {string} LogFileName - Local log file path
 * @param {string} LogGroupName - CloudWatch log group
 * @param {string} LogStreamName - CloudWatch log stream
 * @param {string} sequenceToken - CloudWatch sequence token
 * @returns {Object} Response object with log status
 */
async function Call_WriteLogs(Log_Level, identLevel, message, LogFileName, LogGroupName, LogStreamName, sequenceToken) {
    let statusCode
    let body

    try {
        // Step 1: Write to local file system
        const WriteLog_Local_Result = await WriteLog_Local(LogFileName, Log_Level, identLevel, message)
        if (WriteLog_Local_Result.statusCode !== 200) {
            return WriteLog_Local_Result
        }

        // Step 2: Extract formatted message
        const Full_MSG = WriteLog_Local_Result.body.Message.trim()

        // Step 3: Write to AWS CloudWatch
        const WriteLog_AWS_CloudWatch_Result = await WriteLog_AWS_CloudWatch(LogGroupName, LogStreamName, [Full_MSG], sequenceToken)
        if (WriteLog_AWS_CloudWatch_Result.statusCode !== 200) {
            return WriteLog_AWS_CloudWatch_Result
        }

        // Step 4: Return success with CloudWatch response
        statusCode = 200
        body = WriteLog_AWS_CloudWatch_Result.body
    } catch (e) {
        console.error("Error writing logs:", e)
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

function Verification(Log_Level, identLevel, message, LogFileName, LogGroupName, LogStreamName) {
    const Verification_Log_Level = Verifications_Log_Level(Log_Level)
    const Verification_identLevel = Verifications_identLevel(identLevel)
    const Verification_message = Verifications_message(message)
    const Verification_LogFileName = Verifications_LogFileName(LogFileName)
    const Verification_LogGroupName = Verifications_LogGroupName(LogGroupName)
    const Verification_LogStreamName = Verifications_LogStreamName(LogStreamName)

    const errors = []

    if (Verification_Log_Level.statusCode !== 200) {
        errors.push(Verification_Log_Level.body.Message)
    }
    if (Verification_identLevel.statusCode !== 200) {
        errors.push(Verification_identLevel.body.Message)
    }
    if (Verification_message.statusCode !== 200) {
        errors.push(Verification_message.body.Message)
    }
    if (Verification_LogFileName.statusCode !== 200) {
        errors.push(Verification_LogFileName.body.Message)
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
 * Verify Log_Level parameter.
 * 
 * @param {string} Log_Level - Log level to validate
 * @returns {Object} Validation result
 */
function Verifications_Log_Level(Log_Level) {
    if (!Log_Level) {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'Log_Level' parameter is required.",
            },
        }
    }

    if (typeof Log_Level !== 'string') {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'Log_Level' parameter must be a string.",
            },
        }
    }

    const validLevels = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
    if (!validLevels.includes(Log_Level)) {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: `The 'Log_Level' parameter must be one of: ${validLevels.join(', ')}.`,
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
 * Verify identLevel parameter.
 * 
 * @param {number} identLevel - Indentation level to validate
 * @returns {Object} Validation result
 */
function Verifications_identLevel(identLevel) {
    if (identLevel === undefined || identLevel === null) {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'identLevel' parameter is required.",
            },
        }
    }

    if (typeof identLevel !== 'number' || identLevel < 0 || identLevel > 9) {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'identLevel' parameter must be a number between 0 and 9.",
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
 * @param {string} message - Message to validate
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

    if (typeof message !== 'string') {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'message' parameter must be a string.",
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
 * Verify LogFileName parameter.
 * 
 * @param {string} LogFileName - Log file name to validate
 * @returns {Object} Validation result
 */
function Verifications_LogFileName(LogFileName) {
    if (!LogFileName) {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'LogFileName' parameter is required.",
            },
        }
    }

    if (typeof LogFileName !== 'string') {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'LogFileName' parameter must be a string.",
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
  CloudWatch PutLogEvents: https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_PutLogEvents.html

* Purpose:
  Write log entries to both local file system and AWS CloudWatch simultaneously.
  Ensures log consistency across local and cloud storage. Local logs are formatted
  with timestamp and level, then identical formatted messages are sent to CloudWatch.
  This provides redundancy and supports both offline access and cloud-based log aggregation.

* Use Cases:
  - Application runtime logging
  - Error tracking and monitoring
  - Debug tracing with cloud backup
  - Audit trail creation
  - Performance monitoring and alerting

* Parameters:
  - Log_Level (required): TRACE, DEBUG, INFO, WARN, ERROR, FATAL
  - identLevel (required): 0-9 indentation for operation hierarchy
  - message (required): Log message content
  - LogFileName (required): Local file system path
  - LogGroupName (required): CloudWatch log group
  - LogStreamName (required): CloudWatch log stream
  - sequenceToken (optional): CloudWatch ordering token

* Response Format:
  {
    "nextSequenceToken": "string",
    "rejectedLogEventsInfo": {...}
  }

* Error Handling:
  - 400: Invalid parameters or log level
  - 403: Permission denied (filesystem or AWS)
  - 404: Log file or CloudWatch stream not found
  - 500: Internal server error
  - 503: Service unavailable (AWS)

* Security Considerations:
  - Sanitize log messages to prevent injection
  - Validate file paths to prevent directory traversal
  - Monitor CloudWatch costs for high-volume logging
  - Implement log rotation policies
  - Protect sensitive data in log messages

* Important Notes:
  - Local write happens first, CloudWatch second
  - If local write fails, CloudWatch write is skipped
  - If CloudWatch write fails, local log is still persisted
  - Formatted message includes: [indent][LEVEL][timestamp]:message
  - Sequence tokens ensure ordered CloudWatch writes
  - StartLogs must be called before using this function
  - High-volume logging may use buffering (see WriteLogCommand.mjs)

=======================================================================
*/
