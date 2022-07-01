import * as net from 'net';
import { Module } from './base-module.js';

const version = "1.0.0"
var keyGenerator = () => { return Math.floor(Math.random() * 1048576) };

/**
 * Class, utilized by the shred() function.
 * Represents a node in a message chain.
*/
class MsgBit {
    msg:string;
    key:number;
    next:number;

    constructor (msg:string, key:number){
        this.msg = msg;
        this.key = key;
    };

    generate() {
        this.next = keyGenerator();
    };
}

/**
 * Shreds a message into a chain:
 *
 * entry_point     key1        key2       key?       -1
 *     --->  bit1  --->  bit2  --->  ...  --->  end
 * 
 * @param msg {string} Message to shred
 * @returns {MsgBit[]} Resulting array
 */
function shred(msg:string):MsgBit[] {
    let arr:MsgBit[] = [];
    let split = msg.match(/.{1,2}/g);

    let key = keyGenerator();
    split.forEach(bit => {
        let msgbit = new MsgBit(bit, key);
        do {
            msgbit.generate();
        } while (arr.filter(val => { return val.key === msgbit.key }).length !== 0);
        
        arr = [...arr, msgbit];
        key = msgbit.next;
    });

    arr[arr.length - 1].next = -1;
    return arr;
}

function init(port:number, msg:string):Module {
    const server = net.createServer();
    let msgArr = shred(msg);

    let last_req:number = undefined;

    server.on('connection', (socket) => {
        socket.write(`WITCHING_HOUR v${version}\n`);

        socket.on("error", (err:Error) => {
            console.log("err");
        })

        socket.on("data", (data) => {
            let words = data.toString('ascii').match(/^[a-zA-Z]+/);
            if (!words) return;
            let str:string = words[0].toLowerCase();

            let numbers = data.toString('ascii').match(/\d+/);
            let number = undefined;
            if (numbers) {
                number = Number(numbers[0]);
            } 

            switch (str) {
                case "help":
                    socket.write("You may enter, once you have the key.\n");
                    socket.write("HELP, GET $key, STATUS, EXIT\n");
                    break;
                case "get":
                    let bits:MsgBit[] = [];
                    if (number !== undefined) {
                        msgArr.filter((val) => {return val.key === number});
                        last_req = number;
                    }
                    
                    if (bits.length != 1) {
                        socket.write('Invalid key\n');
                        return;
                    }
                    socket.write(JSON.stringify({msg: bits[0].msg, next_key: bits[0].next}) + '\n');
                    break;
                case "status":
                    let res = {total: msgArr.length, last_requested: last_req };
                    socket.write(JSON.stringify(res)+'\n');
                    break;  
                case "exit":
                    socket.end();
            }
        });
    });

    server.listen(port, "127.0.0.1", () => {
    });

    let module = new Module(port);
    module.trash = () => { server.close() };
    module.entry_point = msgArr[0].key;

    return module;
}

export { init };
