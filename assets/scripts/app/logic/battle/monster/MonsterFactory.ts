// 怪物工厂
// 负责怪物 CSV 配置加载、对象池管理、怪物实例创建与回收

import { GenericPool } from "../../../../framework/pool/GenericPool";
import { Logger } from "../../../../framework/logger/Logger";
import { MonsterBase, MonsterConfig, MonsterType } from "./MonsterBase";

const log = new Logger("monster-factory");

/** CSV 怪物模板数据（对应 Monster.csv 字段） */
export interface MonsterTemplate {
    /** 模板 ID */
    id: number;
    /** 怪物名称 */
    name: string;
    /** 怪物类型（0=陆行, 1=飞行, 2=Boss） */
    monsterType: MonsterType;
    /** 模型资源名（prefab 名称） */
    modelName: string;
    /** 最大血量 */
    hp: number;
    /** 移动速度（像素/秒） */
    speed: number;
    /** 护甲值 */
    armor: number;
    /** 消灭后奖励的金币 */
    rewardGold: number;
    /** 到达终点造成的生活消耗 */
    lifeCost: number;
    /** 解锁所需关卡 */
    level: number;
}

export class MonsterFactory {
    /** 怪物对象池 */
    private _pool: GenericPool<MonsterBase> = new GenericPool(MonsterBase);

    /** 已加载的怪物模板表（id → 模板） */
    private _templates: Map<number, MonsterTemplate> = new Map();

    /** 配置是否已加载 */
    private _loaded: boolean = false;

    // ==================== 配置加载 ====================

    /**
     * 加载怪物 CSV 配置数据
     * @param jsonData Monster.csv 解析后的 JSON 数组
     */
    public loadConfig(jsonData: any[]): void {
        this._templates.clear();

        for (const row of jsonData) {
            const template: MonsterTemplate = {
                id: parseInt(row.Id) || 0,
                name: row.Name || '',
                monsterType: parseInt(row.MonsterType) || MonsterType.Land,
                modelName: row.ModelName || '',
                hp: parseInt(row.Hp) || 100,
                speed: parseInt(row.Speed) || 100,
                armor: parseInt(row.Armor) || 0,
                rewardGold: parseInt(row.RewardGold) || 10,
                lifeCost: parseInt(row.LifeCost) || 1,
                level: parseInt(row.Level) || 1,
            };
            this._templates.set(template.id, template);
        }

        this._loaded = true;
        log.info(`monster config loaded, count: ${this._templates.size}`);
    }

    /** 配置是否已加载 */
    public get isLoaded(): boolean {
        return this._loaded;
    }

    /**
     * 根据模板 ID 获取模板数据
     * @param templateId 模板 ID
     */
    public getTemplate(templateId: number): MonsterTemplate | undefined {
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
    public getRandomTemplate(maxLevel?: number): MonsterTemplate | undefined {
        const candidates: MonsterTemplate[] = [];
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
     * 创建一个怪物实例
     * @param templateId 模板 ID（对应 CSV 中的 Id）
     * @returns 怪物实例，模板不存在时返回 null
     */
    public create(templateId: number): MonsterBase | null {
        const template = this._templates.get(templateId);
        if (!template) {
            log.error(`cannot find monster template: ${templateId}`);
            return null;
        }

        const monster = this._pool.get();

        const config: MonsterConfig = {
            monsterType: template.monsterType,
            maxHp: template.hp,
            speed: template.speed,
            armor: template.armor,
            rewardGold: template.rewardGold,
            lifeCost: template.lifeCost,
        };

        monster.initWithConfig(config);
        return monster;
    }

    /**
     * 回收怪物到对象池
     * @param monster 要回收的怪物实例
     */
    public recycle(monster: MonsterBase): void {
        if (!monster) return;
        monster.recycle();
        this._pool.put(monster);
    }

    /**
     * 清空所有模板数据
     */
    public clear(): void {
        this._templates.clear();
        this._loaded = false;
    }
}
