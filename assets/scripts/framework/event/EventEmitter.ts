export class EventEmitter {
    private events = {};
    private readonly defaultTag = "defaultTag";

    // 一个函数经过两次bind后是不相等的，即使bind的参数一样，
    // tag参数就是为了方便消除订阅一个bind后的linstener函数。
    on(event: string, tag?: any, fn?: any) {
        this.addEventListener(event, tag, fn);
    }

    addEventListener(event: string, tag?: any, fn?: any) {
        if (typeof tag === "function") {
            fn = tag;
            tag = this.defaultTag;
        }
        this.events[event] = this.events[event] || {};
        this.events[event][tag] = this.events[event][tag] || [];
        // 防止相同函数重复添加
        if (fn && this.events[event][tag].indexOf(fn) < 0) {
            this.events[event][tag].push(fn);
        }
        return this;
    };

    once(event: string, fn: any) {
        var self = this;
        function callback() {
            self.off(event, callback);
            fn.apply(this, arguments);
        }

        this.on(event, callback);
        return this;
    };

    off(event: string, tag?: any, fn?: any) {
        this.removeEventListener(event, tag, fn);
    }

    removeListener(event: string, tag?: any, fn?: any) {
        this.removeEventListener(event, tag, fn);
    }

    removeAllListeners() {
        this.removeEventListener();
    }

    removeEventListener(event?: string, tag?: any, fn?: any) {
        if (event == null && tag == null && fn == null) {
            this.events = {};
            return this;
        }

        // remove all handlers of event
        if (event != null && tag == null && fn == null) {
            delete this.events[event];
            return this;
        }

        // specific event
        const tags = this.events[event];
        if (!tags) {
            return this;
        }

        // remove all handlers of tag
        if (typeof tag === "string" && fn == null) {
            delete tags[tag];
            return this;
        }

        // remove specific handlers
        if (typeof tag === "function") {
            fn = tag;
            tag = this.defaultTag;
        }

        for (let tagProperty in tags) {
            if (tagProperty === tag) {
                const fns = tags[tag];
                for (let i = 0; i < fns.length; ++i) {
                    if (fns[i] === fn) {
                        fns.splice(i, 1);
                        break;
                    }
                }
                break;
            }
        }
        return this;
    }

    emit(event: string, ...args) {
        let tags = this.events[event];
        if (tags) {
            for (let tag in tags) {
                const fns = tags[tag];
                fns.forEach(fn => {
                    fn.apply(this, args);
                });
            }
        }
        return this;
    }

    listeners(event) {
        const tags = this.events[event] || {};
        let handlers = [];
        for (let tag in tags) {
            handlers = handlers.concat(tags[tag]);
        }
        return handlers;
    }

    hasListeners(event: string): boolean {
        return (this.listeners(event).length > 0);
    }
}