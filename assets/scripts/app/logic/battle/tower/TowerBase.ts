// 防御塔基类
// 建造在地图上的防御单位，自动攻击范围内的敌人

import { Vec3 } from 'cc';
import { Entity } from "../Entity";
import { MonsterBase } from "../monster/MonsterBase";

/** 防御塔类型枚举 */
export enum TowerType {
    /** 瓶子塔（单体攻击） */
    Bottle = 0,
    /** 星星塔（范围攻击） */
    Star = 1,
    /** 风扇塔（直线/减速） */
    Fan = 2,
    /** 火箭塔（穿透/爆炸） */
    Rocket = 3,
    /** 雪花塔（减速） */
    Snow = 4,
    /** 毒针塔（持续伤害） */
    Pin = 5,
    /** 船锚塔（高伤害） */
    Anchor = 6,
    /** 太阳花（生产金币） */
    Sun = 7,
    /** 飞机塔（追踪） */
    Plane = 8,
    /** 火瓶塔（高伤害） */
    FireBottle = 9,
    /** 蓝星塔 */
    BlueStar = 10,
    /** 球塔 */
    Ball = 11,
}

/** 防御塔等级配置 */
export interface TowerLevelConfig {
    /** 等级 */
    level: number;
    /** 攻击力 */
    attack: number;
    /** 攻击范围半径（像素） */
    range: number;
    /** 攻击间隔（秒） */
    attackInterval: number;
}

/** 防御塔配置数据接口 */
export interface TowerConfig {
    /** 防御塔类型 */
    towerType: TowerType;
    /** 每级配置列表 */
    levels: TowerLevelConfig[];
    /** 建造费用 */
    buildCost: number;
    /** 升级费用倍率 */
    upgradeCostMultiplier?: number;
    /** 地图格子坐标（列） */
    gridX: number;
    /** 地图格子坐标（行） */
    gridY: number;
}

export class TowerBase extends Entity {
    /** 防御塔类型 */
    public towerType: TowerType = TowerType.Bottle;

    /** 当前等级（1-based） */
    protected _level: number = 1;

    /** 最大可升级等级 */
    protected _maxLevel: number = 3;

    /** 等级配置列表 */
    protected _levelConfigs: TowerLevelConfig[] = [];

    /** 当前攻击力 */
    protected _attack: number = 10;

    /** 当前攻击范围半径（像素） */
    public range: number = 120;

    /** 攻击间隔（秒） */
    public attackInterval: number = 1.0;

    /** 攻击冷却计时器（秒） */
    protected _attackCooldown: number = 0;

    /** 当前攻击目标 */
    protected _target: MonsterBase | null = null;

    /** 建造费用 */
    public buildCost: number = 100;

    /** 升级费用倍率 */
    public upgradeCostMultiplier: number = 1.5;

    /** 地图格子坐标（列） */
    public gridX: number = 0;

    /** 地图格子坐标（行） */
    public gridY: number = 0;

    /** 是否可以攻击 */
    protected _canAttack: boolean = true;

    /** 所有存活的怪物（由管理器在每帧注入，用于索敌） */
    public enemyList: MonsterBase[] = [];

    // ==================== 属性 ====================

    get level(): number { return this._level; }
    get maxLevel(): number { return this._maxLevel; }
    get attack(): number { return this._attack; }
    get canAttack(): boolean { return this._canAttack; }
    get target(): MonsterBase | null { return this._target; }

    /** 是否可以升级 */
    get canUpgrade(): boolean {
        return this._level < this._maxLevel;
    }

    /** 当前等级升级费用 */
    get upgradeCost(): number {
        if (!this.canUpgrade) return 0;
        const baseCost = this.buildCost * this.upgradeCostMultiplier;
        return Math.floor(baseCost * this._level);
    }

    /** 攻击冷却是否就绪 */
    get isReadyToAttack(): boolean {
        return this._canAttack && this._attackCooldown <= 0;
    }

    // ==================== 初始化 ====================

    /**
     * 使用配置数据初始化防御塔
     */
    public initWithConfig(config: TowerConfig): void {
        this.towerType = config.towerType;
        this._levelConfigs = config.levels;
        this._maxLevel = config.levels.length;
        this.buildCost = config.buildCost;
        this.upgradeCostMultiplier = config.upgradeCostMultiplier || 1.5;
        this.gridX = config.gridX;
        this.gridY = config.gridY;

        // 应用初始等级配置
        this.applyLevelConfig();
    }

    /** 应用当前等级的配置 */
    private applyLevelConfig(): void {
        if (this._level < 1 || this._level > this._levelConfigs.length) return;

        const cfg = this._levelConfigs[this._level - 1];
        this._attack = cfg.attack;
        this.range = cfg.range;
        this.attackInterval = cfg.attackInterval;
        this._attackCooldown = 0;
    }

    // ==================== 升级系统 ====================

    /**
     * 升级防御塔
     * @returns 是否升级成功
     */
    public upgrade(): boolean {
        if (!this.canUpgrade) return false;

        this._level++;
        this.applyLevelConfig();
        this.emit('upgraded', this._level);
        return true;
    }

    // ==================== 索敌系统 ====================

    /**
     * 寻找攻击范围内的最近目标
     * 索敌优先级：进度最靠前的怪物
     * @returns 找到的目标，无目标时返回 null
     */
    public findTarget(): MonsterBase | null {
        let bestTarget: MonsterBase | null = null;
        let bestProgress: number = -1;

        const towerPos = this.worldPosition;

        for (const monster of this.enemyList) {
            if (!monster.isActive || monster.isDead) continue;
            // 飞行怪物只能被对空塔攻击（这里由子类按需过滤）

            const monsterPos = monster.worldPosition;
            const dist = Vec3.distance(towerPos, monsterPos);

            if (dist <= this.range) {
                // 优先攻击进度靠前的怪物（路径索引越大越靠终点）
                const progress = monster['_pathIndex'] || 0;
                if (progress > bestProgress) {
                    bestProgress = progress;
                    bestTarget = monster;
                }
            }
        }

        this._target = bestTarget;
        return bestTarget;
    }

    /**
     * 锁定目标
     */
    public setTarget(target: MonsterBase | null): void {
        this._target = target;
    }

    // ==================== 攻击系统 ====================

    /**
     * 尝试攻击（生成子弹，由子类重写）
     * @returns 是否成功发起攻击
     */
    public tryAttack(): boolean {
        if (!this.isReadyToAttack) return false;

        // 索敌
        const target = this.findTarget();
        if (!target) return false;

        // 攻击
        this._attackCooldown = this.attackInterval;
        this.emit('attack', target);
        // 子类在此处创建子弹
        return true;
    }

    /** 禁用攻击 */
    public disableAttack(): void {
        this._canAttack = false;
    }

    /** 启用攻击 */
    public enableAttack(): void {
        this._canAttack = true;
    }

    // ==================== 每帧更新 ====================

    public override update(dt: number): void {
        if (!this.isActive) return;

        // 更新攻击冷却
        if (this._attackCooldown > 0) {
            this._attackCooldown -= dt;
        }

        // 检查当前目标是否仍然有效
        if (this._target) {
            if (!this._target.isActive || this._target.isDead) {
                this._target = null;
            } else {
                const dist = Vec3.distance(this.worldPosition, this._target.worldPosition);
                if (dist > this.range) {
                    this._target = null;
                }
            }
        }
    }

    // ==================== 生命周期 ====================

    public override onDestroy(): void {
        this.emit('beforeDestroy');
        this._target = null;
        this.enemyList = [];
        super.onDestroy();
    }

    public override recycle(): void {
        this.emit('beforeRecycle');
        this.towerType = TowerType.Bottle;
        this._level = 1;
        this._maxLevel = 3;
        this._levelConfigs = [];
        this._attack = 10;
        this.range = 120;
        this.attackInterval = 1.0;
        this._attackCooldown = 0;
        this._target = null;
        this.buildCost = 100;
        this.upgradeCostMultiplier = 1.5;
        this.gridX = 0;
        this.gridY = 0;
        this._canAttack = true;
        this.enemyList = [];
        super.recycle();
    }
}
