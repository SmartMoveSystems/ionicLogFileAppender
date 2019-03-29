/** Copyright 2019 SmartMove */
export interface ILogProviderConfig {
  // If true, logs verbose details of file logging operations to console
  enableMetaLogging?: boolean;

  // If true, all file log messages also appear in the console
  logToConsole?: boolean;

  // Date format used in log statements
  logDateFormat?: string;

  // Date format used in log file names.
  // NOTE: be careful with special characters like ':' as this can cause file system issues
  fileDateFormat?: string;

  // Maximum number of log statements before file rollover
  fileMaxLines?: number;

  // If the last log file exceeds this size on initialization, a new log file will be created
  fileMaxSize?: number;

  // If the total size of all log files exceeds this size on initialisation, oldest files will be removed
  totalLogSize?: number;

  // Name of directory to create for logs, within the baseDir
  logDir?: string;

  // Name of directory in which to create log directory
  baseDir?: string;

  // Prefix for log files
  logPrefix?: string;

  // Developer-level logging will appear in log files if true
  devMode?: boolean;
}
