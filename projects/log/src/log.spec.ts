import {DatePipe} from '@angular/common';
import {Entry, File} from '@ionic-native/file';
import {Platform} from 'ionic-angular';
import {PlatformMock} from 'ionic-mocks';
import {FileMock} from '../mocks/FileMock';
import {ILogProviderConfig} from './config';
import {LogProvider} from './log.service';

describe('File log appender provider', () => {
  let file: File;
  let fileMock: FileMock;
  let platform: Platform;
  let datePipe: DatePipe;
  let log: LogProvider;
  const config: ILogProviderConfig = {
    enableMetaLogging: true,
    logToConsole: true,
    devMode: true,
  };

  beforeEach(() => {
    file = FileMock.instance();
    fileMock = file;
    platform = PlatformMock.instance();
    datePipe = new DatePipe('en-US');

    log = new LogProvider(file, platform, datePipe)
  });

  it('should verify log provider instantiated', () => {
    expect(log).toBeDefined();
    expect(log.isReady()).toBeFalsy();

  });

  it('should check the log provider initialises correctly based on platform', (done) => {
    log.init(config)
      .then((result) => {
        expect(platform.is).toHaveBeenCalledWith('cordova');
        done();
      });
  });

  it('should create a file on initialisation', (done) => {
    log.init(config).then(() => {
      log.getLogFiles()
        .then((files: Entry[]) => {
          expect(files).toBeDefined();
          expect(files.length).toEqual(1);
          expect(log.isReady()).toBeTruthy();
          done();
        });
    });
  });

  it('should initialise correctly when maximum size is not exceeded', (done) => {
    // Set the total file size to be well under the rollover size
    FileMock.setFileSize(1);
    // Create three dummy files. Total size will not exceed max allowed
    FileMock.generateFiles(fileMock.dataDirectory + 'logs', 'log', 3);
    log.init(config)
      .then(() => {
        console.log('TEST: logger finished initialising');
        log.getLogFiles()
          .then((files: Entry[]) => {
            expect(files).toBeDefined();
            for (const file of files) {
              console.log(file.name)
            }
            expect(files.length).toEqual(3);
            expect(log.isReady()).toBeTruthy();
            done();
          });
      })
  });

  it('should cleanup files correctly when maximum size is exceeded', (done) => {
    // Set the file size to be just under the rollover size
    FileMock.setFileSize(5000000 - 1);
    // Create three dummy files. Total size will exceed max allowed
    FileMock.generateFiles(fileMock.dataDirectory + 'logs', 'log', 3);
    log.init(config)
      .then(() => {
        console.log('TEST: logger finished initialising');
        expect(log.isReady()).toBeTruthy();
        log.getLogFiles()
          .then((files: Entry[]) => {
            expect(files).toBeDefined();
            expect(files.length).toEqual(2);
            done();
          });
      })
  });

  it('should cleanup files correctly when single file exceeds maximum size', (done) => {
    // Set the file size to be just over the rollover size
    FileMock.setFileSize(5000000 +1);
    // Create three dummy files. Total size will exceed max allowed
    FileMock.generateFiles(fileMock.dataDirectory + 'logs', 'log', 1);
    log.init(config)
      .then(() => {
        console.log('TEST: logger finished initialising');
        expect(log.isReady()).toBeTruthy();
        log.getLogFiles()
          .then((files: Entry[]) => {
            expect(files).toBeDefined();
            expect(files.length).toEqual(1);
            done();
          });
      })
  });
});
