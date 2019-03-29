# ionicLogFileAppender
Simple log file appender for Ionic 3. 
- Creates rolling log files date-stamped up to a specified max size.
- Optionally logs to console.
- Only writes log files if running on a Cordova platform (not in the browser)

## Installation
```bash
npm install --save ionic-log-file-appender
```

## Dependencies

Ionic Native File:

https://ionicframework.com/docs/native/file/

## Configuration

Logging configuration is specified by passing a ```ILogProviderConfig``` object into the init function of the ```LogProvider```.

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
  
  // Name of directory in which to create log directory
  baseDir: string;
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
  devMode: false,
  baseDir: <dataDirectory>
}
```

where dataDirectory is defined by the Ionic File plugin.

## Reference in Application module

```typescript
import {File} from '@ionic-native/file';
import {Platform} from 'ionic-angular';
import {DatePipe} from '@angular/common';
import {LogProvider, LogFileAppenderModule} from 'ionic-log-file-appender';

...


@NgModule({
  declarations: [
    MyApp
  ],
  imports: [
    ...
    LogFileAppenderModule.forRoot(),
    ...
  ]
  
  
  ...
  
  providers: [
      ...
      File,
      DatePipe,
      LogProvider,
      ...
  ]
})
export class AppModule { }
```

## Initialisation in application component
```typescript
  platform.ready().then(() => {
    return log.init({
      /* Your config here */
    });
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
    const errorObj = {message: 'FooBar error', code: 128};
    this.log.err('Something unexpected happened and the error object will be printed', errorObj);
    this.log.err('Something unexpected happened and the error object will not be printed');
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




