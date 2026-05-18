// @fileoverview nodeTimer.js is a high precision node.js timer
export {NodeTimer}

class NodeTimer {
  #timer = null;

  constructor() {
    this.#timer = process.hrtime();
  }

  start() {
    this.#timer = process.hrtime();
  }

  // alias for getTime() to be symmetric with start()
  stop() {
    return this.getTime();
  }

  // utility function to sleep for x seconds. accepts floats like 1.5
  // usage: let timer=new NodeTimer(); await timer.sleep(0.1);
  async sleep(seconds) {
    await new Promise(resolve => setTimeout(resolve, seconds*1000));
  }

  // returns the elapsed seconds
  getTime() {
    const end = process.hrtime(this.#timer);
    const secondsElapsed = end[0] + (end[1] / 1e9);
    return secondsElapsed;
  }
}
