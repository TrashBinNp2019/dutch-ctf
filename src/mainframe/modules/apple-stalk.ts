import * as net from 'net';
import { Module } from './general-module.js';
import { AppleStalk } from '../../general/consts.js';
import * as db from '../system/clients.js';
import * as fs from '../system/files.js';

/**
 * Imitation of a FTP server
 * Intentionally hackable via brute-force or any other method of obtaining valid auth tokens
 */

/**
 * Client-side asynchronous instrument for connecting.
 * @param addr IP address of the server
 * @param auth Auth token
 * @returns Promise that resolves to a socket when the connection is established
 */
export function connect(addr:string, auth:string): Promise<net.Socket> {
    return new Promise<net.Socket>((resolve, reject) => {
        try {
            let hub_socket = new net.Socket();
            hub_socket.on("data", (data) => {
                if (data.toString('ascii').includes("INVALID_AUTH")) {
                    reject("Invalid auth");
                } else if (data.toString('ascii').includes("AUTH:")) {
                    hub_socket.write(auth + "\n");
                } else if (data.toString('ascii').includes("OK")) {
                    resolve(hub_socket);
                } else {
                    reject("Unknown format");
                }
            });
            hub_socket.on('error', (err:Error) => {
                reject(err.message);
            });
            hub_socket.connect(AppleStalk.PORT, addr);
        } catch(e) {
            reject("Apple Stalk is inaccessible: " + e);
        }
    });
}

function init(addr:string):Module {
    const server = net.createServer();

    server.on('connection', (socket) => {
        socket.write(`APPLE STALK v${AppleStalk.VERSION}\n`);
        socket.write('AUTH:\n');
        let loggedIn = false;
        let client:db.Client = undefined;

        socket.on("error", (err:Error) => {
            console.log("err");
        })

        function handler(data: Buffer) {
            if (!loggedIn) {
                let auth = data.toString('ascii');
                auth = auth.substring(0, auth.length - 1);
                let match = db.clients.filter(val => { return val.global_auth === auth });
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

            let args = data.toString('ascii').split(' ').map(val => { return val.replace('\n', '') });

            switch (str) {
                case "help":
                    socket.write("Browse your files. Upload is forbidden. Clone hidden files from the server by their MD5 hash.\n");
                    socket.write("HELP, CAT $name, CLONE $hash, LIST, EXIT\n");
                    break;
                case "cat":
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
                case "hash":
                    try {
                        let file = fs.getFileByHash(args[1]);
                        client.addFile(file);
                        socket.write(`CLONED ${file.name}\n`);
                    } catch (err) {
                        socket.write("FILE_NOT_FOUND\n");
                    }
                    return;
                case "list":
                    socket.write(client.files.map(val => { return val.name }).join(', ') + '\n');
                    break;  
                case "exit":
                    socket.end();
            }
        }

        socket.on("data", handler);
    });

    server.listen(AppleStalk.PORT, addr, () => {});

    let module = new Module(AppleStalk.PORT);
    module.trash = () => { server.close() };
    module.entry_point = -1;

    return module;
}

export { init };
