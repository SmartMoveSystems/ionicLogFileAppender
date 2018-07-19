import {DatePipe} from '@angular/common';
import {Entry, File} from '@ionic-native/file';
import {Platform} from 'ionic-angular';
import {PlatformMock} from 'ionic-mocks';
import {FileMock} from '../mocks/FileMock';
import {LogProvider, LogProviderConfig} from './log';

describe('File log appender provider', () => {
  let file: File;
  let platform: Platform;
  let datePipe: DatePipe;
  let log: LogProvider;
  const config = new LogProviderConfig({});

  beforeEach(() => {
    file = FileMock.instance();
    platform = PlatformMock.instance();
    datePipe = new DatePipe('en-US');

    log = new LogProvider(file, platform, datePipe, config)
  });

  it('should verify log provider instantiated', () => {
    expect(log).toBeDefined();
  });

  it('should check the log provider initialises correctly based on platform', (done) => {
    log.init()
      .then((result) => {
        expect(platform.is).toHaveBeenCalledWith('cordova');
        done();
      });
  });

  it('should create a file on initialisation', (done) => {
    log.getLogFiles()
      .then((files: Entry[]) => {
        expect(files).toBeDefined();
        expect(files.length).toEqual(1);
        done();
      });
  });


});
