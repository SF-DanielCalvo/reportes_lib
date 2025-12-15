import { common } from "common_lib"
import * as src from "./src/index.mjs"

/**
 * Initialize local file system logging directories.
 * Creates base, project, logs, and temp directories. Cleans existing logs/temp folders.
 * 
 * @param {string} ProjectName - Name of the project for directory organization (required)
 * @returns {Promise<Object>} Response object with initialization status
 * 
 * @example
 * const result = await Start_Logs_Local("MyApp");
 * 
 * @example
 * const result = await Start_Logs_Local("DataProcessor");
 */
export async function Start_Logs_Local(ProjectName) {
    try {
        const Verifications = Verification(ProjectName)
        if (Verifications.statusCode !== 200) {
            return Verifications
        }

        const result = await Call_Start_Logs_Local(ProjectName)

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
//  FUNCTION: Initialize Local Logs
//----------------------------------------------
/**
 * Create and prepare local file system directories for logging.
 * 
 * @param {string} ProjectName - Project name for directory structure
 * @returns {Object} Response object with initialization status
 */
async function Call_Start_Logs_Local(ProjectName) {
    let statusCode
    let body

    try {
        // Step 1: Get directory paths
        const LogsPath = src.Get_LogFilesPath_Project(ProjectName)
        const TempPath = src.Get_TempPath_Project(ProjectName)
        const BasePath = src.BasePath
        const ProjectPath = src.Get_BasePath_Project(ProjectName)

        // Step 2: Check if directories exist
        const BasePath_Exists = await common.fs.directory.DirectoryExists(BasePath)
        if (BasePath_Exists.statusCode !== 200) {
            return BasePath_Exists
        }

        const ProjectPath_Exists = await common.fs.directory.DirectoryExists(ProjectPath)
        if (ProjectPath_Exists.statusCode !== 200) {
            return ProjectPath_Exists
        }

        const LogsPath_Exists = await common.fs.directory.DirectoryExists(LogsPath)
        if (LogsPath_Exists.statusCode !== 200) {
            return LogsPath_Exists
        }

        const TempPath_Exists = await common.fs.directory.DirectoryExists(TempPath)
        if (TempPath_Exists.statusCode !== 200) {
            return TempPath_Exists
        }

        // Step 3: Create base directory if needed
        if (!BasePath_Exists.body.Exists) {
            const BasePath_CreateDirectory_Result = await common.fs.directory.CreateDirectory(BasePath)
            if (BasePath_CreateDirectory_Result.statusCode !== 200) {
                return BasePath_CreateDirectory_Result
            }
        }

        // Step 4: Create project directory if needed
        if (!ProjectPath_Exists.body.Exists) {
            const ProjectPath_CreateDirectory_Result = await common.fs.directory.CreateDirectory(ProjectPath)
            if (ProjectPath_CreateDirectory_Result.statusCode !== 200) {
                return ProjectPath_CreateDirectory_Result
            }
        }

        // Step 5: Clean existing logs directory
        if (LogsPath_Exists.body.Exists) {
            const LogsPath_DeleteDirectory_Result = await common.fs.directory.DeleteDirectory(LogsPath, true)
            if (LogsPath_DeleteDirectory_Result.statusCode !== 200) {
                return LogsPath_DeleteDirectory_Result
            }
        }

        // Step 6: Clean existing temp directory
        if (TempPath_Exists.body.Exists) {
            const TempPath_DeleteDirectory_Result = await common.fs.directory.DeleteDirectory(TempPath, true)
            if (TempPath_DeleteDirectory_Result.statusCode !== 200) {
                return TempPath_DeleteDirectory_Result
            }
        }

        // Step 7: Create fresh logs directory
        const LogsPath_CreateDirectory_Result = await common.fs.directory.CreateDirectory(LogsPath)
        if (LogsPath_CreateDirectory_Result.statusCode !== 200) {
            return LogsPath_CreateDirectory_Result
        }

        // Step 8: Create fresh temp directory
        const TempPath_CreateDirectory_Result = await common.fs.directory.CreateDirectory(TempPath)
        if (TempPath_CreateDirectory_Result.statusCode !== 200) {
            return TempPath_CreateDirectory_Result
        }

        // Step 9: Return success
        statusCode = 200
        body = {
            Code: "Success",
            Message: "Local logs initialized successfully.",
            BasePath: BasePath,
            ProjectPath: ProjectPath,
            LogsPath: LogsPath,
            TempPath: TempPath,
        }
    } catch (e) {
        console.error("Error initializing local logs:", e)
        statusCode = 500

        if (e.code === 'ENOENT') {
            statusCode = 404
            body = {
                Code: 'DirectoryNotFound',
                Message: 'Parent directory not found.',
                Details: e.message,
            }
        } else if (e.code === 'EACCES') {
            statusCode = 403
            body = {
                Code: 'PermissionDenied',
                Message: 'Permission denied creating directories.',
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

function Verification(ProjectName) {
    const Verification_ProjectName = Verifications_ProjectName(ProjectName)

    const errors = []

    if (Verification_ProjectName.statusCode !== 200) {
        errors.push(Verification_ProjectName.body.Message)
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
  fs.promises.mkdir: https://nodejs.org/api/fs.html#fspromisesmkdirpath-options
  fs.promises.rm: https://nodejs.org/api/fs.html#fspromisesrmpath-options

* Purpose:
  Initialize local file system logging infrastructure by creating and preparing
  directory structure. This function ensures a clean slate for each logging session
  by removing existing log and temp directories and recreating them. Creates
  hierarchical directory structure: Base -> Project -> Logs/Temp.

* Use Cases:
  - Application startup log preparation
  - Daily log rotation and cleanup
  - Development environment log reset
  - Test suite log initialization
  - Service restart with fresh logs

* Parameters:
  - ProjectName (required): Project identifier for directory organization

* Response Format:
  {
    "Code": "Success",
    "Message": "string",
    "BasePath": "C:\\ProgramData\\SNOWFACTORY",
    "ProjectPath": "C:\\ProgramData\\SNOWFACTORY\\{ProjectName}",
    "LogsPath": "C:\\ProgramData\\SNOWFACTORY\\{ProjectName}\\logs",
    "TempPath": "C:\\ProgramData\\SNOWFACTORY\\{ProjectName}\\temp"
  }

* Error Handling:
  - 400: Invalid or missing parameters
  - 403: Permission denied (filesystem)
  - 404: Parent directory not found
  - 500: Internal server error

* Security Considerations:
  - Validate project names to prevent directory traversal
  - Ensure proper filesystem permissions
  - Prevent deletion of critical system directories
  - Monitor disk space usage

* Important Notes:
  - Deletes existing logs and temp directories on each call
  - Creates directory structure: C:\ProgramData\SNOWFACTORY\{ProjectName}\logs
  - Creates directory structure: C:\ProgramData\SNOWFACTORY\{ProjectName}\temp
  - Must be called before WriteLog operations
  - Logs are stored in C:\ProgramData\SNOWFACTORY (Windows standard location)
  - Directory deletion is recursive (deletes all contents)
  - Base path configured in src/index.mjs
  - Not idempotent - clears logs on each call

=======================================================================
*/
