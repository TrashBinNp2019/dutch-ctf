import { init as system_init } from "./mainframe/system/index.js";
import { spawn as myrtle } from "./entities/myrtle.js";
import { Entity } from './entities/general-entity.js';
import { networkInterfaces } from 'os';

const nets = networkInterfaces();
const results = {};
let addr = '';
console.time('- Time ellapsed'); // Initiate a timer with a prompt message

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
            onSuccess(entity);
        }).catch((err) => {
            onError(err);
        });
        break;
    }
    case 'myrtle': {
        console.log('- Starting myrtle');
        myrtle(addr)
        .then((entity) => {
            onSuccess(entity);
        }).catch(err => {
            onError(err);
        });
        break;
    } 
    default :{
        console.log('! Unknown mode:', mode);
    }
}

const onSuccess = (entity:Entity) => {
    console.log('+ Success');
    console.timeEnd('- Time ellapsed');
    console.log('- Ports:', entity.ports());
};

const onError = (err:Error) => {
    console.log('! Error:');
    console.log(err);
};