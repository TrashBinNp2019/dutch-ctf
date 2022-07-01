import { createHash } from 'crypto';  

// Length of apple-stalk auth tokens
const APPLE_STALK_AUTH_LENHGTH = 6;

/**
 * A client, that can access apple-stalks module.
 */
export class Client {
    // String, used for authentication in apple-stalk module. 
    // Should be unique for all clients
    apple_stalk_auth:string;
    // Files, accessible through apple-stalk modules
    files:{ name:string, content:string }[];

    constructor() {
        this.apple_stalk_auth = Math.random().toString(16).slice(2, APPLE_STALK_AUTH_LENHGTH + 2);
        this.files = [];

        if (process.env.NODE_ENv !== 'test') { console.log(`Client ${this.apple_stalk_auth} created.`) };
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

export { clients };
