import { init as witching_hour } from "../modules/witching-hour.js";
import { init as apple_stalk } from "../modules/apple-stalk.js";
import { init as eagle } from "../modules/eagle.js";
import { init as wren } from "../modules/wren.js";
import { Entity } from "../../entities/general-entity.js";
import * as saturn from "../../general/saturn.js";
import * as CONST from "../../general/consts.js";
import * as silver from '../../general/silver.js';

export function init(addr: string):Promise<Entity> {
    return new Promise<Entity>(async (resolve, reject) => {
        try {
            let module1 = witching_hour(addr, "success");
            let module2 = eagle(addr, module1.entry_point);
            let module3 = apple_stalk(addr);
            let module4 = wren(addr);
            let saturn_socket = await saturn.init(addr, saturn.Type.hub);

            let entity = new Entity(() => {
                module1.trash();
                module2.trash();
                module3.trash();
                module4.trash();
                saturn_socket.close();
            }, () => {
                return [
                    { port: module1.port, usage: 'Withing Hour', version: CONST.WitchingHour.VERSION  }, 
                    { port: module2.port, usage: 'Eagle', version: CONST.Eagle.VERSION }, 
                    { port: module3.port, usage: 'Apple Stalk', version: CONST.AppleStalk.VERSION }, 
                    { port: module4.port, usage: 'Wren', version: CONST.Wren.VERSION }, 
                    { port: CONST.Saturn.GPORT, usage: 'Saturn: global port', version: CONST.Saturn.VERSION }, 
                    { port: CONST.Saturn.CPORT, usage: 'Saturn: control port', version: CONST.Saturn.VERSION }, 
                ]   
            });

            silver.init(addr, saturn_socket, entity);

            resolve(entity);
        } catch(e) {
            reject(e);
        }
    });
}