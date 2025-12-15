import * as Write from './WriteLogCommand.mjs'
import * as LogLevel from './LogLevelCommands.mjs'
import * as Flush from './FlushLogsCommand.mjs'

export {Write, LogLevel, Flush}

export const LOG_LEVELS = {
    TRACE: 'TRACE',
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    FATAL: 'FATAL',
}

export const BasePath = 'C:\\ProgramData\\SNOWFACTORY'

export const LogFilesPath = `\\logs`
export const TempPath = `\\temp`

export function Get_BasePath_Project(ProjectName) {
    return BasePath + "\\" + ProjectName
}

export function Get_LogFilesPath_Project(ProjectName) {
    return Get_BasePath_Project(ProjectName) + LogFilesPath
}

export function Get_TempPath_Project(ProjectName) {
    return Get_BasePath_Project(ProjectName) + TempPath
}