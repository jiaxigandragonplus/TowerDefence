// 通用对象池
export class GenericPool<T> {
    private pool: T[];
    private Class: Resettable<T>;

    constructor(Class: Resettable<T>) {
        this.pool = [];
        this.Class = Class;
    }

    get(): T {
        if (this.pool.length) {
            return this.pool.splice(0, 1)[0];
        }
        return new this.Class();
    }

    put(obj: T): void {
        if (this.Class.reset) {
            this.Class.reset(obj);
        }
        if (this.pool.indexOf(obj) >= 0) {
            return;
        }
        this.pool.push(obj);
    }
}

interface Resettable<T extends Object> {
    // constructor
    new(): T;
    // static
    reset?(obj: T): void;
}