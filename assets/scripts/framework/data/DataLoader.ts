import { Logger } from "../logger/Logger";
import { resources, JsonAsset } from "cc";

const log = new Logger("data-list");

export abstract class DataLoader {
    // 资源地址
    protected abstract getResUrl(): string;
    // 资源 json 对象
    protected res: any;
    // 加载数据表格
    public load(callback: (err: Error) => void) {
        resources.load(this.getResUrl(), JsonAsset, (err, jsonAsset) => {
            if (err) {
                callback(err);
                return;
            }
            // Cocos Creator 3.x 中 JsonAsset 的文本内容在 json 属性中
            try {
                this.res = jsonAsset.json;
            } catch (parseErr) {
                callback(parseErr as Error);
                return;
            }
            callback(null);
        });
    }
    // 卸载资源
    public unload() {
        resources.release(this.getResUrl(), JsonAsset);
        this.res = null;
    }

    // 是否已经加载
    public isLoaded(): boolean {
        return (this.res != null);
    }
}

// 单对象数据
export abstract class DataObj<T> extends DataLoader {
    public get(): T {
        return this.res as T;
    }
}

// 列表数据
export abstract class DataList<T> extends DataLoader {
    public getAll(): T[] {
        return this.res as T[];
    }
}
