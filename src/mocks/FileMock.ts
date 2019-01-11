import {
  DirectoryEntry, DirectoryEntryCallback, Entry, EntryCallback, ErrorCallback, IWriteOptions, MetadataCallback,
  VoidCallback
} from '@ionic-native/file';

/**
 * Quick and dirty file system mock
 */
export class FileMock {
  public applicationDirectory: string = 'a-directory';
  public applicationStorageDirectory: string = 'a-directory';
  public dataDirectory: string = 'a-directory';
  public cacheDirectory: string = 'a-directory';
  public externalApplicationStorageDirectory: string = 'a-directory';
  public externalDataDirectory: string = 'a-directory';
  public externalCacheDirectory: string = 'a-directory';
  public externalRootDirectory: string = 'a-directory';
  public tempDirectory: string = 'a-directory';
  public syncedDataDirectory: string = 'a-directory';
  public documentsDirectory: string = 'a-directory';
  public sharedDirectory: string = 'a-directory';
  public cordovaFileError: any;

  private static files: Entry[] = [];

  private static theInstance: any;
  private static metaDataSize = 10000;

  public static instance(): any {
    if (!FileMock.theInstance) {
      let instance = jasmine.createSpyObj('File', [
        'getFreeDiskSpace',
        'checkDir',
        'createDir',
        'removeDir',
        'moveDir',
        'copyDir',
        'listDir',
        'removeRecursively',
        'checkFile',
        'createFile',
        'removeFile',
        'writeFile',
        'writeExistingFile',
        'readAsText',
        'readAsDataURL',
        'readAsBinaryString',
        'readAsArrayBuffer',
        'moveFile',
        'copyFile',
        'resolveLocalFilesystemUrl',
        'resolveDirectoryUrl',
        'getDirectory',
        'getFile'
      ]);

      instance.getFreeDiskSpace.and.returnValue(Promise.resolve(64));
      instance.checkDir.and.returnValue(Promise.resolve(true));
      instance.createDir.and.returnValue(Promise.resolve());
      instance.removeDir.and.returnValue(Promise.resolve());
      instance.moveDir.and.returnValue(Promise.resolve());
      instance.copyDir.and.returnValue(Promise.resolve());
      instance.listDir.and.callFake(FileMock.listDir);
      instance.removeRecursively.and.returnValue(Promise.resolve());
      instance.checkFile.and.returnValue(Promise.resolve(true));
      instance.createFile.and.callFake((path: string, fileName: string, replace: boolean) => {
        return Promise.resolve(FileMock.createFile(path, fileName, replace));
      });
      instance.removeFile.and.callFake((path: string, fileName: string) => {
        console.log('FileMock removed file with name: ' + fileName);
        FileMock.removeFile(path, fileName);
        return Promise.resolve();
      });
      instance.writeFile.and.callFake((path: string, fileName: string, text: string | Blob | ArrayBuffer, options?: IWriteOptions) => {
        console.log('FileMock wrote: "' + text + '" to file ' + fileName);
        return Promise.resolve()
      });
      instance.writeExistingFile.and.returnValue(Promise.resolve());
      instance.readAsText.and.returnValue(Promise.resolve('a string'));
      instance.readAsDataURL.and.returnValue(Promise.resolve('data:,some%20data'));
      instance.readAsBinaryString.and.returnValue(Promise.resolve('101010'));
      instance.readAsArrayBuffer.and.returnValue(Promise.resolve(new ArrayBuffer(1)));
      instance.moveFile.and.returnValue(Promise.resolve());
      instance.copyFile.and.returnValue(Promise.resolve());
      instance.resolveLocalFilesystemUrl.and.returnValue(Promise.resolve());
      instance.resolveDirectoryUrl.and.returnValue(Promise.resolve());
      instance.getDirectory.and.returnValue(Promise.resolve());
      instance.getFile.and.returnValue(Promise.resolve());
      instance.dataDirectory = 'data/';
      FileMock.theInstance = instance;
    }

    FileMock.files = [];

    return FileMock.theInstance;
  }

  public static setFileSize(size: number): void {
    console.log('FileMock file size set to ' + size);
    FileMock.metaDataSize = size;
  };

  public static generateFiles(path: string, prefix: string, numFiles: number): void {
    FileMock.instance();
    for (let i = 0; i < numFiles; i++) {
      FileMock.createFile(path, prefix + i, true);
    }
  }

  static listDir(path: string, dirName: string): Promise<Entry[]> {
    return Promise.resolve(FileMock.files);
  }

  static removeFile = function (path: string, fileName: string) {
    let removeIndex = -1;
    for (let i = 0; i < FileMock.files.length; i++) {
      if (FileMock.files[i].name === fileName) {
        removeIndex = i;
        break;
      }
    }
    if (removeIndex > -1) {
      FileMock.files.splice(removeIndex, 1);
    }
  };

  static createFile = function (path: string, fileName: string, replace: boolean): Entry {
    console.log('FileMock creating file with name ' + fileName + ' at ' + path);
    const entry = {
      isFile: true,
      isDirectory: false,
      getMetadata: function (successCallback: MetadataCallback, errorCallback?: ErrorCallback) {
        successCallback({
          modificationTime: new Date(),
          size: FileMock.metaDataSize
        });
      },
      setMetadata: function (successCallback: MetadataCallback, errorCallback?: ErrorCallback) {
        successCallback(null);
      },
      name: fileName,
      fullPath: fileName,
      filesystem: null,
      nativeURL: fileName,
      moveTo: function (parent: DirectoryEntry, newName?: string, successCallback?: EntryCallback, errorCallback?: ErrorCallback) {
        successCallback(null);
      },
      copyTo: function (parent: DirectoryEntry, newName?: string, successCallback?: EntryCallback, errorCallback?: ErrorCallback) {
        successCallback(null);
      },
      toURL: function () {
        return fileName;
      },
      toInternalURL: function () {
        return fileName;
      },
      remove: function (successCallback: VoidCallback, errorCallback?: ErrorCallback) {
        successCallback();
      },
      /**
       * Look up the parent DirectoryEntry containing this Entry. If this Entry is the root of its filesystem, its parent is itself.
       * @param successCallback A callback that is called to return the parent Entry.
       * @param errorCallback A callback that is called when errors happen.
       */
      getParent: function (successCallback: DirectoryEntryCallback, errorCallback?: ErrorCallback) {
        successCallback(null);
      }
    };
    FileMock.files.push(entry);
    return entry;
  };
}
