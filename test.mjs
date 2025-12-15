import { aws } from "aws_lib";
import * as reporte from './src/index.mjs'

const ProjectName = 'test'

const EnviromentalVariables_Load = await aws.sdk.dotenv.LoadEnviromentalVariables('.env')
if (EnviromentalVariables_Load.statusCode !== 200) {
    throw new Error('FATAL')
}

const StartLog = await reporte.StartLog(ProjectName, 'test2')
if (StartLog.statusCode !== 200) {
    throw new Error('FATAL')
}
const MSG = 'test-msg'
const LOG_LEVELS = reporte.LOG_LEVELS.FATAL
const WriteLog = await reporte.WriteLog(LOG_LEVELS, 1, MSG)
if (WriteLog.statusCode !== 200) {
    throw new Error('FATAL')
}

const a = 1