import { init as system_init } from "./mainframe/system/index.js";
import { spawn as myrtle, spawn } from "./entities/myrtle.js";
import * as saturn from './general/saturn.js';
import { Saturn } from './general/consts.js';
import { networkInterfaces } from 'os';

const nets = networkInterfaces();
const results = {};
let addr = '';

for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    if (net.family === 'IPv4' && !net.internal) {
      if (!results[name]) {
        results[name] = [];
      }
      results[name].push(net.address);
    }
  }
}

console.log('- Detected networks: ', results);
switch (Object.keys(results).length) {
    case 0: {
        console.log('! No suitable network interfaces detected');
        break;
    }
    default: {
        addr = results[Object.keys(results)[0]][0];
        console.log('- Using network interface', addr);
        break;
    }
}

let mode = '';
if (process.argv.length < 3) {
    console.log('? No arguments provided, launching mainframe');
    mode = 'mainframe';
} else {
    mode = process.argv[2];
}

switch (mode) {
    case 'mainframe': {
        console.log('- Starting mainframe');
        system_init(addr)
        .then((entity) => {
            console.log('+ Success');
            console.log('- Ports:', entity.ports());
        }).catch((err) => {
            console.log('! Error:');
            console.log(err);
        });
        break;
    }
    case 'myrtle': {
        console.log('- Starting myrtle');
        myrtle(addr)
        .then((entity) => {
            console.log('+ Success');
            console.log('- Ports:', entity.ports());
        }).catch(err => {
            console.log('! Error:');
            console.log(err);
        });
        break;
    } 
    default :{
        console.log('! Unknown mode:', mode);
    }
}