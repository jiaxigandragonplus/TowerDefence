// 怪物基类
// 沿预设路径移动的敌方单位，拥有血量、护甲、速度和奖励属性

import { Vec3 } from 'cc';
import { Entity } from "../Entity";

/** 怪物类型枚举 */
export enum MonsterType {
    /** 陆行怪物 */
    Land = 0,
    /** 飞行怪物 */
    Fly = 1,
    /** Boss 怪物 */
    Boss = 2,
}

/** 怪物移动状态 */
export enum MonsterMoveState {
    /** 站立 */
    Idle = 0,
    /** 移动中 */
    Moving = 1,
    /** 已到达终点 */
    ReachedEnd = 2,
}

/** 怪物配置数据接口 */
export interface MonsterConfig {
    /** 怪物类型 */
    monsterType: MonsterType;
    /** 最大血量 */
    maxHp: number;
    /** 移动速度（像素/秒） */
    speed: number;
    /** 护甲值（减免伤害） */
    armor: number;
    /** 消灭后奖励的金币 */
    rewardGold: number;
    /** 消灭后奖励的萝卜（生命值）消耗 */
    lifeCost: number;
}

export class MonsterBase extends Entity {
    /** 怪物类型 */
    public monsterType: MonsterType = MonsterType.Land;

    /** 当前血量 */
    protected _hp: number = 0;

    /** 最大血量 */
    protected _maxHp: number = 0;

    /** 移动速度（像素/秒） */
    public speed: number = 100;

    /** 当前实际速度（可能被减速影响） */
    protected _currentSpeed: number = 0;

    /** 护甲值 */
    public armor: number = 0;

    /** 消灭后奖励的金币 */
    public rewardGold: number = 0;

    /** 怪物到达终点后对萝卜造成的生命消耗 */
    public lifeCost: number = 1;

    /** 移动状态 */
    public moveState: MonsterMoveState = MonsterMoveState.Idle;

    /** 当前所在路径点索引 */
    protected _pathIndex: number = 0;

    /** 路径点列表（世界坐标） */
    protected _pathPoints: Vec3[] = [];

    /** 慢速/减速倍率（1.0 = 正常，0.5 = 减速50%） */
    protected _slowFactor: number = 1.0;

    /** 减速剩余时间 */
    protected _slowDuration: number = 0;

    // ==================== 血量 ====================

    get hp(): number { return this._hp; }
    get maxHp(): number { return this._maxHp; }

    get hpPercent(): number {
        if (this._maxHp <= 0) return 0;
        return Math.max(0, this._hp / this._maxHp);
    }

    get isDead(): boolean {
        return this._hp <= 0;
    }

    /** 是否已到达终点 */
    get hasReachedEnd(): boolean {
        return this.moveState === MonsterMoveState.ReachedEnd;
    }

    /** 是否在移动中 */
    get isMoving(): boolean {
        return this.moveState === MonsterMoveState.Moving;
    }

    // ==================== 初始化 ====================

    /**
     * 使用配置数据初始化怪物
     */
    public initWithConfig(config: MonsterConfig): void {
        this.monsterType = config.monsterType;
        this._maxHp = config.maxHp;
        this._hp = config.maxHp;
        this.speed = config.speed;
        this._currentSpeed = config.speed;
        this.armor = config.armor;
        this.rewardGold = config.rewardGold;
        this.lifeCost = config.lifeCost;
    }

    /**
     * 设置移动路径
     * @param pathPoints 路径点数组（世界坐标）
     */
    public setPath(pathPoints: Vec3[]): void {
        this._pathPoints = pathPoints;
        this._pathIndex = 0;
        if (pathPoints.length > 0 && this.node && this.node.isValid) {
            this.node.setWorldPosition(pathPoints[0]);
            this.moveState = MonsterMoveState.Idle;
        }
    }

    // ==================== 伤害处理 ====================

    /**
     * 受到伤害（经过护甲减免）
     * @param rawDamage 原始伤害值
     * @returns 是否被击杀
     */
    public takeDamage(rawDamage: number): boolean {
        if (this.isDead) return false;

        const actualDamage = Math.max(1, rawDamage - this.armor);
        this._hp = Math.max(0, this._hp - actualDamage);

        this.emit('hpChanged', this._hp, this._maxHp);

        if (this._hp <= 0) {
            this.emit('killed');
            return true;
        }
        return false;
    }

    // ==================== 减速效果 ====================

    /**
     * 施加减速效果
     * @param factor 减速倍率（0-1之间，如 0.5 表示减速 50%）
     * @param duration 持续时间（秒）
     */
    public applySlow(factor: number, duration: number): void {
        if (factor < this._slowFactor) {
            this._slowFactor = Math.max(0.1, factor);
            this._slowDuration = Math.max(this._slowDuration, duration);
            this._currentSpeed = this.speed * this._slowFactor;
        }
    }

    // ==================== 移动更新 ====================

    /**
     * 每帧更新移动
     * @param dt 帧间隔时间
     */
    public override update(dt: number): void {
        if (!this.isActive || this.isDead) return;

        // 更新减速计时
        this.updateSlow(dt);

        // 移动逻辑
        this.updateMovement(dt);
    }

    /** 更新减速效果计时 */
    private updateSlow(dt: number): void {
        if (this._slowDuration > 0) {
            this._slowDuration -= dt;
            if (this._slowDuration <= 0) {
                this._slowDuration = 0;
                this._slowFactor = 1.0;
                this._currentSpeed = this.speed;
            }
        }
    }

    /** 沿路径移动 */
    private updateMovement(dt: number): void {
        if (this._pathPoints.length === 0) return;
        if (this.moveState === MonsterMoveState.ReachedEnd) return;

        this.moveState = MonsterMoveState.Moving;

        const targetPoint = this._pathPoints[this._pathIndex];
        if (!targetPoint) {
            this.moveState = MonsterMoveState.ReachedEnd;
            this.emit('reachedEnd');
            return;
        }

        const currentPos = this.node.worldPosition;
        const direction = new Vec3();
        Vec3.subtract(direction, targetPoint, currentPos);
        const distance = direction.length();

        const moveDistance = this._currentSpeed * dt;

        if (distance <= moveDistance || distance < 0.1) {
            // 到达当前路径点
            this.node.setWorldPosition(targetPoint);
            this._pathIndex++;

            if (this._pathIndex >= this._pathPoints.length) {
                this.moveState = MonsterMoveState.ReachedEnd;
                this.emit('reachedEnd');
            } else {
                this.emit('waypointReached', this._pathIndex);
            }
        } else {
            // 向目标移动
            direction.normalize();
            direction.multiplyScalar(moveDistance);
            const newPos = currentPos.clone();
            newPos.add(direction);
            this.node.setWorldPosition(newPos);
        }
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
        this.speed = 100;
        this._currentSpeed = 100;
        this.armor = 0;
        this.rewardGold = 0;
        this.lifeCost = 1;
        this.moveState = MonsterMoveState.Idle;
        this._pathIndex = 0;
        this._pathPoints = [];
        this._slowFactor = 1.0;
        this._slowDuration = 0;
        super.recycle();
    }
}
