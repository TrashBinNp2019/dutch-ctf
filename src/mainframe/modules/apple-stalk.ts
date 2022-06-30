import * as net from 'net';
import { Module } from './base-module.js';

/**
 * Imitation of a FTP server
 */

const version = "1.0.0"

// TODO make this actually useful

/**
 * A client that can access a file system.
 */
class Client {
    auth:string;
    files:{ name:string, content:string }[];

    constructor(auth:string) {
        this.auth = auth;
        this.files = [];
    }

    addFile(name:string, content:string) {
        this.files.push({ name, content });
    }

    getFile(name:string):string {
        let match = this.files.filter(val => { return val.name === name });
        if (match.length === 0) {
            return "";
        }
        return match[0].content;
    }
}

function init(port:number, msg:number):Module {
    let clients = [new Client("admin")];
    clients[0].addFile("index.html", "<h1>Hello World</h1>");
    const server = new net.createServer();

    server.on('connection', (socket) => {
        socket.write(`APPLE STALK v${version}\n`);
        socket.write('AUTH:\n');
        let loggedIn = false;
        let client:Client = undefined;

        socket.on("error", (err:Error) => {
            console.log("err");
        })

        function handler(data) {
            if (!loggedIn) {
                let auth = data.toString('ascii');
                auth = auth.substring(0, auth.length - 1);
                let match = clients.filter(val => { return val.auth === auth });
                if (match.length === 0) {
                    socket.write('INVALID_AUTH\n');
                    socket.write('AUTH:\n');
                    return;
                }
                socket.write('OK\n');
                client = match[0];
                loggedIn = true;
                return;
            }

            let words = data.toString('ascii').match(/[a-z.]+/gi);
            if (!words) return;
            let str:string = words[0].toLowerCase();

            let numbers = data.toString('ascii').match(/\d+/);
            let number = undefined;
            if (numbers) {
                number = Number(numbers[0]);
            } 

            switch (str) {
                case "help":
                    socket.write("Browse your files.\n");
                    socket.write("HELP, GET $name, LIST, EXIT\n");
                    break;
                case "get":
                    if (words.length !== 2) {
                        socket.write("FILE_NOT_FOUND\n");
                        return;
                    }
                    let matches = client.files.filter(val => { return val.name === words[1] });
                    if (matches.length === 0) {
                        socket.write('FILE_NOT_FOUND\n');
                        return;
                    }
                    socket.write(matches[0].content + '\n');
                    break;
                case "list":
                    socket.write(client.files.map(val => { return val.name }).join(', ') + '\n');
                    break;  
                case "exit":
                    socket.end();
            }
        }

        socket.on("data", handler);
    });

    server.listen(port, "127.0.0.1", () => {});

    let module = new Module(port);
    module.trash = server.close;
    module.entry_point = -1;

    return module;
}

export { init };
