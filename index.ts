import EventEmitter, { once } from "events";

export type FalliblePromiseResult<T> =
    { error: false, value: T } |
    { error: true, value: any};

/**
 * A queue on which the dequeue operation returns a promise which does not resolve until there is an element to dequeue.
 */
class YieldQueue<T> {
    private readonly queue: T[] = [];

    private emitter: EventEmitter = new EventEmitter();

    enqueue(el: T): number {
        const size = this.queue.unshift(el);
        this.emitter.emit("enqueue");
        return size;
    }

    async dequeue(): Promise<T> {
        const el = this.queue.pop();
        if (el) {
            return el;
        }

        await once(this.emitter, 'enqueue');
        return this.queue.pop()!;
    }


}

export async function * toStream<T>(promises: Promise<T>[]): AsyncIterable<FalliblePromiseResult<T>> {
    const yieldQueue = new YieldQueue<FalliblePromiseResult<T>>();
    let pendingPromisesCount = promises.length;

    for (const promise of promises) {
        promise.then(
            (val) => yieldQueue.enqueue({ error: false, value: val }),
            (err) => yieldQueue.enqueue({ error: true, value: err}),
        )
    }
    
    while (pendingPromisesCount > 0) {
        const result = await yieldQueue.dequeue();
        pendingPromisesCount -= 1;
        yield result;
    }
}
