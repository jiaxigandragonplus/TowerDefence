// 子弹基类
// 由防御塔发射的飞行弹丸，对怪物/障碍物造成伤害

import { Vec3 } from 'cc';
import { Entity } from "../Entity";
import { MonsterBase } from "../monster/MonsterBase";

/** 子弹特效类型 */
export enum BulletEffect {
    /** 无特殊效果 */
    None = 0,
    /** 减速效果 */
    Slow = 1,
    /** 持续伤害 */
    Poison = 2,
    /** 范围爆炸 */
    Explosion = 3,
    /** 穿透（可攻击多个目标） */
    Pierce = 4,
}

/** 子弹配置数据接口 */
export interface BulletConfig {
    /** 基础伤害 */
    damage: number;
    /** 飞行速度（像素/秒） */
    speed: number;
    /** 子弹特效类型 */
    effect?: BulletEffect;
    /** 特效参数（减速因子 / 爆炸半径 / 穿透次数等） */
    effectParam?: number;
    /** 最大存活时间（秒），0 表示无限制 */
    maxLifetime?: number;
}

export class BulletBase extends Entity {
    /** 子弹伤害 */
    public damage: number = 10;

    /** 飞行速度（像素/秒） */
    public speed: number = 300;

    /** 子弹特效类型 */
    public effect: BulletEffect = BulletEffect.None;

    /** 特效参数 */
    public effectParam: number = 0;

    /** 当前飞行方向（单位向量） */
    protected _direction: Vec3 = new Vec3();

    /** 目标怪物（追踪型子弹使用） */
    protected _targetMonster: MonsterBase | null = null;

    /** 是否追踪目标 */
    public isTracking: boolean = false;

    /** 已存活时间 */
    protected _aliveTime: number = 0;

    /** 最大存活时间（秒），0 表示无限制 */
    public maxLifetime: number = 5;

    /** 是否已失效（碰撞后 / 超时 / 超出地图） */
    protected _isDead: boolean = false;

    /** 穿透剩余次数（穿透型子弹） */
    protected _pierceRemaining: number = 0;

    // ==================== 属性 ====================

    get isDead(): boolean { return this._isDead; }
    get direction(): Vec3 { return this._direction.clone(); }
    get targetMonster(): MonsterBase | null { return this._targetMonster; }
    get aliveTime(): number { return this._aliveTime; }

    /** 穿透剩余次数 */
    get pierceRemaining(): number { return this._pierceRemaining; }

    // ==================== 初始化 ====================

    /**
     * 使用配置数据初始化子弹
     */
    public initWithConfig(config: BulletConfig): void {
        this.damage = config.damage;
        this.speed = config.speed;
        this.effect = config.effect || BulletEffect.None;
        this.effectParam = config.effectParam || 0;
        this.maxLifetime = config.maxLifetime || 5;

        // 穿透
        if (this.effect === BulletEffect.Pierce) {
            this._pierceRemaining = this.effectParam > 0 ? this.effectParam : 2;
        }
    }

    /**
     * 设置子弹发射参数
     * @param startPos 起始位置（世界坐标）
     * @param direction 飞行方向（单位向量）
     */
    public launch(startPos: Vec3, direction: Vec3): void {
        if (this.node && this.node.isValid) {
            this.node.setWorldPosition(startPos);
        }
        this._direction = new Vec3(direction.x, direction.y, direction.z);
        this._direction.normalize();
        this._aliveTime = 0;
        this._isDead = false;
    }

    /**
     * 设置追踪目标
     * @param monster 目标怪物
     */
    public setTarget(monster: MonsterBase): void {
        this._targetMonster = monster;
        this.isTracking = true;
    }

    // ==================== 碰撞处理 ====================

    /**
     * 子弹命中目标后调用
     * 穿透型子弹返回 false 表示不销毁
     * @returns 子弹是否应该被销毁
     */
    public onHit(): boolean {
        if (this.effect === BulletEffect.Pierce && this._pierceRemaining > 0) {
            this._pierceRemaining--;
            if (this._pierceRemaining > 0) {
                // 不销毁，继续飞行
                return false;
            }
        }
        this._isDead = true;
        return true;
    }

    /** 立即销毁子弹 */
    public kill(): void {
        this._isDead = true;
    }

    // ==================== 每帧更新 ====================

    public override update(dt: number): void {
        if (!this.isActive || this._isDead) return;

        this._aliveTime += dt;

        // 超时检查
        if (this.maxLifetime > 0 && this._aliveTime >= this.maxLifetime) {
            this._isDead = true;
            this.emit('timeout');
            return;
        }

        // 追踪目标
        if (this.isTracking && this._targetMonster) {
            if (!this._targetMonster.isActive || this._targetMonster.isDead) {
                // 目标已失效，沿原方向继续飞行
                this._targetMonster = null;
                this.isTracking = false;
            } else {
                // 更新方向指向目标当前位置
                const targetPos = this._targetMonster.worldPosition;
                const bulletPos = this.worldPosition;
                const newDir = new Vec3();
                Vec3.subtract(newDir, targetPos, bulletPos);
                newDir.normalize();
                this._direction = newDir;
            }
        }

        // 移动子弹
        const moveDelta = this._direction.clone();
        moveDelta.multiplyScalar(this.speed * dt);
        const newPos = this.worldPosition.clone();
        newPos.add(moveDelta);

        if (this.node && this.node.isValid) {
            this.node.setWorldPosition(newPos);
        }
    }

    // ==================== 生命周期 ====================

    public override onDestroy(): void {
        this.emit('beforeDestroy');
        this._targetMonster = null;
        super.onDestroy();
    }

    public override recycle(): void {
        this.emit('beforeRecycle');
        this.damage = 10;
        this.speed = 300;
        this.effect = BulletEffect.None;
        this.effectParam = 0;
        this._direction = new Vec3();
        this._targetMonster = null;
        this.isTracking = false;
        this._aliveTime = 0;
        this.maxLifetime = 5;
        this._isDead = false;
        this._pierceRemaining = 0;
        super.recycle();
    }
}
