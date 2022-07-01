import { init as witching_hour } from "../modules/witching-hour.js";
import { init as apple_stalk } from "../modules/apple-stalk.js";
import { init as eagle } from "../modules/eagle.js";
import { Client, clients } from "./clients.js";

export function init() {
    clients.push(new Client());
    // TODO check for client auth uniqueness

    let module1 = witching_hour(3000, "success");
    let module2 = eagle(3001, module1.entry_point);
    let module3 = apple_stalk(3002);
}