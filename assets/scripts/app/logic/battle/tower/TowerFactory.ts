// 防御塔工厂类
// 负责防御塔 CSV 配置加载、对象池管理、防御塔实例创建与回收

import { GenericPool } from "../../../../framework/pool/GenericPool";
import { Logger } from "../../../../framework/logger/Logger";
import { TowerBase, TowerConfig, TowerLevelConfig, TowerType } from "./TowerBase";
import { TowerStar } from "./TowerStar";
import { TowerSun } from "./TowerSun";
import { TowerSnow } from "./TowerSnow";
import { TowerRocket } from "./TowerRocket";
import { TowerPlane } from "./TowerPlane";
import { TowerPin } from "./TowerPin";
import { TowerAnchor } from "./TowerAnchor";
import { TowerFireBottle } from "./TowerFireBottle";
import { TowerBlueStar } from "./TowerBlueStar";
import { TowerBall } from "./TowerBall";

const log = new Logger("tower-factory");

/** CSV 防御塔模板数据（由多行按 Name 合并而来） */
export interface TowerTemplate {
    /** 模板 ID（使用第一行的 Id） */
    id: number;
    /** 防御塔名称（CSV Name 列，如 "Bottle", "Fan"） */
    name: string;
    /** 防御塔类型 */
    towerType: TowerType;
    /** 模型资源名 */
    modelName: string;
    /** 每级配置列表 */
    levels: TowerLevelConfig[];
    /** 每级对应的子弹 ID */
    bulletIds: number[];
    /** 每级升级到下一级的费用（最后一级为 0） */
    upgradeCosts: number[];
    /** 底座精灵名称 */
    towerBase: string;
    /** 是否需要旋转 */
    isRotation: boolean;
    /** 建造费用 */
    buildCost: number;
    /** 动画计数 */
    animationCount: number;
}

/** CSV 行原始数据 → 防御塔名称映射（处理 Sun1→Sun, PPlane1→Plane 等变体名） */
const NAME_NORMALIZE_MAP: Record<string, string> = {
    "Sun1": "Sun",
    "Sun2": "Sun",
    "Sun3": "Sun",
    "PPlane1": "Plane",
    "PPlane2": "Plane",
    "PPlane3": "Plane",
};

/** 防御塔名称 → TowerType 枚举映射 */
const NAME_TO_TYPE_MAP: Record<string, TowerType> = {
    "Bottle": TowerType.Bottle,
    "Star": TowerType.Star,
    "Fan": TowerType.Fan,
    "Rocket": TowerType.Rocket,
    "Snow": TowerType.Snow,
    "Pin": TowerType.Pin,
    "Anchor": TowerType.Anchor,
    "Sun": TowerType.Sun,
    "Plane": TowerType.Plane,
    "FBottle": TowerType.FireBottle,
    "BStar": TowerType.BlueStar,
    "Ball": TowerType.Ball,
    "Shit": TowerType.Bottle, // Shit 没有对应枚举，使用 Bottle 作为兜底
};

/** TowerType → TowerBase 子类构造器映射 */
const TOWER_CLASS_MAP: Partial<Record<TowerType, new () => TowerBase>> = {
    [TowerType.Star]: TowerStar,
    [TowerType.Sun]: TowerSun,
    [TowerType.Snow]: TowerSnow,
    [TowerType.Rocket]: TowerRocket,
    [TowerType.Plane]: TowerPlane,
    [TowerType.Pin]: TowerPin,
    [TowerType.Anchor]: TowerAnchor,
    [TowerType.FireBottle]: TowerFireBottle,
    [TowerType.BlueStar]: TowerBlueStar,
    [TowerType.Ball]: TowerBall,
};

export class TowerFactory {
    /** 每种 TowerType 各自的对象池（key 为 TowerType 枚举值） */
    private _pools: Map<TowerType, GenericPool<TowerBase>> = new Map();

    /** 已加载的防御塔模板表（模板 ID → 模板） */
    private _templates: Map<number, TowerTemplate> = new Map();

    /** 配置是否已加载 */
    private _loaded: boolean = false;

    // ==================== 配置加载 ====================

    /**
     * 加载防御塔 CSV 配置数据
     * CSV 中同一 Name 的 3 行代表该塔的 1/2/3 级，此处按 Name 合并
     * @param jsonData Tower.csv 解析后的 JSON 数组
     */
    public loadConfig(jsonData: any[]): void {
        this._templates.clear();

        // 按 Name 分组（先规范化名称）
        const groups: Map<string, any[]> = new Map();

        for (const row of jsonData) {
            const rawName: string = row.Name || '';
            const normalizedName = NAME_NORMALIZE_MAP[rawName] || rawName;
            let group = groups.get(normalizedName);
            if (!group) {
                group = [];
                groups.set(normalizedName, group);
            }
            group.push(row);
        }

        // 为每个分组生成模板
        for (const [name, rows] of groups) {
            // 按 Level 排序
            rows.sort((a, b) => (parseInt(a.Level) || 1) - (parseInt(b.Level) || 1));

            const towerType = NAME_TO_TYPE_MAP[name];
            if (towerType === undefined) {
                log.warn(`unknown tower name: "${name}", skip`);
                continue;
            }

            const firstRow = rows[0];
            const templateId = parseInt(firstRow.Id) || 0;

            const levels: TowerLevelConfig[] = [];
            const bulletIds: number[] = [];
            const upgradeCosts: number[] = [];

            for (const row of rows) {
                levels.push({
                    level: parseInt(row.Level) || 1,
                    attack: parseInt(row.Value) || 0,
                    range: parseInt(row.AttackRange) || 200,
                    attackInterval: parseFloat(row.AttackSpace) || 1.0,
                });

                // 子弹 ID（非数字的如 "0_CN" 视为 0）
                const bulletIdRaw = row.BulletId;
                const bulletId = parseInt(bulletIdRaw);
                bulletIds.push(isNaN(bulletId) ? 0 : bulletId);

                // 升级费用（非数字的如 "0_CN" 视为 0）
                const costRaw = row.UpgradeCost;
                const cost = parseInt(costRaw);
                upgradeCosts.push(isNaN(cost) ? 0 : cost);
            }

            const template: TowerTemplate = {
                id: templateId,
                name,
                towerType,
                modelName: firstRow.ModelName || '',
                levels,
                bulletIds,
                upgradeCosts,
                towerBase: firstRow.TowerBase || '',
                isRotation: parseInt(firstRow.IsRotation) === 1,
                buildCost: parseInt(firstRow.CreateCost) || 100,
                animationCount: parseInt(firstRow.AnimationCount) || 0,
            };

            this._templates.set(template.id, template);
            log.info(`tower template loaded: id=${template.id}, name=${name}, type=${TowerType[towerType]}`);
        }

        this._loaded = true;
        log.info(`tower config loaded, count: ${this._templates.size}`);
    }

    /** 配置是否已加载 */
    public get isLoaded(): boolean {
        return this._loaded;
    }

    /**
     * 根据模板 ID 获取模板数据
     * @param templateId 模板 ID
     */
    public getTemplate(templateId: number): TowerTemplate | undefined {
        return this._templates.get(templateId);
    }

    /**
     * 获取所有模板 ID 列表
     */
    public get allTemplateIds(): number[] {
        return Array.from(this._templates.keys());
    }

    /**
     * 获取指定 TowerType 类型的所有模板
     * @param type 防御塔类型
     */
    public getTemplatesByType(type: TowerType): TowerTemplate[] {
        const result: TowerTemplate[] = [];
        this._templates.forEach((tpl) => {
            if (tpl.towerType === type) {
                result.push(tpl);
            }
        });
        return result;
    }

    // ==================== 创建与回收 ====================

    /**
     * 获取或创建指定 TowerType 的对象池
     */
    private getPool(type: TowerType): GenericPool<TowerBase> {
        let pool = this._pools.get(type);
        if (!pool) {
            const TowerClass = TOWER_CLASS_MAP[type] || TowerBase;
            pool = new GenericPool(TowerClass);
            this._pools.set(type, pool);
        }
        return pool;
    }

    /**
     * 创建一个防御塔实例
     * @param templateId 模板 ID（对应 CSV 中第一个 Level 行的 Id）
     * @param gridX 格子列坐标
     * @param gridY 格子行坐标
     * @returns 防御塔实例，模板不存在时返回 null
     */
    public create(templateId: number, gridX: number, gridY: number): TowerBase | null {
        const template = this._templates.get(templateId);
        if (!template) {
            log.error(`cannot find tower template: ${templateId}`);
            return null;
        }

        const pool = this.getPool(template.towerType);
        const tower = pool.get();

        const config: TowerConfig = {
            towerType: template.towerType,
            levels: template.levels.slice(), // 拷贝一份避免模板被修改
            buildCost: template.buildCost,
            gridX,
            gridY,
        };

        tower.initWithConfig(config);
        return tower;
    }

    /**
     * 回收防御塔到对象池
     * @param tower 要回收的防御塔实例
     */
    public recycle(tower: TowerBase): void {
        if (!tower) return;

        // 断开事件监听（在 recycle 内部已通过 emit('beforeRecycle') 处理）
        tower.recycle();

        const pool = this._pools.get(tower.towerType);
        if (pool) {
            pool.put(tower);
        } else {
            // 如果找不到对应池，直接丢弃
            log.warn(`no pool found for TowerType ${TowerType[tower.towerType]}, tower discarded`);
        }
    }

    /**
     * 清空所有模板数据与对象池
     */
    public clear(): void {
        this._templates.clear();
        this._pools.clear();
        this._loaded = false;
    }
}

/** 全局防御塔工厂单例 */
export const towerFactory = new TowerFactory();
