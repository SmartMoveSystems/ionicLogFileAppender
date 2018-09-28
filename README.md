# ionicLogFileAppender
Simple log file appender for Ionic 3. 
- Creates rolling log files date-stamped up to a specified max size.
- Optionally logs to console.
- Only writes log files if running on a Cordova platform (not in the browser)

## Installation
```bash
npm install --save ionic-file-log-appender
```

## Configuration

Logging configuration is specified by passing a ```LogProviderConfig``` object into the constructor of the ```LogProvider```.

```typescript
{
  // If true, logs verbose details of file logging operations to console
  enableMetaLogging: boolean;

  // If true, all file log messages also appear in the console
  logToConsole: boolean;

  // Date format used in log statements
  logDateFormat: string;

  // Date format used in log file names.
  // NOTE: be careful with special characters like ':' as this can cause file system issues
  fileDateFormat: string;

  // Maximum number of log statements before file rollover
  fileMaxLines: number;

  // If the last log file exceeds this size on initialization, a new log file will be created
  fileMaxSize: number;

  // If the total size of all log files exceeds this size on initialisation, oldest files will be removed
  totalLogSize: number;

  // Name of directory to create for logs, within application's data directory
  logDir: string;

  // Prefix for log files
  logPrefix: string;

  // Developer-level logging will appear in log files if true
  devMode: boolean;
}
```

Any values not specified in the passed-in value will be set to the defaults below:

```typescript
{
  enableMetaLogging: false,
  logToConsole: false,
  logDateFormat: 'yyyy-MM-dd HH:mm:ss.SSS',
  fileDateFormat: 'yyyy-MM-dd_HH-mm-ss-SSS',
  fileMaxLines: 2000,
  fileMaxSize: 1000000,
  totalLogSize: 5000000,
  logDir: 'logs',
  logPrefix: 'log',
  devMode: false
}
```

## Reference in Application module:

```typescript
import {File} from '@ionic-native/file';
import {LogProvider, LogProviderConfig} from 'ionic-log-file-appender';

export function provideLogger(file: File, platform: Platform, datePipe: DatePipe) {
  /**
   * Provider for persistent file logging services
   */
  return new LogProvider(file, platform, datePipe, new LogProviderConfig(new LoggingProviderConfig{/*your config here*/}));
}

@NgModule({
  declarations: [
    MyApp
  ],
  
  ...
  
  providers: [
      ...
      File,
      Platform,
      DatePipe,
      { provide: LogProvider, useFactory: provideLogger, deps: [File, Platform, DatePipe] },
      ...
  ]
})
export class AppModule { }
```

## Initialisation in application component:
```typescript
  platform.ready().then(() => {
    return log.init();
  });
```

## Usage in a class via dependency injection

```typescript
export class SomeClass {
  constructor(private log: LogProvider) {
  }
  
  doSomething() {
    this.log.log('Something has been done!');
    this.log.logDev('Something has been done, but will only be logged in if devMode is true');
  }
  
  getTheLogs() {
    this.log.getLogFiles()
          .then((files: Entry[]) => {
            // Do something with the files!
          })
          .catch(err => {
            // Oops, there was an error!
          });
  }
}
```




