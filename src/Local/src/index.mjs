import * as Write from './WriteLogCommand.mjs'
import * as LogLevel from './LogLevelCommands.mjs'
import * as Flush from './FlushLogsCommand.mjs'
import { common } from 'common_lib'

export {Write, LogLevel, Flush}

export const LOG_LEVELS = {
    TRACE: 'TRACE',
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    FATAL: 'FATAL',
}

export const BasePath = common.program_paths.local.BasePath

export const LogFilesPath = common.program_paths.local.LogFilesPath
export const TempPath = common.program_paths.local.TempPath

export function Get_BasePath_Project(ProjectName) {
    return common.program_paths.local.Get_BasePath_Project(ProjectName)
}

export function Get_LogFilesPath_Project(ProjectName) {
    return common.program_paths.local.Get_LogFilesPath_Project(ProjectName)
}

export function Get_TempPath_Project(ProjectName) {
    return common.program_paths.local.Get_TempPath_Project(ProjectName)
}