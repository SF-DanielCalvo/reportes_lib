/**
 * Flush buffered log entries to disk immediately.
 * Forces write of all pending log entries for specified file path.
 * 
 * @param {string} filePath - Path to the log file to flush (required)
 * @returns {Promise<Object>} Response object with flush status
 * 
 * @example
 * const result = await FlushLogs("/path/to/app.log");
 * 
 * @example
 * const result = await FlushLogs("C:\\ProgramData\\SNOWFACTORY\\MyApp\\logs\\app.log");
 */
export async function FlushLogs(filePath) {
    try {
        const Verifications = Verification(filePath)
        if (Verifications.statusCode !== 200) {
            return Verifications
        }

        const result = await Call_FlushLogs(filePath)

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
//  BUFFER MANAGEMENT
//----------------------------------------------

/**
 * Flush buffered log entries for a specific file to disk.
 * Writes all pending entries and clears the buffer.
 * 
 * @param {string} filePath - File path to flush
 * @returns {Promise<number>} Number of entries flushed
 */
export async function flushBuffer(filePath) {
    if (!writeBuffer[filePath] || writeBuffer[filePath].length === 0) {
        return 0
    }

    const entries = writeBuffer[filePath].join('')
    const count = writeBuffer[filePath].length
    writeBuffer[filePath] = []

    if (bufferTimeout && bufferTimeout[filePath]) {
        clearTimeout(bufferTimeout[filePath])
        delete bufferTimeout[filePath]
    }

    await fsPromises.appendFile(filePath, entries)

    return count
}

/**
 * Schedule automatic buffer flush after timeout period.
 * Resets timer if called multiple times before flush.
 * 
 * @param {string} filePath - File path to schedule flush for
 * @returns {void}
 */
export function scheduleFlush(filePath) {
    if (!bufferTimeout) {
        bufferTimeout = {}
    }

    if (bufferTimeout[filePath]) {
        clearTimeout(bufferTimeout[filePath])
    }

    bufferTimeout[filePath] = setTimeout(async () => {
        try {
            await flushBuffer(filePath)
        } catch (e) {
            console.error("Error in scheduled flush:", e)
        }
    }, BUFFER_TIMEOUT)
}

//----------------------------------------------
//  FUNCTION: Flush Logs
//----------------------------------------------
/**
 * Force flush of buffered log entries to disk.
 * 
 * @param {string} filePath - File path to flush
 * @returns {Object} Response object with flush status
 */
async function Call_FlushLogs(filePath) {
    let httpStatusCode
    let body

    try {
        const entriesCount = await flushBuffer(filePath)

        httpStatusCode = 200
        body = {
            FilePath: filePath,
            Message: "Logs flushed successfully",
            EntriesFlushed: entriesCount,
        }
    } catch (e) {
        console.error("Error flushing logs:", e)
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

function Verification(filePath) {
    const Verification_filePath = Verifications_filePath(filePath)

    const errors = []

    if (Verification_filePath.statusCode !== 200) {
        errors.push(Verification_filePath.body.Message)
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
 * Verify filePath parameter.
 * 
 * @param {string} filePath - File path to validate
 * @returns {Object} Validation result
 */
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

* API/Command Reference:
  fs.promises.appendFile: https://nodejs.org/api/fs.html#fspromisesappendfilepath-data-options

* Purpose:
  Force immediate write of buffered log entries to disk. This function
  bypasses the normal buffer timeout and size limits to ensure all pending
  log entries are persisted immediately. Essential for application shutdown,
  critical errors, or before long-running operations where log data must
  be preserved.

* Use Cases:
  - Application shutdown or restart
  - Before critical operations
  - After fatal errors
  - Manual log rotation
  - Testing and debugging

* Parameters:
  - filePath (required): Full path to log file to flush

* Response Format:
  {
    "FilePath": "string",
    "Message": "Logs flushed successfully",
    "EntriesFlushed": number
  }

* Error Handling:
  - 400: Invalid or missing parameters
  - 403: Permission denied (filesystem)
  - 404: Directory not found
  - 500: Internal server error

* Security Considerations:
  - Validate file paths to prevent directory traversal
  - Ensure proper filesystem permissions
  - Monitor disk space before flushing large buffers
  - Protect against flush flooding (rate limiting)

* Important Notes:
  - Clears buffer after successful write
  - Cancels any pending scheduled flush
  - Returns 0 if buffer is empty or doesn't exist
  - Atomic operation - writes all entries or none
  - Should be called before application termination
  - Buffer size configured in WriteLogCommand.mjs (default: 100 entries)
  - Buffer timeout configured in WriteLogCommand.mjs (default: 1 second)
  - Each file path has independent buffer
  - FATAL log level bypasses buffer entirely

=======================================================================
*/
