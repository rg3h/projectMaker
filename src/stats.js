// @fileoverview Stats keeps stats on making the new project
import * as path             from 'node:path';
import {NodeTimer}           from './nodeTimer.js';
import {getPlug}             from './help.js';
import * as tty              from './tty.js';
import {getShortDateAndTime} from './util.js';


export {Stats}

class Stats {
  #totalAppTimer    = null;
  #downloadTimer    = null;
  #downloadTime     = 0;
  #projectFileCount = 0;

  constructor() {
    this.#totalAppTimer = new NodeTimer();
    this.#totalAppTimer.start();
    this.#downloadTimer = new NodeTimer();
  }

  setProjectFileCount(count) {
    this.#projectFileCount = count;
  }

  startDownloadTimer() {
    this.#downloadTimer.start();
  }

  stopDownloadTimer() {
    this.#downloadTime = this.#downloadTimer.stop();
  }

  show(config, filesChangedCount) {
    let appTime = this.#totalAppTimer.stop().toFixed(1).padStart(5, ' ');
    let downloadTime = this.#downloadTime.toFixed(1).padStart(5, ' ');

    let templateVars = config.get('templateVars');
    let projectDir = templateVars.projectDir;
    let absolutePath = path.resolve(projectDir);

    let projectTitle = templateVars.projectTitle || projectDir;
    const fileCount = this.#projectFileCount;

    const date = getShortDateAndTime();

    // show the template strings that were replaced
    let templateVarStr = '';
    let keys = Object.keys(templateVars);
    for (let i = 0; i < keys.length; ++i) {
      let key = keys[i];
      let theValue = templateVars[key];
      key === 'templateUrl' ? theValue = theValue.replace('https://', ''): null;
      templateVarStr += '  ' + key + ': ' + theValue + '\n';
    }

    let msg = `projectMaker created \"${projectTitle}\" on ${date}
${fileCount} files added to ${absolutePath}
${filesChangedCount} files had variables that were updated
the template strings that were replaced are:
${templateVarStr}

download time: ${downloadTime} seconds
total time:    ${appTime} seconds

` + getPlug();

    console.log('');
    tty.box(msg);
  }


} // class Stats
