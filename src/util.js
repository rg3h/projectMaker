// @fileoverview util.js  projectMaker utility functions
import fs                                 from 'node:fs';
import path                               from 'node:path';
import {readFile}                         from 'node:fs/promises';
import {stdin as input, stdout as output} from 'node:process';
import * as readline                      from 'node:readline/promises';

export {ask,
        findInFile,
        getAllFiles,
        getShortDateAndTime,
        getUrlContent,
        sleep};


// asks tee user a question and uses the default if they provide no answer
async function ask(question, defaultValue='') {
  let rl = readline.createInterface({input, output});
  let answer = await rl.question(question) || defaultValue;
  rl.close();
  return answer;
}

// usage: const regExp=/{{([^}]+)}}/ig; let list=findInFile('one.html',regExp);
async function findInFile(fileName, regExp) {
  try {
    // specifying 'utf8' returns a string instead of a Buffer
    const data = await readFile(fileName, 'utf8');
    const matchList = [...data.matchAll(regExp)];
    const resultList = matchList.map(m => m[1]);
    // console.log(fileName, 'matches:', resultList);
    return resultList;
  } catch (err) {
    console.error('Error reading file:', err.message);
  }
}


// usage: lat allFilesList = getAllFiles(dirPath);
function getAllFiles(dirPath, listOfFiles=[]) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);

    let stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      listOfFiles = getAllFiles(fullPath, listOfFiles);
    } else if (stat.isFile()) {
      listOfFiles.push(fullPath);
    }
  });

  return listOfFiles;
}

// returns 'Friday, 8 May 2026 at 17:30:07'
function getShortDateAndTime() {
  // use en-GB instead of en-US so the date is in the format: day month year
  const options = {weekday: 'long',
                   day: 'numeric',
                   month: 'long',
                   year: 'numeric',
                   hour: 'numeric',
                   minute: 'numeric',
                   second: 'numeric',
                   };

  return new Intl.DateTimeFormat('en-GB', options).format(new Date());
}

async function getUrlContent(url) {
  let dataString = null;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    dataString = await response.text();  // convert to text
  } catch (error) {
    dataString = 'error: '+ error;
  }

  return dataString;
}


// usage: await sleep(0.5);
async function sleep(seconds) {
  await new Promise(resolve => setTimeout(resolve, seconds*1000));
}
