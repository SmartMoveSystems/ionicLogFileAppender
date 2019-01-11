import {DatePipe} from '@angular/common';
import {Entry, File} from '@ionic-native/file';
import {Injectable} from '@angular/core';
import {Platform} from 'ionic-angular';
import * as _ from 'lodash'

/**
 * SmartMove Ionic rolling log file appender
 * CellTrack Systems Pty Ltd 2018
 */
@Injectable()
export class LogProvider {

    private fileLoggerReady = false;
    private initFailed = false;
    private currentFile: Entry;
    private lines: 0;
    private queue: string[] = [];
    private processing = false;

    private defaultConfig = new LogProviderConfig({
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
    });

    private config: LogProviderConfig;

    constructor(private file: File,
                private platform: Platform,
                private datePipe: DatePipe,
                configuration: LogProviderConfig) {
        this.config = configuration;
        // Any configuration not specified will take the defaults
        this.config.merge(this.defaultConfig);
        this.debug_metaLog('LogProvider initialised with configuration: ' + JSON.stringify(this.config));
    }

    /**
     * Initializes the file logger
     * @returns Promise<any> upon completion or failure
     */
    init(): Promise<any> {
      this.fileLoggerReady = false;
        this.debug_metaLog('Initialising file logger');
        this.log('Initialising file logger');
        if (!this.platform.is('cordova'))
        {
            this.debug_metaLog('Not initialising file logger as the it is not supported by the platform ' + this.platform.url());
            this.initFailed = true;
            return Promise.resolve();
        }
        this.debug_metaLog('Data directory: ' + this.file.dataDirectory);
        return this.file.checkDir(this.file.dataDirectory, this.config.logDir)
            .then(() => {
                this.debug_metaLog('Found logging directory');
                return this.initLogFile();
            })
            .catch(err => {
                this.debug_metaLog('Could not find logging directory: ' + JSON.stringify(err));
                return this.createLogDir();
            });
    }

    isReady(): boolean {
      return this.fileLoggerReady;
    }

    /**
     * Attempts to create the logging directory
     * @returns {Promise<Entry[] | void>} upon completion or failure
     */
    private createLogDir() {
        this.debug_metaLog('Attempting to create logging directory');
        return this.file.createDir(this.file.dataDirectory, this.config.logDir, false)
            .then(() => {
                this.debug_metaLog('Successfully created logging directory');
                return this.initLogFile();
            })
            .catch(err => {
                this.initFailed = true;
                this.debug_metaLog('Failed to create logging directory: ' + JSON.stringify(err));
            });
    }

    /**
     * Attempts to initialise the current log file
     * @returns {Promise<Entry[] | void>} upon completion or failure
     */
    private initLogFile(): Promise<any> {
        this.debug_metaLog('Attempting to initialise log file');
        return this.file.listDir(this.file.dataDirectory, this.config.logDir)
            .then((entries: Entry[]) => {
                if (entries && entries.length > 0) {
                    this.debug_metaLog(entries.length + ' existing log files found.');
                    return this.cleanupFiles(entries);
                } else {
                    this.debug_metaLog('No existing log files found.');
                    return this.cleanupCompleted(null, 0, null);
                }
            })
            .catch(err => {
                this.debug_metaLog('Failed to get file list: ' + JSON.stringify(err, Object.getOwnPropertyNames(err)));
                throw err;
            });
    }

    /**
     * Checks the total size of log files against the configured maximum size and deletes oldest if necessary
     * @param {Entry[]} entries the files found in the logging directory
     * @returns {Promise<number>} upon completion or failure
     */
    private async cleanupFiles(entries: Entry[]): Promise<any> {
        this.debug_metaLog('Starting cleanup of ' + entries.length + ' log files');
        entries = _.filter(entries, (entry: Entry) => entry.isFile && entry.name.startsWith(this.config.logPrefix));
        if (entries.length === 0) {
            return this.cleanupCompleted(null, 0, null)
                .catch(err => {
                  // Now we're well and truly buggered
                  this.initFailed = true;
                  throw err;
                });
        }
        entries = _.orderBy(entries, ['name'],['asc']);
        let total = entries.length;
        let calculated = 0;
        let sizeTotal = 0;
        try {
            // Loop over entries
            for (let entry of entries) {
                const size = await this.getFileSize(entry);
                // Calculate total size of log files
                calculated++;
                sizeTotal += size;
                this.debug_metaLog('After ' + calculated + ' files, total size is ' + sizeTotal);
                if (sizeTotal > this.config.totalLogSize) {
                    this.debug_metaLog('Total log file size exceeds limit: ' + sizeTotal);
                    return this.maxSizeExceeded(entries, size)
                        .catch(err => {
                          // Now we're well and truly buggered
                          this.initFailed = true;
                          throw err;
                        });
                } else if (calculated === total) {
                    this.debug_metaLog('Total log file size is ok: ' + sizeTotal);
                    // Below max size, so we're ready to go
                    const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null;
                    return this.cleanupCompleted(lastEntry, size, null)
                        .catch(err => {
                          // Now we're well and truly buggered
                          this.initFailed = true;
                          throw err;
                        });
                }
            }
        } catch(failure) {
            const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null;
            // Not much we can do except try to continue
            return this.cleanupCompleted(lastEntry, 0, failure)
                .catch(err => {
                    // Now we're in real trouble
                    this.initFailed = true;
                    throw err;
                });
        }
    }

  /**
   * Wraps getMetadata in a Promise
   * @param {Entry} entry
   * @returns {Promise<number>}
   */
    private async getFileSize(entry: Entry): Promise<number> {
      return new Promise((resolve: ((number) => void), reject) => {
      entry.getMetadata(metadata => {
          resolve(metadata.size);
        }, failure => {
          reject('SEVERE ERROR: could not retrieve metadata. ' + JSON.stringify(failure));
        })
      });
    }

    /**
     * Attempts to remove one file and recursively check total size again
     * @param {Entry[]} entries
     * @param {number} lastEntrySize
     * @param resolve
     * @param reject
     */
    private maxSizeExceeded(entries: Entry[], lastEntrySize: number): Promise<any> {
        return this.removeFile(entries[0])
            .then(() => {
                this.debug_metaLog('Entry successfully removed');
                // Remove oldest entry
                entries.shift();
                // Check again
                return this.cleanupFiles(entries);
            })
            .catch(err => {
                const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null;
                // Not much we can do except try to continue
                return this.cleanupCompleted(lastEntry, lastEntrySize, 'SEVERE ERROR: could not clean up old files. ' + err);
            })
    }

    /**
     * When file cleanup is completed, attempts to initialise config to point to current log file
     * @param {Entry} lastEntry The most recent existing log file
     * @param {number} lastEntrySize The size of the most recent existing log file
     * @param {string} error Any error to be logged after initialization
     * @returns {Promise<any>}
     */
    private cleanupCompleted(lastEntry: Entry, lastEntrySize: number, error: string): Promise<any> {
        this.debug_metaLog('Log file cleanup done');
        if (lastEntry && lastEntrySize < this.config.fileMaxSize) {
            this.currentFile = lastEntry;
            this.fileLoggerReady = true;
            if (error) {
                this.log(error);
            }
            this.debug_metaLog('File logger initialised at existing file: ' + this.currentFile.fullPath);
            this.log('File logger initialised at existing file: ' + this.currentFile.name);
            return Promise.resolve();
        } else {
            this.debug_metaLog('Last file nonexistent or too large. Creating new log file');
            return this.createNextFile()
                .then(() => {
                    this.fileLoggerReady = true;
                    if (error) {
                        this.log(error);
                    }
                    this.debug_metaLog('File logger initialised at new file: ' + this.currentFile.fullPath);
                    this.log('File logger initialised at new file: ' + this.currentFile.name);
                    return Promise.resolve();
                });
        }
    }

    /**
     * Attempts to remove a file
     * @param {Entry} entry
     * @returns {Promise<RemoveResult>}
     */
    private removeFile(entry: Entry) {
        this.debug_metaLog('Removing file: ' + entry.fullPath);
        const fullPath = entry.fullPath;
        const path = fullPath.replace(entry.name, '');
        return this.file.removeFile(this.file.dataDirectory + path, entry.name);
    }

    /**
     * Puts the message on the queue for writing to file
     * @param {string} message
     */
    log(message: string) {
        const date = new Date();
        const dateString = this.datePipe.transform(date, this.config.logDateFormat);
        const logMessage = '[' + dateString + '] ' + message + '\r\n';
        if (this.config.logToConsole) {
            console.log(logMessage);
        }
        if (this.initFailed) {
            this.debug_metaLog('File logger init has failed! Message discarded');
            return;
        } else {
            // Put the message on the queue
            this.queue.push(logMessage);
            if (this.fileLoggerReady) {
                if (this.queue.length > 0 && !this.processing) {
                    this.processing = true;
                    this.doProcess();
                }
            } else {
                this.debug_metaLog('File logger is not ready! Message left on queue');
            }
        }
    }

    /**
     * Developer-level logging
     * @param {string} message
     */
    logDev(message: string) {
        if (this.config.devMode) {
            this.log('*DEBUG* ' + message);
        }
    }

    /**
     * Writes the current logging queue to file
     */
    private doProcess() {
        this.debug_metaLog('Beginning processing loop');
        this.processQueue()
            .then(() => {
                if (this.queue.length > 0) {
                    this.doProcess();
                } else {
                    this.checkFileLength()
                        .then(() => {
                            this.processing = false;
                        })
                        .catch(err => {
                            this.debug_metaLog('Error checking file length: ' + JSON.stringify(err));
                            this.processing = false;
                        });
                }
            })
          .catch(err => {
                this.debug_metaLog('Error processing queue: ' + err);
                this.processing = false;
            });
    }

    /**
     * Writes the oldest entry in the queue to file, then checks if file rollover is required
     * @returns {Promise<void>}
     */
    private processQueue() {
        this.debug_metaLog('Processing queue of length ' + this.queue.length);
        if (this.queue.length > 0) {
            const message = this.queue.shift();
            return this.file.writeFile(this.file.dataDirectory + '/' + this.config.logDir, this.currentFile.name, message, {
                append: true,
                replace: false
            })
                .then(() => {
                    this.lines++;
                    return this.checkFileLength();
                })
                .catch(err => {
                    this.debug_metaLog('Error writing to file: ' + err);
                });
        }
    }

    /**
     * Checks the file length and creates a new file if required
     * @returns {any}
     */
    private checkFileLength() {
        if (this.lines >= this.config.fileMaxLines) {
            this.debug_metaLog('Creating new file as max number of log entries exceeded');
            return this.createNextFile();
        } else {
            return Promise.resolve();
        }
    }

    /**
     * Generates a log file name from the current time
     * @returns {string}
     */
    private createLogFileName(): string {
        const date = new Date();
        const dateString =this.datePipe.transform(date, this.config.fileDateFormat);
        return this.config.logPrefix + '.' + dateString + '.log'
    }

    /**
     * Creates the next log file and updates the local reference
     */
    private createNextFile(): Promise<any> {
        const fileName = this.createLogFileName();
        this.debug_metaLog('Attempting to create file at: ' + this.file.dataDirectory + this.config.logDir + '/' + fileName);
        return this.file.createFile(this.file.dataDirectory + '/' + this.config.logDir, fileName, false)
            .then(newFile => {
                this.lines = 0;
                this.currentFile = newFile;
                this.debug_metaLog('Created new file: ' + this.currentFile.fullPath);
            })
            .catch(err => {
                this.debug_metaLog('Failed to create new file: ' + JSON.stringify(err));
            });
    }

    /**
     * Retrieves the current list of log files in the logging directory
     * @returns {Promise<Entry[]>}
     */
    getLogFiles(): Promise<Entry[]> {
        this.debug_metaLog('Attempting to retrieve log files');
        if (this.initFailed) {
            this.debug_metaLog('Log never initialised so can\'t retrieve files');
            return Promise.resolve([]);
        } else {
            return this.file.listDir(this.file.dataDirectory, this.config.logDir);
        }
    }

    private debug_metaLog(message: string) {
        if (this.config.enableMetaLogging) {
            console.log('**LOGGER_META**: ' + message);
        }
    }
}

export class LogProviderConfig {
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

    constructor(fields: any) {
        // Quick and dirty extend/assign fields to this model
        for (const f in fields) {
            // @ts-ignore
            this[f] = fields[f];
        }
    }

    /**
     * Overrides this object's uninitialized fields with the passed parameter's fields
     * @param config
     */
    merge(config: any) {
        for (let k in config) {
            if (!(k in this)) {
                this[k] = config[k];
            }
        }
    }
}
