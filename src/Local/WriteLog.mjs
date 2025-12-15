import * as src from './src/index.mjs';

/**
 * Write log entry to local file system.
 * Routes log entry to appropriate log level function from src library.
 * 
 * @param {string} LogFileName - Path to the log file (required)
 * @param {string} Log_Level - Log level (TRACE, DEBUG, INFO, WARN, ERROR, FATAL) (required)
 * @param {number} identLevel - Indentation level for nested operations (0-9) (required)
 * @param {string} message - Log message content (required)
 * @returns {Promise<Object>} Response object with formatted log message
 * 
 * @example
 * const result = await WriteLog_Local("/path/to/app.log", "INFO", 0, "Application started");
 * 
 * @example
 * const result = await WriteLog_Local("/path/to/app.log", "ERROR", 2, "Connection failed");
 */
export async function WriteLog_Local(LogFileName, Log_Level, identLevel, message) {
    try {
        const Verifications = Verification(LogFileName, Log_Level, identLevel, message)
        if (Verifications.statusCode !== 200) {
            return Verifications
        }

        const result = await Call_WriteLog_Local(LogFileName, Log_Level, identLevel, message)

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
//  FUNCTION: Write Local Log
//----------------------------------------------
/**
 * Write log entry to local file system using appropriate log level handler.
 * 
 * @param {string} LogFileName - Log file path
 * @param {string} Log_Level - Log level
 * @param {number} identLevel - Indentation level
 * @param {string} message - Log message
 * @returns {Object} Response object with log status
 */
async function Call_WriteLog_Local(LogFileName, Log_Level, identLevel, message) {
    let statusCode
    let body

    try {
        // Step 1: Route to appropriate log level function
        let WriteLog_Result
        switch (Log_Level) {
            case src.LOG_LEVELS.TRACE:
                WriteLog_Result = await src.LogLevel.LogTrace(LogFileName, identLevel, message)
                break
            case src.LOG_LEVELS.DEBUG:
                WriteLog_Result = await src.LogLevel.LogDebug(LogFileName, identLevel, message)
                break
            case src.LOG_LEVELS.INFO:
                WriteLog_Result = await src.LogLevel.LogInfo(LogFileName, identLevel, message)
                break
            case src.LOG_LEVELS.WARN:
                WriteLog_Result = await src.LogLevel.LogWarn(LogFileName, identLevel, message)
                break
            case src.LOG_LEVELS.ERROR:
                WriteLog_Result = await src.LogLevel.LogError(LogFileName, identLevel, message)
                break
            case src.LOG_LEVELS.FATAL:
                WriteLog_Result = await src.LogLevel.LogFatal(LogFileName, identLevel, message)
                break
        }

        // Step 2: Check result from log function
        if (WriteLog_Result.statusCode !== 200) {
            return WriteLog_Result
        }

        // Step 3: Return success with formatted message
        statusCode = 200
        body = WriteLog_Result.body
    } catch (e) {
        console.error("Error writing local log:", e)
        statusCode = 500

        if (e.code === 'ENOENT') {
            statusCode = 404
            body = {
                Code: 'DirectoryNotFound',
                Message: `Log directory not found: ${LogFileName}`,
                Details: e.message,
            }
        } else if (e.code === 'EACCES') {
            statusCode = 403
            body = {
                Code: 'PermissionDenied',
                Message: `Permission denied: ${LogFileName}`,
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

function Verification(LogFileName, Log_Level, identLevel, message) {
    const Verification_LogFileName = Verifications_LogFileName(LogFileName)
    const Verification_Log_Level = Verifications_Log_Level(Log_Level)
    const Verification_identLevel = Verifications_identLevel(identLevel)
    const Verification_message = Verifications_message(message)

    const errors = []

    if (Verification_LogFileName.statusCode !== 200) {
        errors.push(Verification_LogFileName.body.Message)
    }
    if (Verification_Log_Level.statusCode !== 200) {
        errors.push(Verification_Log_Level.body.Message)
    }
    if (Verification_identLevel.statusCode !== 200) {
        errors.push(Verification_identLevel.body.Message)
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

    const validLevels = Object.values(src.LOG_LEVELS)
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
  Common Library Log Functions (internal)

* API/Command Reference:
  RFC 5424 Syslog Protocol: https://datatracker.ietf.org/doc/html/rfc5424

* Purpose:
  Write log entries to local file system using src library log functions.
  Acts as a router that directs log entries to the appropriate log level handler
  (TRACE, DEBUG, INFO, WARN, ERROR, FATAL). Each handler formats the log entry
  with timestamp, level, and indentation before writing to disk.

* Use Cases:
  - Local file system logging
  - Development and debugging
  - Offline log storage
  - Log backup and archival
  - Low-latency logging without network calls

* Parameters:
  - LogFileName (required): Full path to log file
  - Log_Level (required): TRACE, DEBUG, INFO, WARN, ERROR, FATAL
  - identLevel (required): 0-9 indentation for operation hierarchy
  - message (required): Log message content

* Response Format:
  {
    "FilePath": "string",
    "LogLevel": "string",
    "IndentLevel": number,
    "Message": "[indent][LEVEL][timestamp]:message",
    "Buffered": boolean
  }

* Error Handling:
  - 400: Invalid parameters or log level
  - 403: Permission denied (filesystem)
  - 404: Log directory not found
  - 500: Internal server error

* Security Considerations:
  - Validate file paths to prevent directory traversal
  - Sanitize log messages to prevent injection
  - Monitor disk space usage
  - Implement log rotation policies
  - Protect sensitive data in log messages

* Important Notes:
  - Delegates to src library log functions
  - Log format: [indent][LEVEL][ISO timestamp]:message
  - FATAL logs bypass buffer and write immediately
  - Start_Logs_Local must be called first to create directories
  - Supports buffered writes for performance (see WriteLogCommand.mjs)
  - Each log level has specific use case and severity
  - Log files organized by project and timestamp

=======================================================================
*/
