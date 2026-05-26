// 怪物管理器
// 负责活跃怪物追踪、怪物生成（含路径绑定）、每帧更新驱动、怪物回收
// 以及外部事件回调（怪物被击杀、到达终点）

import { Node, Vec3 } from 'cc';
import { MonsterBase, MonsterType } from "./MonsterBase";
import { MonsterFactory } from "./MonsterFactory";
import { Utility } from "../../../../framework/utils/Utility";
import { Logger } from "../../../../framework/logger/Logger";

const log = new Logger("monster-manager");

/** 怪物生成请求 */
export interface MonsterSpawnRequest {
    /** 模板 ID（对应 Monster.csv 的 Id） */
    templateId: number;
    /** 怪物类型（可选，覆盖模板默认类型） */
    monsterType?: MonsterType;
    /** 移动路径点列表（世界坐标） */
    pathPoints?: Vec3[];
    /** 血量倍率（可选，用于难度调整，默认 1.0） */
    hpMultiplier?: number;
}

export class MonsterManager {
    /** 怪物工厂引用 */
    private _factory: MonsterFactory;

    /** 活跃怪物列表（供碰撞检测等外部使用） */
    private _activeMonsters: MonsterBase[] = [];

    /** 待删除的怪物列表（避免遍历时增删） */
    private _pendingRemove: MonsterBase[] = [];

    /** 地图格子大小（像素），默认 64 */
    private _gridSize: number = 64;

    /** 地图偏移（格子的世界坐标原点） */
    private _mapOffsetX: number = 0;
    private _mapOffsetY: number = 0;

    /** 怪物容器节点 */
    private _monsterContainer: Node | null = null;

    /** 怪物被击杀时的事件回调 */
    public onMonsterKilled: ((monster: MonsterBase) => void) | null = null;

    /** 怪物到达终点时的事件回调 */
    public onMonsterReachedEnd: ((monster: MonsterBase) => void) | null = null;

    constructor(factory: MonsterFactory) {
        this._factory = factory;
    }

    // ==================== 活跃列表访问 ====================

    /** 获取活跃怪物列表（只读） */
    get activeMonsters(): ReadonlyArray<MonsterBase> {
        return this._activeMonsters;
    }

    /** 活跃怪物数量 */
    get activeCount(): number {
        return this._activeMonsters.length;
    }

    /** 获取怪物工厂引用 */
    get factory(): MonsterFactory {
        return this._factory;
    }

    // ==================== 坐标系统 ====================

    /**
     * 设置地图参数
     * @param gridSize 格子像素大小
     * @param offsetX 地图原点 X 偏移
     * @param offsetY 地图原点 Y 偏移
     */
    public setGridParams(gridSize: number, offsetX: number = 0, offsetY: number = 0): void {
        this._gridSize = gridSize;
        this._mapOffsetX = offsetX;
        this._mapOffsetY = offsetY;
    }

    /** 获取当前格子大小 */
    public get gridSize(): number {
        return this._gridSize;
    }

    /**
     * 格子坐标 → 世界坐标
     * @param gridX 格子列
     * @param gridY 格子行
     * @returns 该格子中心的世界坐标
     */
    public gridToWorld(gridX: number, gridY: number): Vec3 {
        const worldX = this._mapOffsetX + gridX * this._gridSize + this._gridSize / 2;
        const worldY = this._mapOffsetY + gridY * this._gridSize + this._gridSize / 2;
        return new Vec3(worldX, worldY, 0);
    }

    /**
     * 世界坐标 → 格子坐标
     * @param worldX 世界 X 坐标
     * @param worldY 世界 Y 坐标
     * @returns [gridX, gridY]
     */
    public worldToGrid(worldX: number, worldY: number): [number, number] {
        const gridX = Math.floor((worldX - this._mapOffsetX) / this._gridSize);
        const gridY = Math.floor((worldY - this._mapOffsetY) / this._gridSize);
        return [gridX, gridY];
    }

    // ==================== 容器节点 ====================

    /**
     * 设置怪物的容器节点（所有怪物节点将挂在该节点下）
     * @param container 容器节点
     */
    public setMonsterContainer(container: Node): void {
        this._monsterContainer = container;
    }

    // ==================== 怪物生成 ====================

    /**
     * 创建单个怪物
     * @param request 生成请求
     * @returns 创建的怪物实例，失败返回 null
     */
    public spawnMonster(request: MonsterSpawnRequest): MonsterBase | null {
        const monster = this._factory.create(request.templateId);
        if (!monster) {
            log.warn(`failed to spawn monster: templateId=${request.templateId}`);
            return null;
        }

        // 覆盖怪物类型（如果指定）
        if (request.monsterType !== undefined) {
            monster.monsterType = request.monsterType;
        }

        // 设置路径
        if (request.pathPoints && request.pathPoints.length > 0) {
            // 如果还没有 node，创建一个新 node 挂到容器下
            if (!monster.node && this._monsterContainer) {
                const node = new Node(`Monster_${monster.id}`);
                monster.init(node);
                this._monsterContainer.addChild(node);
            }
            monster.setPath(request.pathPoints);
        }

        // 应用血量倍率
        if (request.hpMultiplier && request.hpMultiplier !== 1.0) {
            // 通过反射访问 protected _maxHp 和 _hp（与 takeDamage 逻辑一致）
            const adjustedHp = Math.floor(monster.maxHp * request.hpMultiplier);
            (monster as any)['_maxHp'] = adjustedHp;
            (monster as any)['_hp'] = adjustedHp;
        }

        // 监听怪物事件
        monster.on('killed', () => {
            this.onMonsterKilledInternal(monster);
        });

        monster.on('reachedEnd', () => {
            this.onMonsterReachedEndInternal(monster);
        });

        this._activeMonsters.push(monster);
        return monster;
    }

    /**
     * 批量创建怪物
     * @param requests 生成请求列表
     * @returns 成功创建的怪物列表
     */
    public spawnMonsters(requests: MonsterSpawnRequest[]): MonsterBase[] {
        const created: MonsterBase[] = [];
        for (const req of requests) {
            const monster = this.spawnMonster(req);
            if (monster) {
                created.push(monster);
            }
        }
        return created;
    }

    /**
     * 通过波次数据创建怪物
     * @param waveData { [templateId: number]: number } 格式，如 { 1: 5, 2: 3 }
     * @param pathPoints 所有怪物的共享路径
     * @param hpMultiplier 血量倍率
     */
    public spawnWave(
        waveData: { [templateId: number]: number },
        pathPoints: Vec3[],
        hpMultiplier: number = 1.0,
    ): MonsterBase[] {
        const created: MonsterBase[] = [];
        for (const idStr in waveData) {
            const templateId = parseInt(idStr);
            const count = waveData[templateId];
            for (let i = 0; i < count; i++) {
                const monster = this.spawnMonster({
                    templateId,
                    pathPoints,
                    hpMultiplier,
                });
                if (monster) {
                    created.push(monster);
                }
            }
        }
        return created;
    }

    // ==================== 事件内部处理 ====================

    /**
     * 怪物被击杀时的内部处理
     */
    private onMonsterKilledInternal(monster: MonsterBase): void {
        log.info(`monster killed: id=${monster.id}, type=${MonsterType[monster.monsterType]}`);

        // 外部回调
        if (this.onMonsterKilled) {
            this.onMonsterKilled(monster);
        }
    }

    /**
     * 怪物到达终点时的内部处理
     */
    private onMonsterReachedEndInternal(monster: MonsterBase): void {
        log.info(`monster reached end: id=${monster.id}, type=${MonsterType[monster.monsterType]}`);

        // 外部回调
        if (this.onMonsterReachedEnd) {
            this.onMonsterReachedEnd(monster);
        }
    }

    // ==================== 怪物回收 ====================

    /**
     * 回收单个怪物（从活跃列表移除并回收到对象池）
     * @param monster 要回收的怪物
     */
    public recycleMonster(monster: MonsterBase): void {
        if (!monster) return;
        Utility.removeFromArray(this._activeMonsters, monster);
        this._factory.recycle(monster);
    }

    /**
     * 回收所有活跃怪物
     */
    public recycleAll(): void {
        // 倒序遍历避免索引问题
        for (let i = this._activeMonsters.length - 1; i >= 0; i--) {
            this._factory.recycle(this._activeMonsters[i]);
        }
        this._activeMonsters.length = 0;
        this._pendingRemove = [];
    }

    /**
     * 强制回收指定怪物（即使尚未死亡）
     * @param monster 要回收的怪物
     */
    public removeMonster(monster: MonsterBase): void {
        if (!monster) return;

        const index = this._activeMonsters.indexOf(monster);
        if (index >= 0) {
            this._activeMonsters.splice(index, 1);
        }

        this._factory.recycle(monster);
    }

    /**
     * 获取指定格子上的怪物
     * @param gridX 格子列
     * @param gridY 格子行
     */
    public getMonsterAt(gridX: number, gridY: number): MonsterBase | null {
        const worldPos = this.gridToWorld(gridX, gridY);
        const halfGrid = this._gridSize / 2;

        for (const monster of this._activeMonsters) {
            if (!monster.isActive || monster.isDead) continue;
            const pos = monster.worldPosition;
            if (
                Math.abs(pos.x - worldPos.x) <= halfGrid &&
                Math.abs(pos.y - worldPos.y) <= halfGrid
            ) {
                return monster;
            }
        }
        return null;
    }

    // ==================== 查询 ====================

    /**
     * 获取距离指定坐标最近的怪物
     * @param worldX 世界 X 坐标
     * @param worldY 世界 Y 坐标
     * @param maxDistance 最大搜索距离，-1 表示无限制
     */
    public getNearestMonster(worldX: number, worldY: number, maxDistance: number = -1): MonsterBase | null {
        let bestMonster: MonsterBase | null = null;
        let bestDistance: number = Number.MAX_VALUE;

        const point = new Vec3(worldX, worldY, 0);

        for (const monster of this._activeMonsters) {
            if (!monster.isActive || monster.isDead) continue;
            const dist = Vec3.distance(point, monster.worldPosition);
            if (dist < bestDistance && (maxDistance < 0 || dist <= maxDistance)) {
                bestDistance = dist;
                bestMonster = monster;
            }
        }

        return bestMonster;
    }

    /**
     * 获取进度最靠前的怪物（路径索引最大）
     */
    public getFurthestMonster(): MonsterBase | null {
        let bestMonster: MonsterBase | null = null;
        let bestProgress: number = -1;

        for (const monster of this._activeMonsters) {
            if (!monster.isActive || monster.isDead) continue;
            const progress = (monster as any)['_pathIndex'] || 0;
            if (progress > bestProgress) {
                bestProgress = progress;
                bestMonster = monster;
            }
        }

        return bestMonster;
    }

    // ==================== 每帧更新 ====================

    /**
     * 每帧更新所有活跃怪物
     * 1. 驱动每个怪物的移动和减速计时
     * 2. 回收死亡/到达终点的怪物
     *
     * @param dt 帧间隔时间（秒）
     */
    public update(dt: number): void {
        // 遍历更新所有怪物
        for (let i = this._activeMonsters.length - 1; i >= 0; i--) {
            const monster = this._activeMonsters[i];

            // 跳过无效怪物
            if (!monster || !monster.isActive) {
                this._activeMonsters.splice(i, 1);
                continue;
            }

            // 执行怪物每帧逻辑（移动、减速）
            monster.update(dt);

            // 标记需要回收的怪物（已死亡或已到达终点）
            if (monster.isDead || monster.hasReachedEnd) {
                this._pendingRemove.push(monster);
            }
        }

        // 回收已标记的怪物
        this.flushPendingRemove();
    }

    /**
     * 回收所有已标记的怪物
     * 从活跃列表中移除，并通过工厂回收到对象池
     */
    private flushPendingRemove(): void {
        if (this._pendingRemove.length === 0) return;

        for (const monster of this._pendingRemove) {
            // 从活跃列表中移除
            const index = this._activeMonsters.indexOf(monster);
            if (index >= 0) {
                this._activeMonsters.splice(index, 1);
            }

            // 回收怪物（如果怪物仍在对象池中且未回收）
            if (monster.node) {
                this._factory.recycle(monster);
            }
        }

        this._pendingRemove = [];
    }

    /**
     * 清理所有已死亡/到达终点的怪物（主动调用回收）
     */
    public cleanDead(): void {
        for (let i = this._activeMonsters.length - 1; i >= 0; i--) {
            const monster = this._activeMonsters[i];
            if (monster.isDead || monster.hasReachedEnd) {
                this._factory.recycle(monster);
                Utility.removeFromArray(this._activeMonsters, monster);
            }
        }
    }

    // ==================== 重置 ====================

    /**
     * 重置管理器（回收所有怪物、清空状态）
     */
    public reset(): void {
        this.recycleAll();
        this._monsterContainer = null;
        this._gridSize = 64;
        this._mapOffsetX = 0;
        this._mapOffsetY = 0;
        this.onMonsterKilled = null;
        this.onMonsterReachedEnd = null;
    }
}
