import { common } from "common_lib"
import * as cloudwatch from './AWS_CloudWatchLogs/index.mjs'
import * as local from './Local/index.mjs'
import { StartLogs } from './StartLogs.mjs'
import { WriteLogs } from './WriteLog.mjs'

const LOG_LEVELS = local.LOG_LEVELS
export const reportes = {
    LOG_LEVELS,
    StartLog,
    WriteLog,

    // getters to access current live variables
    get LogFileName() { return LogFileName; },
    get LogGroupName() { return LogGroupName; },
    get LogStreamName() { return LogStreamName; },
    get getsequenceToken() { return sequenceToken; },
    get getLogDate() { return LogDate; },
}
let LogFileName, LogGroupName, LogStreamName, sequenceToken, LogDate


function Set_Local_FileName(ProjectName, SpecialName) {
    LogFileName = common.program_paths.local.Get_LogFilesPath_Project(ProjectName)
    LogFileName += "\\" + ProjectName
    if (SpecialName) {
        LogFileName += '_' + SpecialName
    }
    LogFileName += '_' + LogDate.year + '_' + LogDate.month + '_' + LogDate.day + '_' + LogDate.hours + '.log'
}

function Set_CloudWatch_GroupName_StreamName(ProjectName) {
    LogGroupName = cloudwatch.config.AMAZON_LOG_GROUP_InitName + '/' + ProjectName
    LogStreamName = LogGroupName + '/' + LogDate.year + '/' + LogDate.month + '/' + LogDate.day + '/' + LogDate.hours
}

async function StartLog(ProjectName, SpecialName) {
    try {

        LogDate = Get_DateTime_Now()
        Set_Local_FileName(ProjectName, SpecialName)
        Set_CloudWatch_GroupName_StreamName(ProjectName)

        const StartLogs_Result = await StartLogs(ProjectName, LogGroupName, LogStreamName)

        return StartLogs_Result
    } catch (error) {
        return {
            statusCode: 500,
            headers: defaultHeaders(),
            body: error
        }
    }
}

async function WriteLog(LOG_LEVELS, identLevel, message) {
    try {
        const WriteLog_Result = await WriteLogs(
            LOG_LEVELS,
            identLevel,
            message,
            LogFileName,
            LogGroupName,
            LogStreamName,
            sequenceToken
        )

        return WriteLog_Result
    } catch (error) {
        return {
            statusCode: 500,
            headers: defaultHeaders(),
            body: error
        }
    }
}

function Get_DateTime_Now() {
    const today = new Date(); // or any Date object
    // Extract year, month, day
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // months are 0-based
    const day = String(today.getDate()).padStart(2, '0');
    const hours = String(today.getHours()).padStart(2, '0');
    return {
        year: year,
        month: month,
        day: day,
        hours: hours
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
        "Access-Control-Allow-Methods": "GET,OPTIONS",
    }
}