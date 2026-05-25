// @fileoverview help.js shows helpful information about projectMaker
import * as tty from './tty.js';

export {getPlug, showHelp, showIntro, showVersion}


// returns a string suggesting the use of gt to make github easier
function getPlug() {
  const gtUrl = `${tty.BRIGHT_BLUE}https://github.com/rg3h/gt${tty.CLR_ALL}`;
  return `Plug: use ${gtUrl} to manage your projects on github      `;
}


function showHelp(config) {
  const version           = config.getProjectMakerVersion();
  let  defaultProjectDir  = config.getDefaultProjectDir();
  let  defaultTemplateUrl = config.getDefaultTemplateUrl();

  const msg =
      `                   Welcome to projectMaker (v ${version})

 projectMaker copies a template and replaces {{variables}} with names
 for your project. By default projectMaker uses the template:

   ${tty.BRIGHT_BLUE}${defaultTemplateUrl}       ${tty.CLR_ALL}

 which contains files with {{variables}} in them.

 projectMaker does the following:
   o asks for the new project directory name and creates it
   o downloads a new project template and unzips it
   o searches through the files for template variables: {{variable}}
   o asks for a value for each of the variables and replaces it
   o shows application stats

This means you can use the default template or create your own with
your own {{variables}}. Just put your files on github and reference
that repo as the template.

 Command Line Flags:
  -p --projectDir  (default: \"${defaultProjectDir}")
  -h --help  shows this help
  -t --templateUrl url to a zip file that holds files with {{variables}}


` + getPlug();

  tty.box(msg);
  console.log('');
}

function showVersion(config) {
  console.log(config.getProjectMakerVersion());
}


function showIntro(config) {
  const GITHUB_URL = 'https://github.com/rg3h/projectMaker';
  const version = config.getProjectMakerVersion();
  const githubVersion = config.getGithubVersion();

  let outOfDateMsg = '';
  if (githubVersion != null && githubVersion != version) {
    outOfDateMsg =
      '\n' + tty.BRIGHT_YELLOW +
      ' There is a newer version (' + githubVersion + ') at ' +
      GITHUB_URL +  '   ' + tty.CLR_ALL + '\n';
  }

  const msg =
        `                   Welcome to projectMaker (v ${version})
 ${outOfDateMsg}
 projectMaker fetches a url pointing to a template.zip file,
 uncompresses it, and replaces all {{variables}} with values you provide.
 Use \"--help\" to learn more.

` + getPlug();

  tty.box(msg);
  console.log('');
}
