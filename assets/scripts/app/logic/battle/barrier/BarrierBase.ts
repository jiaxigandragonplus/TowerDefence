// 障碍物基类
// 地图上的障碍物，可被子弹攻击摧毁，也可阻挡子弹和怪物的移动

import { Vec3 } from 'cc';
import { Entity } from "../Entity";

/** 障碍物类型枚举 */
export enum BarrierType {
    /** 普通障碍物 */
    Normal = 0,
    /** 宝箱/奖励类障碍物 */
    Treasure = 1,
}

/** 障碍物配置数据接口 */
export interface BarrierConfig {
    /** 障碍物类型 */
    type: BarrierType;
    /** 最大血量 */
    maxHp: number;
    /** 地图格子坐标（列） */
    gridX: number;
    /** 地图格子坐标（行） */
    gridY: number;
    /** 占据的格子数（默认 1x1） */
    size?: number;
    /** 是否可被摧毁 */
    destructible?: boolean;
}

export class BarrierBase extends Entity {
    /** 障碍物类型 */
    public barrierType: BarrierType = BarrierType.Normal;

    /** 当前血量 */
    protected _hp: number = 0;

    /** 最大血量 */
    protected _maxHp: number = 0;

    /** 是否可被摧毁 */
    public destructible: boolean = true;

    /** 地图格子坐标（列） */
    public gridX: number = 0;

    /** 地图格子坐标（行） */
    public gridY: number = 0;

    /** 占据的格子大小 */
    public size: number = 1;

    // ==================== 血量 ====================

    /** 当前血量 */
    get hp(): number {
        return this._hp;
    }

    /** 最大血量 */
    get maxHp(): number {
        return this._maxHp;
    }

    /** 血量百分比 [0, 1] */
    get hpPercent(): number {
        if (this._maxHp <= 0) return 0;
        return Math.max(0, this._hp / this._maxHp);
    }

    /** 是否已被摧毁 */
    get isDead(): boolean {
        return this._hp <= 0;
    }

    // ==================== 初始化 ====================

    /**
     * 使用配置数据初始化障碍物
     * @param config 障碍物配置
     */
    public initWithConfig(config: BarrierConfig): void {
        this.barrierType = config.type;
        this._maxHp = config.maxHp;
        this._hp = config.maxHp;
        this.gridX = config.gridX;
        this.gridY = config.gridY;
        this.destructible = config.destructible !== false;
        this.size = config.size || 1;
    }

    // ==================== 伤害处理 ====================

    /**
     * 受到伤害
     * @param damage 伤害值
     * @returns 是否被摧毁
     */
    public takeDamage(damage: number): boolean {
        if (!this.destructible || this.isDead) return false;

        this._hp = Math.max(0, this._hp - damage);
        this.emit('hpChanged', this._hp, this._maxHp);

        if (this._hp <= 0) {
            this.emit('destroyed');
            return true;
        }
        return false;
    }

    /**
     * 直接设置血量
     * @param hp 血量值
     */
    public setHp(hp: number): void {
        this._hp = Math.max(0, Math.min(hp, this._maxHp));
    }

    // ==================== 生命周期 ====================

    public override onDestroy(): void {
        this.emit('beforeDestroy');
        super.onDestroy();
    }

    public override recycle(): void {
        this.emit('beforeRecycle');
        this._hp = 0;
        this._maxHp = 0;
        this.barrierType = BarrierType.Normal;
        this.destructible = true;
        this.gridX = 0;
        this.gridY = 0;
        this.size = 1;
        super.recycle();
    }
}
