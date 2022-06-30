import { init as witching_hour } from "./modules/witching-hour.js";
import { init as apple_stalk } from "./modules/apple-stalk.js";
import { init as eagle } from "./modules/eagle.js";

let module1 = witching_hour(3000, "i can see you");
let module2 = eagle(3001, module1.entry_point);
let module3 = apple_stalk(3002, module1.entry_point);
