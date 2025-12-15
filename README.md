# reportes_lib

Logging and reporting library for CloudWatch and local file logging.

## Installation

```bash
npm install github:yourusername/reportes_lib
```

## Features

- AWS CloudWatch Logs integration
- Local file logging
- Log level management
- Log stream handling

## Usage

```javascript
import { reportes } from 'reportes_lib'

// Start logging
reportes.StartLog(options)

// Write logs
reportes.WriteLog(reportes.LOG_LEVELS.INFO, 'Message')

// Access current log info
console.log(reportes.LogFileName)
```

## Dependencies

- common_lib

## License

ISC
