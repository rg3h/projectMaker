// @fileoverview tty.js handles tty control sequences and special characters

const ESC = `\x1b`;

//export const BRIGHT_RED  = `${ESC}[38;5;9m`;
//export const BRIGHT_BLUE = `${ESC}[38;5;12m`;

export const WHITE         = `${ESC}[38;5;15m`;
export const BRIGHT_RED    = `${ESC}[38;5;196m`;
export const BRIGHT_BLUE   = `${ESC}[38;5;69m`;
export const BRIGHT_YELLOW = `${ESC}[38;5;11m`;

export const BLUE_BG       = `${ESC}[48;5;19m`;
export const BRIGHT_RED_BG = `${ESC}[48;5;196m`;
export const RED_BG        = `${ESC}[48;5;9m`;
export const WHITE_BG      = `${ESC}[48;5;15m`;


const CLR_FG_COLOR         = `${ESC}[39m`;
const CLR_BG_COLOR         = `${ESC}[49m`;
export const CLR_ALL       = `${ESC}[0m`;

export const TL_CORNER     = `\u250c`;
export const TR_CORNER     = `\u2510`;
export const BL_CORNER     = `\u2514`;
export const BR_CORNER     = `\u2518`;
export const CROSS         = `\u253c`;
export const T_LEFT        = `\u251c`;  // |-
export const T_RIGHT       = `\u2524`;  // -|
export const T_BOTTOM      = `\u2534`;
export const T_TOP         = `\u252c`;
export const V_BAR         = `\u2502`;
export const H_BAR         = `\u2500`;

export const LINE_WIDTH    = 80;
export const H_LINE        = H_BAR.repeat(LINE_WIDTH);
export const TOP_BAR    = TL_CORNER + H_BAR.repeat(LINE_WIDTH - 2) + TR_CORNER;
export const BOTTOM_BAR = BL_CORNER + H_BAR.repeat(LINE_WIDTH - 2) + BR_CORNER;


// puts a box around the message
// does not handle lines that are too long
export function box(msg) {
  // add vertical bars to all lines in msg
  let lineList = msg.split(`\n`);
  for (let i = 0; i < lineList.length; ++i) {
    let line = lineList[i];
    line = V_BAR + ` ` + line.padEnd(LINE_WIDTH - 4) + ` ` + V_BAR;
    lineList[i] = line;
  }
  let boxedMsg = lineList.join(`\n`);

  console.log(TOP_BAR);
  console.log(boxedMsg);
  console.log(`${BOTTOM_BAR}${CLR_ALL}`);
}


// puts a box around the msg and makes everything red
// does not handle lines that are too long
export function errorBox(msg) {
  //  console.log(`${CLR_ALL}${BRIGHT_RED}${WHITE_BG}`);
  //  console.log(`${CLR_ALL}${WHITE}${RED_BG}`);
  console.log(`${CLR_ALL}${BRIGHT_RED}`);
  box(msg);
  console.log(CLR_ALL);
}


// puts a box around the msg and makes everything red
// does not handle lines that are too long
export function warningBox(msg) {
  console.log(`${CLR_ALL}${BRIGHT_YELLOW}`);
  box(msg);
  console.log(CLR_ALL);
}
