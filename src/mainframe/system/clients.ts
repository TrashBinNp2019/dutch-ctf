import { File } from './files.js';

// Length of apple-stalk auth tokens
export const GLOBAL_AUTH_LENGTH = 6;

/**
 * A client, that can access apple-stalks module.
 */
export class Client {
    // String, used for authentication in various modules. 
    // Should be unique for all clients
    global_auth:string;
    // Files, accessible through apple-stalk module
    files:File[];

    constructor() {
        this.global_auth = Math.random().toString(16).slice(2, GLOBAL_AUTH_LENGTH + 2);
        // this.global_auth = "4c82cb"; // FOR MANUAL TESTING ONLY, comment this when done!
        this.files = [];
        this.addFileByContents("flag.txt", Math.random().toString(16).slice(2, 16 + 2));

        if (process.env.NODE_ENV !== 'test') { console.log(`Client ${this.global_auth} created.`) };
    }

    addFileByContents(name:string, content:string) {
        this.files.push(new File( name, content ));
    }

    addFile(file:File | undefined) {
        if (file === undefined) {
            throw new Error("File is undefined");
        } 
        this.files.push(file);
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

export function addClient(): string {
    let client = new Client();
    clients.push(client);
    return client.global_auth;
}

if (process.env.NODE_ENV === 'test') { 
    addClient(); 
    clients[0].addFileByContents("index.html", "<h1>Hello World</h1>");
};

export { clients };
