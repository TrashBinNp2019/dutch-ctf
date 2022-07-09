import { createHash } from 'crypto';  

// Length of apple-stalk auth tokens
export const GLOBAL_AUTH_LENGTH = 6;

/**
 * A client, that can access apple-stalks module.
 */
export class Client {
    // String, used for authentication in various modules. 
    // Should be unique for all clients
    global_auth:string;
    // Files, accessible through apple-stalk modules
    files:{ name:string, content:string }[];

    constructor() {
        this.global_auth = Math.random().toString(16).slice(2, GLOBAL_AUTH_LENGTH + 2);
        // this.global_auth = "4c82cb"; // FOR MANUAL TESTING ONLY, comment this when done!
        this.files = [];
        this.addFile("flag.txt", Math.random().toString(16).slice(2, 16 + 2));
        this.addFile("index.html", '<h1>Hello world :)</h1>');

        if (process.env.NODE_ENV !== 'test') { console.log(`Client ${this.global_auth} created.`) };
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

let clients:Client[] = [];

export function addClient() {
    clients.push(new Client());
}

if (process.env.NODE_ENV === 'test') { 
    addClient(); 
    clients[0].addFile("index.html", "<h1>Hello World</h1>");
};

export { clients };
