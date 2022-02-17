import { setTimeout } from 'timers/promises';
import { toStream } from './index';

async function main() {
    const promises = Array.from({ length: 10 }, () => {
        const delay = Math.floor(Math.random() * 1000);
        return setTimeout(delay, delay);
    });

    for await (const val of toStream(promises)) {
        console.log(val);
    }
}

main();