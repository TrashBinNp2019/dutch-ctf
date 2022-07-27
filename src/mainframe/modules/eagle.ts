import * as net from 'net';
import { Module } from './general-module.js';
import { Eagle } from '../../general/consts.js';

/**
 * Broadcasting module, which sends a predefined message to all subscribers
 */

const PORTRE = /^([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/gi;

/**
 * Describes a client, who receives data from the module. 
 * Containes the message to be sent, the address and port of the client as well as the socket, used for communication.
*/
class Subscriber {
    address:string;
    port:number;
    socket:net.Socket;
    val:number;

    constructor(address:string, port:number, val:number) {
        if (!net.isIPv4(address)) throw new Error("Invalid IP address");
        if (!PORTRE.test(port.toString())) throw new Error("Invalid port");

        this.address = address;
        this.port = port;
        this.val = val;
    }

    /**
     * Attempts to establish a connection to the client.
     * @returns {boolean} True if connection was a success, false otherwise. 
     */
    connect():boolean {
        this.socket = new net.Socket();
        this.socket.connect(this.port, this.address);
        this.socket.on("error", (err:Error) => {
            return false
        });
        this.socket.on("connect", () => {
            setTimeout(() => {
            setInterval(() => {
                this.socket.write(String(Math.random() < 0.95 ? Math.floor( Math.random() * this.val*2): this.val) + "\n");
            }, 100);
            }, 0.5 * 60 * 1000);
        });
        return true;
    }
}

function init(addr:string, msg:number):Module {
    let subscribers = [];
    const server = net.createServer();

    server.on('connection', (socket) => {
        socket.write(`EAGLE v${Eagle.VERSION}\n`);

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
                    socket.write("Provide a listener to start receiving data, some of whitch may turn out useful.\n");
                    socket.write("HELP, ADD $port, LIST, EXIT\n");
                    break;
                case "add":
                    if (!number) {
                        socket.write("Invalid port\n");
                        return;
                    }
                    try {
                    subscribers.push(new Subscriber(socket.remoteAddress, number, msg));
                    } catch (err) {
                        socket.write("Error: %d\n", err);
                        return;
                    }
                    if (!subscribers[subscribers.length - 1].connect()) {
                        subscribers.pop();
                        socket.write("Failed to connect\n");
                        return;
                    }
                    socket.write("Success\n");
                    break;
                case "list":
                    // TODO check for actually alive connections
                    let list = subscribers.map((val) => {
                        return `${val.address}:${val.port}`;
                    }).join("\n");
                    socket.write(`${list}\n`);
                    break;  
                case "exit":
                    socket.end();
            }
        });
    });

    server.listen(Eagle.PORT, addr, () => {});

    let module = new Module(Eagle.PORT);
    module.trash = () => { server.close() };
    module.entry_point = -1;

    return module;
}

export { init };
