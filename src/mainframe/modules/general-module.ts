/**
 * Template for a module, containing data, port, entry point for users and a destructor.
 */
export class Module {
    trash: () => void;
    entry_point: number;
    port: number;
    server: any;

    constructor(port: number) {
        this.port = port;
    }
}