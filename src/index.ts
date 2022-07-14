import { init as system_init } from "./mainframe/system/index.js";
import { spawn as myrtle } from "./entities/myrtle.js";

const addr = '127.0.0.1'

// use for general testing
system_init(addr);
myrtle(addr, 3002, 1337);
