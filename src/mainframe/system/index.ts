import { init as witching_hour } from "../modules/witching-hour.js";
import { init as apple_stalk } from "../modules/apple-stalk.js";
import { init as eagle } from "../modules/eagle.js";
import { init as wren } from "../modules/wren.js";
import { Client, clients } from "./clients.js";

export function init(addr: string) {
    clients.push(new Client());

    let module1 = witching_hour(addr, 3000, "success");
    let module2 = eagle(addr, 3001, module1.entry_point);
    let module3 = apple_stalk(addr, 3002);
    let module4 = wren(addr, 3003);
}