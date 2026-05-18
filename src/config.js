// @fileoverview config.js sets up the projectMaker config values.
// Config values include parameter settings like debug and help
// as well as the templateVars{} object which holds key/values for
// each template variable (e.g. templateVar.projectName='My Project')

import * as fs                            from 'node:fs';
import path                               from 'node:path';
import {stdin as input, stdout as output} from 'node:process';
import * as readline                      from 'node:readline/promises';
import {parseArgs}                        from 'node:util';
import * as tty                           from './tty.js';
import {ask, getUrlContent, sleep}        from './util.js';

export {Config}

class Config {
  static PROJECT_MAKER_VERSION = '1.0.0';
  static __dirname = import.meta.dirname;
  static CONFIG_FILE = path.join(Config.__dirname, 'projectMakerConfig.json');

  static DEFAULT_PROJECT_DIR = './newProject/';
  static DEFAULT_TEMPLATE_URL =
    'https://github.com/rg3h/templateWebApp/archive/refs/heads/main.zip';

  #settings = null;
  errorMsg  = null;

  // after config = new Config(); call await config.init();
  constructor() {
    this.#settings = {
      debug: false,
      githubVersion: null,
      help: false,
      interactive: true,
      templateVars: {},     // this holds all of the template {{vars}}
      projectMakerVersion: Config.PROJECT_MAKER_VERSION,
    };
  }


  // after config = new Config(); call await config.init();
  async init() {
    // reads information saved between runs of projectMaker
    const configObj = this.#readConfigFile();
    if (configObj.error) {
      tty.warningBox(configObj.error); // show error as warning and move on
    }
    await this.#checkForUpdatesPeriodically(configObj);
    this.#writeConfigFile(configObj);

    this.errorMsg = this.#parseArgsIntoSettings();
  }


  show() {
    console.log(JSON.stringify(this.#settings, null, 2));
  }


  getProjectMakerVersion() {
    return Config.PROJECT_MAKER_VERSION;
  }


  getDefaultProjectDir() {
    return Config.DEFAULT_PROJECT_DIR;
  }


  getDefaultTemplateUrl() {
    return Config.DEFAULT_TEMPLATE_URL;
  }

  getGithubVersion() {
    return this.#settings.githubVersion;
  }


  // usage: config.get() returns all #settings values as an object,
  //        config.get('debug') gets the debug value
  get(theVarAsString) {
    if (theVarAsString == null) {  // handles undefined and null
      return this.#settings;
    } else {
      return this.#settings[theVarAsString];
    }
  }


  // usage: config.set('key', value) sets a config value
  set(key, value) {
    this.#settings[key] = value;
  }


  // get a new projectDir and templateUrl
  // returns an error if projectDir already exists
  async askForNewProjDirAndTemplateUrl() {
    let defaultValue = '';
    let question = '';
    let answer = '';
    let templateVars = this.get('templateVars');

    // if projectDir not set by a command line param, ask or use the default
    defaultValue  = Config.DEFAULT_PROJECT_DIR;
    question = `what is the new directory name (e.g. ${defaultValue})? `;

    if (!templateVars.projectDir || templateVars.projectDir.length < 1) {
      templateVars.projectDir = await ask(question, defaultValue);
    }

    // issue an error if the projectDir already exists
    let absolutePath = path.resolve(templateVars.projectDir);
    if (fs.existsSync(absolutePath)) {
      return `error: ${templateVars.projectDir} already exists`;
    }

    // if templateUrl not set by a command line param, ask or use the default
    defaultValue  = Config.DEFAULT_TEMPLATE_URL;
    question = `what is the url for the template.zip file\n` +
      `(default: ${defaultValue})? `;

    if (!templateVars.templateUrl || templateVars.templateUrl.length < 1) {
      templateVars.templateUrl = await ask(question, defaultValue);
    }

    return null;
  }


  async askForTemplateValues(fileNameCount, varList) {
    let rl = readline.createInterface({input, output});
    let answer = '';
    let varCount = varList.length;

    console.log (`The template has ${fileNameCount} files that need `,
                 `changing. There are ${varCount} variables:`);
    console.log(' ' + varList.join(', '));
    console.log('please enter a value for the following variables:');

    let templateVars = this.get('templateVars');

    for (let i = 0; i < varCount; ++i) {
      let key = varList[i];
      if (!templateVars[key]) {
        answer = await rl.question(`${key}: `);
        templateVars[key] = answer;
      }
    }

    rl.close();
  }


  // get config information saved between runs, e.g. lastCheckedDate
  #readConfigFile() {
    let configObj = {
      error: null,
      lastCheckedDate: null,
    };

    try {
      // Specify 'utf8' to get a string, otherwise, you get a buffer
      // let data = fs.readFileSync(Config.CONFIG_FILE, 'utf8');
      let data = fs.readFileSync(Config.CONFIG_FILE);
      data = JSON.parse(data);
      configObj.lastCheckedDate = data.lastCheckedDate || new Date().getTime();
      configObj.error = null;

    } catch (err) {
      if (err.code !== 'ENOENT') { // if file missing, don't issue error msg
        configObj.error = `Error reading file: ${err.message}`;
      }
    }

    return configObj;
  }


  #writeConfigFile(configObj) {
    try {
      let data = JSON.stringify(configObj, null, 2);
      fs.writeFileSync(Config.CONFIG_FILE, data);
    } catch(err) {
      return err.message;
    }
  }


  // periodically check github to see if there is a newer version
  async #checkForUpdatesPeriodically(configObj) {
    const TEN_DAYS_IN_SECONDS = 864000;
    // const TEN_DAYS_IN_SECONDS = 30;

    let lastDateChecked = configObj.lastCheckedDate || new Date().getTime();
    let currentDate = new Date().getTime();
    let dateDiff = (currentDate - lastDateChecked) / 1000;

    if (dateDiff > TEN_DAYS_IN_SECONDS) {
      console.log('checking github for updates to projectMaker...');
      this.#settings.githubVersion = await this.#getGithubVersion();

      // if error getting github version, wait until next cycle to check again
      if (!this.#settings.githubVersion) {
        console.log('unable to fetch github version for projectMaker;',
                    'will try again later');
        configObj.lastCheckedDate = new Date().getTime(); // update checkDate
      } else {
        if (this.#settings.githubVersion == Config.PROJECT_MAKER_VERSION) {
          configObj.lastCheckedDate = new Date().getTime(); // update checkDate
          console.log('version is up to date');
        }
      }
    } else {
      // this.#showTimeLeftUntilNextCheck(TEN_DAYS_IN_SECONDS, dateDiff);
    }
  }


  #showTimeLeftUntilNextCheck(timeToWait, dateDiff) {
    let daysLeft = (timeToWait - dateDiff) / 86400;
    if (daysLeft >= 1) {
      console.log('you have', daysLeft.toFixed(1), 'days until we check');
    } else {
      let secondsLeft = daysLeft * 86400;
      console.log('you have', secondsLeft.toFixed(1), 'seconds until we check');
    }
  }


  async #getGithubVersion() {
    const url = 'https://raw.githubusercontent.com/rg3h/projectMaker/refs/heads/main/README.md';
    this.#settings.githubVersion = null;
    let data = await getUrlContent(url);

    if (data.indexOf('error') != 0) {  // no error
      const VERSION_TOKEN = 'version';
      let startPos = data.indexOf(VERSION_TOKEN);

      if (startPos > 0) {
        startPos += VERSION_TOKEN.length + 1;
        let endPos = data.indexOf('<', startPos);
        this.#settings.githubVersion = data.slice(startPos, endPos);
      }
    }

    return this.#settings.githubVersion;
  }


  // parse the command line parameters into this.#settings
  #parseArgsIntoSettings() {
    const BOOLEAN          = 'boolean';
    const STRING           = 'string';
    let defaultDebug       = this.get('debug');
    let defaultHelp        = this.get('help');
    let templateVars       = this.get('templateVars');
    let defaultProjectDir  = templateVars.projectDir;
    let defaultTemplateUrl = templateVars.templateUrl;

    const options = {
      debug:       {type:BOOLEAN,            default:defaultDebug},
      projectDir:  {type:STRING,  short:'p', default:defaultProjectDir},
      help:        {type:BOOLEAN, short:'h', default:defaultHelp},
      templateUrl: {type:STRING,  short:'t', default:defaultTemplateUrl},
    };

    let values = null;
    try {
      let parseObj = parseArgs({options});
      values = parseObj.values;
    } catch(err) {
      return `error: ${err.message}`;
    }

    this.#settings.debug = values.debug;
    this.#settings.help = values.help;
    this.#settings.templateVars.projectDir = values.projectDir;
    this.#settings.templateVars.templateUrl= values.templateUrl;

    return null;
  }

} // class Config
