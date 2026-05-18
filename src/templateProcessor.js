// @fileoverview templateProcessor creates a new project by
// downloading a template directory, unzipping it, and replacing
// template variables {{var}} with the provided values.

import fs                        from 'node:fs';
import path                      from 'node:path';
import yauzl                     from 'yauzl';
import {findInFile, getAllFiles} from './util.js';

export {TemplateProcessor}

class TemplateProcessor {
  #config = null;
  #stats  = null;


  constructor(config, stats) {
    this.#config = config;
    this.#stats = stats;
  }


  async fetchTemplate() {
    let templateVars  = this.#config.get('templateVars');
    let templateUrl  = templateVars.templateUrl;
    let projectDir   = templateVars.projectDir;

    let absolutePath = path.resolve(projectDir);
    if (fs.existsSync(absolutePath)) {
      return `error: ${relativePath} already exists`;
    }

    this.#stats.startDownloadTimer();
    let buffer = await this.#downloadToBuffer(templateUrl);

    this.#stats.stopDownloadTimer();

    if (typeof buffer === 'string') { // if returned a string, then is errorMsg
      let errorMsg = buffer;
      return errorMsg;
    }

    if (!buffer) {
      return null;
    }

    await this.#unzipBuffer(buffer, absolutePath);
    this.#moveExtractedFilesUpOneDir(absolutePath);

    return null;
  }


  // goes through the template and finds all {{}} vars
  // return object {filesWithVarsList, varList}
  async findTemplateVars() {
    let varSet = new Set();  // sets only add unique elements
    let allFilesList = [];
    let filesWithVarsList = [];

    // go through all files in the new project
    let templateVars  = this.#config.get('templateVars');
    let projectDir   = templateVars.projectDir;

    allFilesList = getAllFiles(projectDir);
    let allFilesCount = allFilesList.length;
    this.#stats.setProjectFileCount(allFilesCount);

    // now go through each file and look for template vars
    // /{{([^}]+)}}/ faster than /{{(.*?)}}/ since negate means no look ahead
    const regExp = /{{([^}]+)}}/ig;
    for (let i = 0; i < allFilesCount; ++i) {
      let fileName = allFilesList[i];
      let matchList = await findInFile(fileName, regExp);
      if (matchList != null && matchList.length > 0) {
        filesWithVarsList.push(fileName);
        for (let j = 0; j < matchList.length; ++j) {
          varSet.add(matchList[j]);
        }
      }
    }

    // convert set to reverse-sorted array
    let varList = [...varSet].toSorted().toReversed();
    return {filesWithVarsList, varList};
  }


  replaceVariables(fileList, config) {
    let templateVars = this.#config.get('templateVars');

    let keyList = '{{' + Object.keys(templateVars).join('}}|{{') + '}}';
    let regExp = new RegExp(keyList, 'g');

    for (let i = 0; i < fileList.length; ++i) {
      let fileName = fileList[i];
      // console.log(`processing ${fileName}...`);

      // read the file for template variables and replace them
      const data = fs.readFileSync(fileName, 'utf8');
      const result = data.replace(regExp, (matched) => {
        let varName = matched.slice(2,-2);  // slice off the {{ and }}
        return templateVars[varName];
      });

      let newFilePath = fileName;

      try {
      // Create folders if they don't exist
        fs.mkdirSync(path.dirname(newFilePath), { recursive: true });
        fs.writeFileSync(newFilePath, result);
      } catch(err) {
        console.error('Error writing to file ' + newFilePath, err);
      }
    }
  }


  async #downloadToBuffer(url) {
    const response = await fetch(url);
    if (!response.ok) {
      return `Error: failed to fetch ${url}`;
    }

    // convert response body (ReadableStream) to node buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer;
  }

  async #unzipBuffer(buffer, outputDir) {
    return new Promise((resolve, reject) => {
      try {
        // use yauzl to parse the buffer
        yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zipFile) => {
          if (err) {
            reject(err);
            return;
          }
          // console.log('There are', zipFile.entryCount, 'entries');

          zipFile.readEntry();

          zipFile.on('entry', (entry) => {
            this.#processZipEntry(zipFile, entry, outputDir); });

          zipFile.on('end', () => { resolve(); });

          zipFile.on('error', (err) => { reject(err); });
        }); // yauzl.fromBuffer(buffer, ...);
      } // try
      catch (e) {
        reject(e);
        return;
      }
    }); // return new Promise((resolve, reject)
  }


  async #unzipFile(zipFilePath, outputDir) {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      try {
        fs.mkdirSync(outputDir, { recursive: true });
      } catch(err) {
        console.log('unable to make dir for unzipFile', err);
        return;
      }
    }

    yauzl.open(zipFilePath, { lazyEntries: true }, (err, zipfile) => {
      if (err) throw err;

      // Start reading the first entry
      zipfile.readEntry();

      zipfile.on("entry", (entry) => {
        const fullPath = path.join(outputDir, entry.fileName);

        if (/\/$/.test(entry.fileName)) {
          // Directory entry: Create the folder then read the next entry
          fs.mkdirSync(fullPath, { recursive: true });
          zipfile.readEntry();
        } else {
          // File entry: Ensure the parent folder exists
          fs.mkdirSync(path.dirname(fullPath), { recursive: true });

          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) throw err;

            // Pipe the entry stream to a write stream
            const writeStream = fs.createWriteStream(fullPath);
            readStream.pipe(writeStream);

            readStream.on("end", () => {
              // Move to the next entry after current file is finished
              zipfile.readEntry();
            });
          });
        }
      });

      zipfile.on("end", () => {  console.log("Extraction complete!"); });
    });
  }


  #processZipEntry(zipFile, entry, outputDir) {
    try {
      const fullPath = path.join(outputDir, entry.fileName); // unzip fullPath

      if (/\/$/.test(entry.fileName)) {  // if is a dir
        fs.mkdirSync(fullPath, {recursive:true}); //create dir & get next entry
        zipFile.readEntry();
      } else {  // it is a file
        fs.mkdirSync(path.dirname(fullPath),{recursive:true});//ensure dir exist

        // open the read stream
        zipFile.openReadStream(entry, async (err, readStream) => {
          if (err) {
            reject(err);
            return;
          }

          // pipe the entry stream to a write stream
          const writeStream = fs.createWriteStream(fullPath);
          readStream.pipe(writeStream);

          writeStream.on('finish', () => {
            // wait until the file written, then read the next entry
            writeStream.close(() => { zipFile.readEntry(); });

            writeStream.on('error', (err) => {
              reject(err);
              return;
            });

          }); // writeStream.on('finish', ...)
        }); //  zipFile.openReadStream(entry, ...)
      } // else
    } // try
    catch (err) {
      reject(err);
      return;
    }
  }


  #getFirstDirectory(parentPath) {
    // read contents as dirent objects so we can check if they are directories
    const entries = fs.readdirSync(parentPath, { withFileTypes: true });

    // find the first entry where isDirectory() is true
    const firstDir = entries.find(entry => entry.isDirectory());

    return firstDir ? firstDir.name : null;
  }


  #moveExtractedFilesUpOneDir(parentDir) {
    let firstDir = this.#getFirstDirectory(parentDir);
    const childDir = path.join(parentDir, firstDir);

    try {
      const files = fs.readdirSync(childDir);

      files.forEach(file => {
        const oldPath = path.join(childDir, file);
        const newPath = path.join(parentDir, file);
        fs.renameSync(oldPath, newPath);
      });

      // remove the now-empty source directory
      fs.rmdirSync(childDir);
    } catch (err) {
      console.log('error: moving files up one level:', err);
    }
  }

} // class TemplateProcessor
