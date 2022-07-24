import { init as witching_hour } from "../modules/witching-hour.js";
import { init as apple_stalk } from "../modules/apple-stalk.js";
import { init as eagle } from "../modules/eagle.js";
import { init as wren } from "../modules/wren.js";
// import { Client, clients } from "./clients.js";
import { Entity } from "../../entities/general-entity.js";
import * as saturn from "../../general/saturn.js";
import { Saturn, Silver } from "../../general/consts.js";
import * as silver from '../../general/silver.js';

export function init(addr: string):Promise<Entity> {
    return new Promise<Entity>(async (resolve, reject) => {
        try {
            let module1 = witching_hour(addr, 3000, "success");
            let module2 = eagle(addr, 3001, module1.entry_point);
            let module3 = apple_stalk(addr);
            let module4 = wren(addr, 3003);
            let saturn_socket = await saturn.init(addr, saturn.Type.hub);

            let entity = new Entity(() => {
                module1.trash();
                module2.trash();
                module3.trash();
                module4.trash();
                saturn_socket.close();
            }, () => {
                return [
                    { port: module1.port, usage: 'Withing Hour' }, 
                    { port: module2.port, usage: 'Eagle' }, 
                    { port: module3.port, usage: 'Apple Stalk' }, 
                    { port: module4.port, usage: 'Wren' }, 
                    { port: Saturn.GPORT, usage: 'Saturn: global port' }, 
                    { port: Saturn.CPORT, usage: 'Saturn: control port' }, 
                ]   
            });

            silver.init(addr, saturn_socket);

            resolve(entity);
        } catch(e) {
            reject(e);
        }
    });
}