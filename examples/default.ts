/**
 * Shows off all the modules, building an interconnected chain on 127.0.0.1:3000-3002.
 * Usage: 'ts-node-esm examples/default.ts' or 'npm run example'
 */

import { init as witching_hour } from "../src/mainframe/modules/witching-hour.js";
import { init as apple_stalk } from "../src/mainframe/modules/apple-stalk.js";
import { init as eagle } from "../src/mainframe/modules/eagle.js";
import * as saturn from "../src/general/saturn.js";
import { Client, clients } from "../src/mainframe/system/clients.js";


clients.push(new Client());
let addr = '127.0.0.1';

let module1 = witching_hour(addr, 3000, "success");
let module2 = eagle(addr, 3001, module1.entry_point);
let module3 = apple_stalk(addr);
let saturn_socket = saturn.init(addr, saturn.Type.hub);
