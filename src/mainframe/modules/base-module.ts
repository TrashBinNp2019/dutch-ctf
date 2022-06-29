export class Module {
    trash: () => void;
    entry_point: number;
    port: number;

    constructor(port: number) {
        this.port = port;
    }
}