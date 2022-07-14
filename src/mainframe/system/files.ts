import * as crypto from 'node:crypto';

export class File {
    name: string;
    content: string;
    hash: string;

    constructor(name: string, content: string) {
        this.name = name;
        this.content = content;
        this.hash = crypto.createHash('md5').update(content).digest('hex');
    }
}

let files: File[] = [];
addFile('index.html', '<h1>Hello World</h1>');

export function addFile(name: string, content: string) {
    files.push(new File(name, content));
}

export function getFileByName(name: string): File | undefined {
    return files.find(val => { return val.name === name });
}

export function getFileByHash(hash: string): File | undefined {
    return files.find(val => { return val.hash === hash });
}