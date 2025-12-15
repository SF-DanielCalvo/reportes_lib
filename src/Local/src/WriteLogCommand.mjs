import fsPromises from 'fs/promises'
import { EOL } from 'os'
import { LOG_LEVELS } from './index.mjs'
import { flushBuffer, scheduleFlush } from './FlushLogsCommand.mjs'

// Internal write buffer for performance
let writeBuffer = []
let bufferTimeout = null
const BUFFER_SIZE = 100
const BUFFER_TIMEOUT = 1000

/**
 * Write log entry to file with buffered writes for performance
 * 
 * @param {string} filePath - Path to the log file (required)
 * @param {number} indentLevel - Indentation level (0-9) (required)
 * @param {string} logLevel - Log level: TRACE, DEBUG, INFO, WARN, ERROR, FATAL (required)
 * @param {string} message - Log message (required)
 * @param {boolean} [immediate=false] - Force immediate write (bypass buffer) (optional)
 * @returns {Promise<Object>} Response object with write status
 * 
 * @example
 * const result = await WriteLog("/path/to/app.log", 0, "INFO", "Application started");
 * 
 * @example
 * const result = await WriteLog("/path/to/app.log", 1, "ERROR", "Failed to connect", true);
 */
export async function WriteLog(filePath, indentLevel, logLevel, message, immediate = true) {
    try {
        const Verifications = Verification(filePath, indentLevel, logLevel, message)
        if (Verifications.statusCode !== 200) {
            return Verifications
        }

        const result = await Call_WriteLog(filePath, indentLevel, logLevel, message, immediate)

        return {
            statusCode: result.httpStatusCode,
            headers: defaultHeaders(),
            body: result.body,
        }
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
//  FUNCTION: Write Log
//----------------------------------------------
async function Call_WriteLog(filePath, indentLevel, logLevel, message, immediate) {
    let httpStatusCode
    let body

    try {
        // Step 1: Format log entry
        const timestamp = new Date().toISOString()
        const logEntry = `[${indentLevel}][${logLevel}][${timestamp}]:${message}${EOL}`

        console.log(logEntry)

        if (immediate) {
            // Step 2a: Immediate write (bypass buffer)
            await fsPromises.appendFile(filePath, logEntry)


            httpStatusCode = 200
            body = {
                FilePath: filePath,
                LogLevel: logLevel,
                IndentLevel: indentLevel,
                Message: logEntry,
                Buffered: false,
            }
        } else {
            // Step 2b: Add to buffer for performance
            if (!writeBuffer[filePath]) {
                writeBuffer[filePath] = []
            }
            writeBuffer[filePath].push(logEntry)

            // Step 3: Auto-flush if buffer is full
            if (writeBuffer[filePath].length >= BUFFER_SIZE) {
                await flushBuffer(filePath)
            } else {
                scheduleFlush(filePath)
            }

            httpStatusCode = 200
            body = {
                FilePath: filePath,
                LogLevel: logLevel,
                IndentLevel: indentLevel,
                Message: logEntry,
                Buffered: true,
                BufferSize: writeBuffer[filePath].length,
            }
        }
    } catch (e) {
        console.error("Error writing log:", e)
        httpStatusCode = 500

        if (e.code === 'ENOENT') {
            httpStatusCode = 404
            body = {
                Code: 'DirectoryNotFound',
                Message: `Directory not found for log file: ${filePath}`,
                Details: e.message,
            }
        } else if (e.code === 'EACCES') {
            httpStatusCode = 403
            body = {
                Code: 'PermissionDenied',
                Message: `Permission denied: ${filePath}`,
                Details: e.message,
            }
        } else {
            body = {
                Code: e.code || 'UnknownError',
                Message: e.message,
                Number: e.number,
            }
        }
    }

    return {
        httpStatusCode,
        body,
    }
}

//----------------------------------------------
//  VERIFICATIONS
//----------------------------------------------

function Verification(filePath, indentLevel, logLevel, message) {
    const Verification_filePath = Verifications_filePath(filePath)
    const Verification_indentLevel = Verifications_indentLevel(indentLevel)
    const Verification_logLevel = Verifications_logLevel(logLevel)
    const Verification_message = Verifications_message(message)

    const errors = []

    if (Verification_filePath.statusCode !== 200) {
        errors.push(Verification_filePath.body.Message)
    }
    if (Verification_indentLevel.statusCode !== 200) {
        errors.push(Verification_indentLevel.body.Message)
    }
    if (Verification_logLevel.statusCode !== 200) {
        errors.push(Verification_logLevel.body.Message)
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

function Verifications_filePath(filePath) {
    if (!filePath) {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'filePath' parameter is required.",
            },
        }
    }

    if (typeof filePath !== 'string') {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'filePath' parameter must be a string.",
            },
        }
    }

    return {
        statusCode: 200,
        headers: defaultHeaders(),
        body: {},
    }
}

function Verifications_indentLevel(indentLevel) {
    if (indentLevel === undefined || indentLevel === null) {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'indentLevel' parameter is required.",
            },
        }
    }

    if (typeof indentLevel !== 'number' || indentLevel < 0 || indentLevel > 9) {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'indentLevel' parameter must be a number between 0 and 9.",
            },
        }
    }

    return {
        statusCode: 200,
        headers: defaultHeaders(),
        body: {},
    }
}

function Verifications_logLevel(logLevel) {
    if (!logLevel) {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: "The 'logLevel' parameter is required.",
            },
        }
    }

    const validLevels = Object.values(LOG_LEVELS)
    if (!validLevels.includes(logLevel)) {
        return {
            statusCode: 400,
            headers: defaultHeaders(),
            body: {
                Code: "InvalidParameterValue",
                Message: `The 'logLevel' parameter must be one of: ${validLevels.join(', ')}`,
            },
        }
    }

    return {
        statusCode: 200,
        headers: defaultHeaders(),
        body: {},
    }
}

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

function defaultHeaders() {
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    }
}

/*
=======================================================================
                             REFERENCE
=======================================================================

* Package Documentation:
  https://nodejs.org/api/fs.html#fspromisesappendfilepath-data-options

* API/Command Reference:
  https://datatracker.ietf.org/doc/html/rfc5424 (RFC 5424 Syslog)

* Purpose:
  High-performance logging with buffered writes. Supports RFC 5424 log
  levels and indentation for nested operations. Minimizes I/O by
  batching log entries in memory before writing to disk.

* Use Cases:
  - Application event logging
  - Debug tracing with hierarchy
  - Error tracking and monitoring
  - Performance profiling
  - Audit trails

* Parameters:
  - filePath (required): Path to log file
  - indentLevel (required): 0-9 for operation nesting
  - logLevel (required): TRACE, DEBUG, INFO, WARN, ERROR, FATAL
  - message (required): Log message text
  - immediate (optional): Skip buffer, write immediately

* Response Format:
  {
    "FilePath": "string",
    "LogLevel": "string",
    "IndentLevel": number,
    "Message": "string",
    "Buffered": boolean,
    "BufferSize": number
  }

* Error Handling:
  - 400: Invalid parameters
  - 403: Permission denied
  - 404: Directory not found
  - 500: Internal error

* Security Considerations:
  - Validate file paths
  - Prevent log injection attacks
  - Monitor disk space usage
  - Rotate logs regularly

* Important Notes:
  - Buffer size: 100 entries
  - Auto-flush: 1 second timeout
  - FATAL logs bypass buffer
  - Call FlushLogs before shutdown
  - Format: [indent][LEVEL][ISO timestamp]:message

=======================================================================
*/
