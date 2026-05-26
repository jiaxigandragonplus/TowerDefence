// 防御塔管理器
// 负责活跃防御塔追踪、建造/出售/升级、每帧更新驱动（索敌+攻击）、回收
// 以及坐标系统（格子 ↔ 世界坐标）转换

import { Node, Vec3 } from 'cc';
import { TowerBase, TowerType } from "./TowerBase";
import { TowerFactory, TowerTemplate, towerFactory } from "./TowerFactory";
import { MonsterBase } from "../monster/MonsterBase";
import { Utility } from "../../../../framework/utils/Utility";
import { Logger } from "../../../../framework/logger/Logger";

const log = new Logger("tower-manager");

/** 防御塔建造请求 */
export interface TowerBuildRequest {
    /** 模板 ID（对应 Tower.csv 合并后的模板 Id） */
    templateId: number;
    /** 格子列坐标 */
    gridX: number;
    /** 格子行坐标 */
    gridY: number;
}

export class TowerManager {
    /** 防御塔工厂引用 */
    private _factory: TowerFactory;

    /** 活跃防御塔列表（供碰撞检测、渲染等外部使用） */
    private _activeTowers: TowerBase[] = [];

    /** 待删除的防御塔列表（避免遍历时增删） */
    private _pendingRemove: TowerBase[] = [];

    /** 地图格子大小（像素），默认 64 */
    private _gridSize: number = 64;

    /** 地图偏移（格子的世界坐标原点） */
    private _mapOffsetX: number = 0;
    private _mapOffsetY: number = 0;

    /** 防御塔容器节点 */
    private _towerContainer: Node | null = null;

    /** 当前所有活跃怪物的引用（每帧注入到防御塔的 enemyList） */
    private _enemyList: MonsterBase[] = [];

    /** 防御塔被出售时的事件回调 */
    public onTowerSold: ((tower: TowerBase) => void) | null = null;

    /** 防御塔升级时的事件回调 */
    public onTowerUpgraded: ((tower: TowerBase, newLevel: number) => void) | null = null;

    constructor(factory: TowerFactory) {
        this._factory = factory;
    }

    // ==================== 活跃列表访问 ====================

    /** 获取活跃防御塔列表（只读） */
    get activeTowers(): ReadonlyArray<TowerBase> {
        return this._activeTowers;
    }

    /** 活跃防御塔数量 */
    get activeCount(): number {
        return this._activeTowers.length;
    }

    /** 获取防御塔工厂引用 */
    get factory(): TowerFactory {
        return this._factory;
    }

    // ==================== 敌人列表注入 ====================

    /**
     * 设置当前敌人列表引用
     * 每帧调用以保持防御塔的索敌列表为最新
     * @param enemies 当前所有活跃怪物列表
     */
    public setEnemyList(enemies: MonsterBase[]): void {
        this._enemyList = enemies;
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
     * 设置防御塔的容器节点（所有防御塔节点将挂在该节点下）
     * @param container 容器节点
     */
    public setTowerContainer(container: Node): void {
        this._towerContainer = container;
    }

    // ==================== 防御塔建造 ====================

    /**
     * 建造一个防御塔
     * @param request 建造请求
     * @returns 创建的防御塔实例，失败返回 null
     */
    public buildTower(request: TowerBuildRequest): TowerBase | null {
        // 检查该格子是否已有防御塔
        if (this.isGridOccupied(request.gridX, request.gridY)) {
            log.warn(`grid (${request.gridX}, ${request.gridY}) is already occupied`);
            return null;
        }

        const tower = this._factory.create(request.templateId, request.gridX, request.gridY);
        if (!tower) {
            log.warn(`failed to build tower: templateId=${request.templateId}`);
            return null;
        }

        // 设置防御塔世界位置
        const worldPos = this.gridToWorld(request.gridX, request.gridY);
        if (tower.node && tower.node.isValid) {
            tower.node.setWorldPosition(worldPos);
        } else if (this._towerContainer) {
            // 如果还没有绑定 node，创建一个新的 node 并挂到容器下
            const node = new Node(`Tower_${tower.id}`);
            tower.init(node);
            this._towerContainer.addChild(node);
            node.setWorldPosition(worldPos);
        }

        // 监听防御塔事件
        tower.on('upgraded', (level: number) => {
            this.onTowerUpgradedInternal(tower, level);
        });

        this._activeTowers.push(tower);
        log.info(`tower built: id=${tower.id}, type=${TowerType[tower.towerType]}, grid=(${request.gridX},${request.gridY})`);
        return tower;
    }

    /**
     * 批量建造防御塔
     * @param requests 建造请求列表
     * @returns 成功创建的防御塔列表
     */
    public buildTowers(requests: TowerBuildRequest[]): TowerBase[] {
        const created: TowerBase[] = [];
        for (const req of requests) {
            const tower = this.buildTower(req);
            if (tower) {
                created.push(tower);
            }
        }
        return created;
    }

    // ==================== 防御塔管理 ====================

    /**
     * 升级防御塔
     * @param tower 要升级的防御塔
     * @returns 是否升级成功
     */
    public upgradeTower(tower: TowerBase): boolean {
        if (!tower || !tower.isActive) return false;
        if (!tower.canUpgrade) return false;

        const success = tower.upgrade();
        if (success) {
            log.info(`tower upgraded: id=${tower.id}, level=${tower.level}`);
        }
        return success;
    }

    /**
     * 出售（回收）防御塔
     * @param tower 要出售的防御塔
     */
    public sellTower(tower: TowerBase): void {
        if (!tower) return;

        // 从活跃列表中移除
        Utility.removeFromArray(this._activeTowers, tower);

        // 回收节点
        if (tower.node && tower.node.isValid) {
            tower.node.removeFromParent();
        }

        // 回收到对象池
        this._factory.recycle(tower);

        // 外部回调
        if (this.onTowerSold) {
            this.onTowerSold(tower);
        }

        log.info(`tower sold: id=${tower.id}`);
    }

    /**
     * 出售指定格子上的防御塔
     * @param gridX 格子列
     * @param gridY 格子行
     * @returns 是否找到并出售
     */
    public sellTowerAt(gridX: number, gridY: number): boolean {
        const tower = this.getTowerAt(gridX, gridY);
        if (!tower) return false;

        this.sellTower(tower);
        return true;
    }

    /**
     * 出售所有防御塔
     */
    public sellAll(): void {
        for (let i = this._activeTowers.length - 1; i >= 0; i--) {
            const tower = this._activeTowers[i];
            if (tower.node && tower.node.isValid) {
                tower.node.removeFromParent();
            }
            this._factory.recycle(tower);
        }
        this._activeTowers.length = 0;
        this._pendingRemove = [];
    }

    // ==================== 防御塔事件内部处理 ====================

    /**
     * 防御塔升级时的内部处理
     */
    private onTowerUpgradedInternal(tower: TowerBase, newLevel: number): void {
        log.info(`tower upgraded: id=${tower.id}, level=${newLevel}`);

        // 外部回调
        if (this.onTowerUpgraded) {
            this.onTowerUpgraded(tower, newLevel);
        }
    }

    // ==================== 格子查询 ====================

    /**
     * 检查指定格子是否已有防御塔
     * @param gridX 格子列
     * @param gridY 格子行
     */
    public isGridOccupied(gridX: number, gridY: number): boolean {
        return this.getTowerAt(gridX, gridY) !== null;
    }

    /**
     * 获取指定格子上的防御塔
     * @param gridX 格子列
     * @param gridY 格子行
     */
    public getTowerAt(gridX: number, gridY: number): TowerBase | null {
        for (const tower of this._activeTowers) {
            if (!tower.isActive) continue;
            if (tower.gridX === gridX && tower.gridY === gridY) {
                return tower;
            }
        }
        return null;
    }

    /**
     * 获取指定格子及其周围区域内的所有防御塔
     * @param gridX 中心格子列
     * @param gridY 中心格子行
     * @param radius 搜索半径（格子数）
     */
    public getTowersInRadius(gridX: number, gridY: number, radius: number): TowerBase[] {
        const result: TowerBase[] = [];
        for (const tower of this._activeTowers) {
            if (!tower.isActive) continue;
            const dx = Math.abs(tower.gridX - gridX);
            const dy = Math.abs(tower.gridY - gridY);
            if (dx <= radius && dy <= radius) {
                result.push(tower);
            }
        }
        return result;
    }

    /**
     * 获取特定类型的所有活跃防御塔
     * @param type 防御塔类型
     */
    public getTowersByType(type: TowerType): TowerBase[] {
        const result: TowerBase[] = [];
        for (const tower of this._activeTowers) {
            if (tower.isActive && tower.towerType === type) {
                result.push(tower);
            }
        }
        return result;
    }

    /**
     * 计算当前所有防御塔的总建造+升级费用（用于统计）
     */
    public get totalInvestment(): number {
        let total = 0;
        for (const tower of this._activeTowers) {
            if (!tower.isActive) continue;
            total += tower.buildCost;
            // 累加升级费用（每级）
            for (let lv = 1; lv < tower.level; lv++) {
                total += Math.floor(tower.buildCost * tower.upgradeCostMultiplier * lv);
            }
        }
        return total;
    }

    // ==================== 索敌查询 ====================

    /**
     * 获取指定世界坐标周围射程内进度最靠前的怪物（用于辅助防御塔索敌）
     * @param worldX 世界 X 坐标
     * @param worldY 世界 Y 坐标
     * @param range 搜索范围半径
     */
    public findBestTarget(worldX: number, worldY: number, range: number): MonsterBase | null {
        let bestTarget: MonsterBase | null = null;
        let bestProgress: number = -1;

        const point = new Vec3(worldX, worldY, 0);

        for (const monster of this._enemyList) {
            if (!monster.isActive || monster.isDead) continue;

            const dist = Vec3.distance(point, monster.worldPosition);
            if (dist <= range) {
                const progress = (monster as any)['_pathIndex'] || 0;
                if (progress > bestProgress) {
                    bestProgress = progress;
                    bestTarget = monster;
                }
            }
        }

        return bestTarget;
    }

    // ==================== 每帧更新 ====================

    /**
     * 每帧更新所有活跃防御塔
     * 1. 为每个防御塔注入敌人列表
     * 2. 驱动每个防御塔的冷却计时
     * 3. 触发索敌和攻击
     *
     * @param dt 帧间隔时间（秒）
     */
    public update(dt: number): void {
        // 遍历更新所有防御塔
        for (let i = this._activeTowers.length - 1; i >= 0; i--) {
            const tower = this._activeTowers[i];

            // 跳过无效防御塔
            if (!tower || !tower.isActive) {
                this._activeTowers.splice(i, 1);
                continue;
            }

            // 注入敌人列表
            tower.enemyList = this._enemyList;

            // 执行防御塔每帧逻辑（冷却计时、目标有效性检查）
            tower.update(dt);

            // 尝试攻击
            tower.tryAttack();
        }
    }

    // ==================== 重置 ====================

    /**
     * 重置管理器（回收所有防御塔、清空状态）
     */
    public reset(): void {
        this.sellAll();
        this._towerContainer = null;
        this._gridSize = 64;
        this._mapOffsetX = 0;
        this._mapOffsetY = 0;
        this._enemyList = [];
        this.onTowerSold = null;
        this.onTowerUpgraded = null;
    }
}

/** 全局防御塔管理器单例 */
export const towerManager = new TowerManager(towerFactory);
