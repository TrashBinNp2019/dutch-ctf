import * as net from 'net';
import { Module } from './base-module.js';

const version = "1.0.0"
const PORTRE = /^([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/gi;

class Client {
    address:string;
    port:number;
    socket:net.Socket;
    val:number;
    up:boolean;

    constructor(address:string, port:number, val:number) {
        if (!net.isIPv4(address)) throw new Error("Invalid IP address");
        if (!PORTRE.test(port.toString())) throw new Error("Invalid port");

        this.address = address;
        this.port = port;
        this.val = val;
        this.up = false;
    }

    connect():boolean {
        this.socket = new net.Socket();
        this.socket.connect(this.port, this.address);
        this.socket.on("error", (err:Error) => {
            console.log("err");
            this.up = false;
            return false
        });
        this.socket.on("connect", () => {
            console.log("connected");
            this.up = true;
            setInterval(() => {
                this.socket.write(String(Math.random() < 0.95 ? Math.floor( Math.random() * this.val*2): this.val) + "\n");
            }, 100);
        });
        return true;
    }
}

function init(port:number, msg:number):Module {
    let clients = [];
    const server = new net.createServer();

    server.on('connection', (socket) => {
        socket.write(`EDGE v ${version}\n`);

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
                        break;
                    }
                    clients.push(new Client(socket.remoteAddress, number, msg));
                    if (!clients[clients.length - 1].connect()) {
                        clients.pop();
                        socket.write("Failed to connect\n");
                        break;
                    }
                    socket.write("Success\n");
                    break;
                case "list":
                    clients.filter(element => { return element.up; });
                    let list = clients.map((val) => {
                        return `${val.address}:${val.port}`;
                    }).join("\n");
                    socket.write(`${list}\n`);
                    break;  
                case "exit":
                    socket.end();
            }
        });
    });

    server.listen(port, "127.0.0.1", () => {});

    let module = new Module(port);
    module.trash = server.close;
    module.entry_point = -1;

    return module;
}

export { init };
