// 障碍物工厂
// 负责障碍物 CSV 配置加载、对象池管理、障碍物实例创建与回收

import { GenericPool } from "../../../../framework/pool/GenericPool";
import { Logger } from "../../../../framework/logger/Logger";
import { BarrierBase, BarrierConfig, BarrierType } from "./BarrierBase";

const log = new Logger("barrier-factory");

/** CSV 障碍物模板数据（对应 Barrier.csv 字段） */
export interface BarrierTemplate {
    /** 模板 ID */
    id: number;
    /** 障碍物名称 */
    name: string;
    /** 模型资源名（prefab 名称） */
    modelName: string;
    /** 摧毁后奖励的金币 */
    value: number;
    /** 动画计数 */
    animationCount: number;
    /** 解锁所需关卡等级 */
    level: number;
    /** 最大血量 */
    hp: number;
}

export class BarrierFactory {
    /** 障碍物对象池 */
    private _pool: GenericPool<BarrierBase> = new GenericPool(BarrierBase);

    /** 已加载的障碍物模板表（id → 模板） */
    private _templates: Map<number, BarrierTemplate> = new Map();

    /** 配置是否已加载 */
    private _loaded: boolean = false;

    // ==================== 配置加载 ====================

    /**
     * 加载障碍物 CSV 配置数据
     * @param jsonData Barrier.csv 解析后的 JSON 数组
     */
    public loadConfig(jsonData: any[]): void {
        this._templates.clear();

        for (const row of jsonData) {
            const template: BarrierTemplate = {
                id: parseInt(row.Id) || 0,
                name: row.Name || '',
                modelName: row.ModelName || '',
                value: parseInt(row.Value) || 0,
                animationCount: parseInt(row.AnimationCount) || 0,
                level: parseInt(row.Level) || 1,
                hp: parseInt(row.Hp) || 100,
            };
            this._templates.set(template.id, template);
        }

        this._loaded = true;
        log.info(`barrier config loaded, count: ${this._templates.size}`);
    }

    /** 配置是否已加载 */
    public get isLoaded(): boolean {
        return this._loaded;
    }

    /**
     * 根据模板 ID 获取模板数据
     * @param templateId 模板 ID
     */
    public getTemplate(templateId: number): BarrierTemplate | undefined {
        return this._templates.get(templateId);
    }

    /**
     * 获取所有模板 ID 列表
     */
    public get allTemplateIds(): number[] {
        return Array.from(this._templates.keys());
    }

    /**
     * 随机获取一个符合等级条件的模板
     * @param maxLevel 最大等级限制
     */
    public getRandomTemplate(maxLevel?: number): BarrierTemplate | undefined {
        const candidates: BarrierTemplate[] = [];
        this._templates.forEach((tpl) => {
            if (maxLevel === undefined || tpl.level <= maxLevel) {
                candidates.push(tpl);
            }
        });

        if (candidates.length === 0) return undefined;
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    // ==================== 创建与回收 ====================

    /**
     * 创建一个障碍物实例
     * @param templateId 模板 ID（对应 CSV 中的 Id）
     * @param gridX 格子列坐标
     * @param gridY 格子行坐标
     * @param type 障碍物类型
     * @param size 占据格子数
     * @param destructible 是否可被摧毁
     * @returns 障碍物实例，模板不存在时返回 null
     */
    public create(
        templateId: number,
        gridX: number,
        gridY: number,
        type: BarrierType = BarrierType.Normal,
        size: number = 1,
        destructible: boolean = true,
    ): BarrierBase | null {
        const template = this._templates.get(templateId);
        if (!template) {
            log.error(`cannot find barrier template: ${templateId}`);
            return null;
        }

        const barrier = this._pool.get();

        const config: BarrierConfig = {
            type,
            maxHp: template.hp,
            gridX,
            gridY,
            size,
            destructible,
        };

        barrier.initWithConfig(config);
        return barrier;
    }

    /**
     * 回收障碍物到对象池
     * @param barrier 要回收的障碍物实例
     */
    public recycle(barrier: BarrierBase): void {
        if (!barrier) return;
        barrier.recycle();
        this._pool.put(barrier);
    }

    /**
     * 清空所有模板数据
     */
    public clear(): void {
        this._templates.clear();
        this._loaded = false;
    }
}
