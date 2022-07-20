import { init as system_init } from "./mainframe/system/index.js";
import { spawn as myrtle } from "./entities/myrtle.js";
import * as saturn from './general/saturn.js';
import * as dgram from './general/virtual_udp.js';
import { Saturn } from './general/consts.js';

const addr = '127.0.0.1'

// use for general testing

saturn.init('192.168.0.101', saturn.Type.hub).then(() => {
    console.log('Hub created');
    saturn.init('192.168.0.11', saturn.Type.service).then(async (service) => {
        console.log((await service.getHub()).addr);
    }).catch(err => {
        console.log(err);
    });
});