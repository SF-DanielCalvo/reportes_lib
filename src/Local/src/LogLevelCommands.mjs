import { WriteLog } from './WriteLogCommand.mjs'
import { LOG_LEVELS } from './index.mjs'
/**
 * Write TRACE level log (most detailed debugging)
 */
export async function LogTrace(filePath, indentLevel, message, immediate = true) {
    return WriteLog(filePath, indentLevel, LOG_LEVELS.TRACE, message, immediate)
}

/**
 * Write DEBUG level log (debugging information)
 */
export async function LogDebug(filePath, indentLevel, message, immediate = true) {
    return WriteLog(filePath, indentLevel, LOG_LEVELS.DEBUG, message, immediate)
}

/**
 * Write INFO level log (informational messages)
 */
export async function LogInfo(filePath, indentLevel, message, immediate = true) {
    return WriteLog(filePath, indentLevel, LOG_LEVELS.INFO, message, immediate)
}

/**
 * Write WARN level log (warning messages)
 */
export async function LogWarn(filePath, indentLevel, message, immediate = true) {
    return WriteLog(filePath, indentLevel, LOG_LEVELS.WARN, message, immediate)
}

/**
 * Write ERROR level log (error messages)
 */
export async function LogError(filePath, indentLevel, message, immediate = true) {
    return WriteLog(filePath, indentLevel, LOG_LEVELS.ERROR, message, immediate)
}

/**
 * Write FATAL level log (critical errors, auto-flushes)
 */
export async function LogFatal(filePath, indentLevel, message) {
    return WriteLog(filePath, indentLevel, LOG_LEVELS.FATAL, message, true)
}
