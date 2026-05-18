// @fileoverview node simpleServer.js serves files and /cmd
'use strict';

//const execSync = require('child_process').execSync
const {execSync} = require('child_process');  // eslint-disable-line no-undef
const fs = require('fs');                     // eslint-disable-line no-undef
const http = require('http');                 // eslint-disable-line no-undef
const https = require('https');               // eslint-disable-line no-undef
const os = require('os');                     // eslint-disable-line no-undef
const pathObj = require('path');              // eslint-disable-line no-undef
const { parse } = require('querystring');     // eslint-disable-line no-undef
const appPackage = require('./package.json'); // eslint-disable-line no-undef

const SECURE_PORT = 8000;
const REG_PORT    = 8001;
let ipAddressList = [];

// eslint-disable-next-line no-undef
let webRoot = frontSlash(pathObj.normalize(__dirname + '/'));
main();


function main() {
  processArgs();
  console.log(appPackage.name, getDate(false), 'webroot:', webRoot);

  let cmd = 'openssl req -new -newkey rsa:4096 -days 365 -nodes -x509 ' +
    '-subj "/C=US/ST=ofMind/L=whereever/O=Company/CN=localhost" ' +
    '-keyout key.pem -out cert.pem 2> NUL';
  // let result = execSync(cmd).toString();  // returns the stdout of the cmd
  // console.log('result', result);
  execSync(cmd).toString();  // returns the stdout of the cmd

  const options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
  };

  cmd = 'rm -f ./csr.pem ./key.pem ./cert.pem'
  execSync(cmd).toString();

  ipAddressList = getIpAddressList();
  if (ipAddressList.length < 1) {
    console.error('error getting the ip address');
    return;
  }

  const secureServer = https.createServer(options, handleRequest);
  secureServer.listen(SECURE_PORT, handleSecureServerStarted);

  const regServer = http.createServer(handleRequest);
  regServer.listen(REG_PORT, handleRegServerStarted);
}

function processArgs() {
  let param;

  // eslint-disable-next-line no-undef
  for (let i = 2, len = process.argv.length; i < len; ++i) {
    switch(process.argv[i].toLowerCase()) {   // eslint-disable-line no-undef
    case '-wr':
    case '-webroot':
    case '--webroot':
      // eslint-disable-next-line no-undef
      param = process.argv[++i] || ''; // get next param as the webroot
      // eslint-disable-next-line no-undef
      webRoot = frontSlash(pathObj.normalize(param + '/'));
      break;
    }
  }
}

function frontSlash(inputString) {
  // eslint-disable-next-line no-control-regex
  const hasNonAscii = /[^\u0000-\u0080]+/.test(inputString);
  const isExtendedLengthPath = /^\\\\\?\\/.test(inputString);

  if (isExtendedLengthPath || hasNonAscii) {
    return inputString;
  }

  return inputString.replace(/\\/g,'/');
}

function getIpAddressList() {
  let list = [];
  const interfaceObj = os.networkInterfaces();
  Object.keys(interfaceObj).forEach(function(interfaceName) {
    interfaceObj[interfaceName].forEach(function(ele) {
      if (ele.family === 'IPv4' && ele.internal === false) {
        list.push(ele.address);
      }
    });
  });
  return list;
}

// eslint-disable-next-line no-unused-vars
function isNumeric(n) {
  return !isNaN(n) && !isNaN(parseFloat(n));
}

function handleSecureServerStarted(err) {
  if (err) {
    console.error(err);
    return ;
  }

  let address = [];
  let protocol = 'https://';
  for (let i = 0, len = ipAddressList.length; i < len; ++i) {
    address.push(protocol + ipAddressList[i] + ':' + SECURE_PORT + ' ');
  }

  console.log('secure HTTPS open on: ' + address.join(''));
}

function handleRegServerStarted(err) {
  if (err) {
    console.error(err);
    return ;
  }

  let address = [];
  let protocol = 'http://';
  for (let i = 0, len = ipAddressList.length; i < len; ++i) {
    address.push(protocol + ipAddressList[i] + ':' + REG_PORT + ' ');
  }

  console.log('regular HTTP open on: ' + address.join(''));
}

function sendError(response, msg) {
  response.writeHead(400, {'Content-Type': 'text/html; charset=utf-8'});
  response.end(msg, 'utf8');  // encodeURIComponent(msg));
}

function send(response, msg, suffix) {
  let head = {};

  switch(suffix) {
  case '.cjs':   head['Content-Type'] = 'text/javascript; charset=utf-8'; break;
  case '.css':   head['Content-Type'] = 'text/css; charset=utf-8'; break;
  case '.csv':   head['Content-Type'] = 'text/csv; charset=utf-8'; break;
  case '.ico':   head['Content-Type'] =
      'image/vnd.microsoft.icon; charset=utf-8'; break;
  case '.jpeg':  head['Content-Type'] = 'image/jpeg; charset=utf-8'; break;
  case '.jpg':   head['Content-Type'] = 'image/jpeg; charset=utf-8'; break;
  case '.js':    head['Content-Type'] = 'text/javascript; charset=utf-8'; break;
  case '.json':  head['Content-Type'] = 'application/json; charset=utf-8';break;
  case '.mid':   head['Content-Type'] = 'audio/midi; charset=utf-8'; break;
  case '.midi':  head['Content-Type'] = 'audio/midi; charset=utf-8'; break;
  case '.mjs':   head['Content-Type'] = 'text/javascript; charset=utf-8'; break;
  case '.mp3':   head['Content-Type'] = 'audio/mp3; charset=utf-8'; break;
  case '.mp4':   head['Content-Type'] = 'video/mp4; charset=utf-8'; break;
  case '.otf':   head['Content-Type'] = 'font/otf; charset=utf-8'; break;
  case '.png':   head['Content-Type'] = 'image/png; charset=utf-8'; break;
  case '.pdf':   head['Content-Type'] = 'application/pdf; charset=utf-8'; break;
  case '.svg':   head['Content-Type'] = 'image/svg+xml; charset=utf-8'; break;
  case '.ttf':   head['Content-Type'] = 'font/ttf; charset=utf-8'; break;
  case '.wav':   head['Content-Type'] = 'audio/wav; charset=utf-8'; break;
  case '.webp':  head['Content-Type'] = 'image/webp; charset=utf-8'; break;
  case '.woff':  head['Content-Type'] = 'font/woff; charset=utf-8'; break;
  case '.woff2': head['Content-Type'] = 'font/woff2; charset=utf-8'; break;
  case '.zip':   head['Content-Type'] = 'application/zip; charset=utf-8'; break;
  default:       head['Content-Type'] = 'text/html; charset=utf-8';
  }

  response.writeHead(200, head);
  response.end(msg, 'utf8'); // encodeURIComponent(msg));
}

function handleRequest(request, response) {
  if (request.method === 'GET') {
    handleGetRequest(request, response);
  } else {
    handlePostRequest(request, response);
  }
}

function handleGetRequest(request, response) {
  const protocol= request.connection.encrypted ? 'https' : 'http';
  const baseUrl= protocol + '://localhost:' + request.socket.localPort
  const url = new URL(request.url, baseUrl);

  const fileName = url.pathname;
  const paramObj = url.query;

  if (fileName === '/favicon.ico') {
    handleFavIcon(response);
  } else if (fileName === '/cmd') {
    // handleCmdRequest(paramObj, response);  // UNCOMMENT TO use /cmd requests
  } else {
    handleFileRequest(fileName, paramObj, response);
  }
}

function handlePostRequest(request, response) {
  let dataString = '';
  request.on('data', chunk => {
    dataString += chunk.toString(); // convert Buffer to string
  });

  request.on('end', () => {
    let data = parse(dataString);
    console.log(data);

    // allow local host
    let port = 666;
    let isSecure = true;
    let protocol = 'http' + (isSecure ? 's' : '') + '://';
    let url = protocol + 'localhost:' + port;
    response.setHeader('Access-Control-Allow-Origin', url);
    send(response, 'POST was handled by the server.', 'html');
  });
}

// do not send the favicon every time
function handleFavIcon(response) {
  response.writeHead(204, {'Content-Type': 'image/x-icon'} );
  response.end();
}

function handleFileRequest(fileName, paramObj, response) {
  fileName = fileName === '/' ? 'index.html' : fileName; // default index.html

  const pathName = frontSlash(pathObj.normalize(webRoot + fileName));
  const pathParts = pathObj.parse(pathName);
  let status = {err:false, msg:''};

  // make sure the pathName is not above the webRoot
  const relativePath = pathObj.relative(webRoot, pathName);
  if (relativePath.indexOf('..') !== -1) {
    status.err = true;
    status.msg = 'path above webroot denied ' + relativePath;
  } else {
    status = readTheFile(pathName);
  }

  // let shortPath = pathName;
  // shortPath = shortPath.replace("C:/rcg/src/projects", "...");
  // shortPath = shortPath.replace("dev/client", "...");
  if (status.err) {
    const msg = ['error reading', pathName, status.msg].join(' ');
    console.error(msg);
    sendError(response, '404: file not found: ' + pathName);
  } else {
    console.log(getDate(true) + ' ', fileName); // shortPath); // pathName);
    send(response, status.msg, pathParts.ext);
  }
}

function getDate(compact=true) {
  let date = new Date();

  let args = compact ?
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits:3,
        hour12: false,
      } :
      {
        weekday: 'short',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        // fractionalSecondDigits:3,
        hour12: false,
      };

  return date.toLocaleString(undefined, args);
}

function readTheFile(pathName) {
  const status = {err:false, msg:''};

  try {
    status.msg = fs.readFileSync(pathName); //, 'utf8');
  } catch(error) {
    status.err = error;
    status.msg = error.code;
  }
  return status;
}

// eslint-disable-next-line no-unused-vars
function writeTheFile(pathName, data) {
  const status = {err:false, msg:''};

  try {
    status.msg = fs.writeFileSync(pathName, data);
  } catch(error) {
    status.err = error;
    status.msg = error.code;
  }
  return status;
}

// eslint-disable-next-line no-unused-vars
function handleCmdRequest(paramObj, response) {
  let results = {};
  console.log('*********************CMD', paramObj);

  const keyList = Object.keys(paramObj);
  const cmd = keyList[0];
  const paramStr = paramObj[keyList[1]];

  let param = JSON.parse(paramStr);
  // let confidence = param.confidence;

  // let dataList = dataStr.split('"');
  // let value = '"' + dataList.join('\\\"') + '"';

  console.log('would run command', cmd, paramStr);

  let data, dataError;
  try {
    // data = execSync(cmd, {encoding: 'UTF-8'});
  } catch(error) {
    if (error.status === 2) {
      dataError = 'unknown python command ' + param;
    }
  }

  if (dataError) {
    results.error = dataError;
  } else {
    results.data = data;
  }

  send(response, JSON.stringify(results));
}
