// @fileoverview projectMaker creates a skeleton project by
// downloading a template with {{var}} and replacing them with values
// obtained from asking the user.

import {Config}            from './config.js';
import {Stats}             from './stats.js';
import {TemplateProcessor} from './templateProcessor.js';
import * as tty            from './tty.js';
import * as help           from './help.js';

// main entry point for the projectMaker app
async function main() {
  let errorMsg = null;
  let stats = new Stats();
  let config = new Config();
  await config.init();  // call init() since config constructor cannot be async

  if (config.errorMsg) {
    console.log(config.errorMsg);
    return;
  }

  if (config.get('help')) {
    help.showHelp(config);
    return;
  }

  help.showIntro(config);

  // ask for the new project directory name and template to use
  errorMsg = await config.askForNewProjDirAndTemplateUrl();

  if (errorMsg) {
     tty.errorBox(errorMsg);
     return;
   }

  // fetch template into new proj dir, unzip it, and move files up one level
  let templateProcessor = new TemplateProcessor(config, stats);

  console.log('fetching the template...');
  errorMsg = await templateProcessor.fetchTemplate();
  if (errorMsg) {
    tty.errorBox(errorMsg);
    return;
  }


  // find all template {{}} variables so we can ask for their values
  let {filesWithVarsList, varList} = await templateProcessor.findTemplateVars();

  // console.log('');
  // console.log('in main.js fileList', filesWithVarsList);
  // console.log('in main.js varList', varList);
  // console.log('');

  if (filesWithVarsList.length > 0 && varList.length > 0) {
    // ask for values to replace the template variables
    await config.askForTemplateValues(filesWithVarsList.length, varList);

    // replace the template variables with the values
    templateProcessor.replaceVariables(filesWithVarsList, config);
  }

  // show the resulting stats
  stats.show(config, filesWithVarsList.length);
}

main();
