import { init as witching_hour } from "./modules/witching-hour.js";
import { init as edge } from "./modules/edge.js";

let module1 = witching_hour(3000, "i can see you");
let module2 = edge(3001, module1.entry_point);

console.log(module1.entry_point);
