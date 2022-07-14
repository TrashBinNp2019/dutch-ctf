const names = ['John', 'Jane', 'Joe', 'Betty'];

// shuffles the names array
for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [names[i], names[j]] = [names[j], names[i]];
}

function* generator(i: number) {
    while (i < names.length) {
        yield names[i];
        i++;
    }
    console.log('Warning: names generator exhausted');
    return 'Anonymous';
}
const name_generator = generator(0);

export class Entity {
    kill: () => void;
    ports: () => { port:number, usage:string }[];
    name: string;

    constructor(kill: () => void, ports: () => { port:number, usage:string }[]) {
        this.kill = kill;
        this.ports = ports;

        let curr = name_generator.next();
        this.name = curr.value;
    }
}