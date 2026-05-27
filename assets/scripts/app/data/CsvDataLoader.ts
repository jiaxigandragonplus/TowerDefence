import { resources, TextAsset } from "cc";
import { Logger } from "../../framework/logger/Logger";

const log = new Logger("CsvDataLoader");

/**
 * CSV 数据加载基类
 * 用于加载 resources 目录下的 .csv 文本资源，并解析为类型化对象数组
 */
export abstract class CsvDataLoader<T> {
    /** 已解析的数据列表 */
    protected dataList: T[] = [];
    /** 资源是否已加载 */
    protected loaded: boolean = false;

    /**
     * 子类实现：返回 CSV 资源路径（相对于 resources 目录，不含扩展名）
     * 例如："csv/Tower"
     */
    protected abstract getResUrl(): string;

    /**
     * 子类实现：将 CSV 的一行原始数据（key-value 对象）映射为类型 T
     * @param row CSV 行数据，key 为表头字段名，value 为原始字符串
     */
    protected abstract mapRow(row: Record<string, string>): T;

    /**
     * 加载并解析 CSV 文件
     */
    public async load(): Promise<void> {
        return new Promise((resolve, reject) => {
            const url = this.getResUrl();
            resources.load(url, TextAsset, (err, textAsset) => {
                if (err) {
                    log.error(`加载 CSV 失败: ${url}`, err);
                    reject(err);
                    return;
                }
                try {
                    this.dataList = this.parseCsv(textAsset.text);
                    this.loaded = true;
                    log.info(`CSV 加载成功: ${url}, 共 ${this.dataList.length} 条记录`);
                    resolve();
                } catch (parseErr) {
                    log.error(`CSV 解析失败: ${url}`, parseErr);
                    reject(parseErr);
                }
            });
        });
    }

    /**
     * 卸载资源
     */
    public unload(): void {
        resources.release(this.getResUrl(), TextAsset);
        this.dataList = [];
        this.loaded = false;
    }

    /**
     * 是否已加载
     */
    public isLoaded(): boolean {
        return this.loaded;
    }

    /**
     * 获取所有配置数据
     */
    public getAll(): T[] {
        return this.dataList;
    }

    /**
     * 根据 ID 查找单条配置
     */
    public getById(id: number): T | undefined {
        return (this.dataList as any[]).find(item => item.Id === id);
    }

    /**
     * 根据自定义条件查找
     */
    public find(predicate: (item: T) => boolean): T | undefined {
        return this.dataList.find(predicate);
    }

    /**
     * 根据自定义条件过滤
     */
    public filter(predicate: (item: T) => boolean): T[] {
        return this.dataList.filter(predicate);
    }

    /**
     * 解析 CSV 文本为对象数组
     * 第一行为表头，后续每行为数据行，空行自动跳过
     */
    private parseCsv(text: string): T[] {
        // 按换行符分割，兼容 Windows(\r\n) 和 Unix(\n)
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
            log.warn("CSV 文件为空或只有表头");
            return [];
        }

        // 解析表头
        const headers = this.parseCsvLine(lines[0]);

        // 解析数据行
        const result: T[] = [];
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCsvLine(lines[i]);
            if (values.length === 0) continue; // 跳过空行

            const row: Record<string, string> = {};
            for (let j = 0; j < headers.length; j++) {
                row[headers[j]] = values[j] !== undefined ? values[j] : "";
            }
            result.push(this.mapRow(row));
        }

        return result;
    }

    /**
     * 解析 CSV 的一行（处理引号包裹的字段）
     */
    private parseCsvLine(line: string): string[] {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (inQuotes) {
                if (char === '"') {
                    if (i + 1 < line.length && line[i + 1] === '"') {
                        // 转义的引号
                        current += '"';
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    current += char;
                }
            } else {
                if (char === '"') {
                    inQuotes = true;
                } else if (char === ",") {
                    result.push(current.trim());
                    current = "";
                } else {
                    current += char;
                }
            }
        }
        // 最后一个字段
        result.push(current.trim());
        return result;
    }
}
