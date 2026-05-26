// 障碍物管理
// 负责活跃障碍物追踪、坐标转换（格子 ↔ 世界）、批量创建/回收、每帧更新

import { Node, Vec3 } from 'cc';
import { BarrierBase, BarrierType } from "./BarrierBase";
import { BarrierFactory } from "./BarrierFactory";
import { Utility } from "../../../../framework/utils/Utility";
import { Logger } from "../../../../framework/logger/Logger";

const log = new Logger("barrier-manager");

/** 障碍物创建请求 */
export interface BarrierSpawnRequest {
    /** 模板 ID（对应 Barrier.csv 的 Id） */
    templateId: number;
    /** 障碍物类型 */
    type?: BarrierType;
    /** 格子列坐标 */
    gridX: number;
    /** 格子行坐标 */
    gridY: number;
    /** 占据格子数 */
    size?: number;
    /** 是否可被摧毁 */
    destructible?: boolean;
}

export class BarrierManager {
    /** 障碍物工厂引用 */
    private _factory: BarrierFactory;

    /** 活跃障碍物列表（供碰撞检测等外部使用） */
    private _activeBarriers: BarrierBase[] = [];

    /** 地图格子大小（像素），默认 64 */
    private _gridSize: number = 64;

    /** 地图偏移（格子的世界坐标原点） */
    private _mapOffsetX: number = 0;
    private _mapOffsetY: number = 0;

    /** 障碍物容器节点 */
    private _barrierContainer: Node | null = null;

    /** 销毁障碍物时的事件回调 */
    public onBarrierDestroyed: ((barrier: BarrierBase) => void) | null = null;

    constructor(factory: BarrierFactory) {
        this._factory = factory;
    }

    // ==================== 活跃列表访问 ====================

    /** 获取活跃障碍物列表 */
    get activeBarriers(): ReadonlyArray<BarrierBase> {
        return this._activeBarriers;
    }

    /** 活跃障碍物数量 */
    get activeCount(): number {
        return this._activeBarriers.length;
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
     * 设置障碍物的容器节点（所有障碍物节点将挂在该节点下）
     * @param container 容器节点
     */
    public setBarrierContainer(container: Node): void {
        this._barrierContainer = container;
    }

    // ==================== 障碍物创建 ====================

    /**
     * 创建单个障碍物
     * @param request 创建请求
     * @returns 创建的障碍物实例，失败返回 null
     */
    public spawnBarrier(request: BarrierSpawnRequest): BarrierBase | null {
        const barrier = this._factory.create(
            request.templateId,
            request.gridX,
            request.gridY,
            request.type ?? BarrierType.Normal,
            request.size ?? 1,
            request.destructible ?? true,
        );

        if (!barrier) {
            log.warn(`failed to spawn barrier: templateId=${request.templateId}`);
            return null;
        }

        // 设置障碍物世界位置
        const worldPos = this.gridToWorld(request.gridX, request.gridY);
        if (barrier.node && barrier.node.isValid) {
            barrier.node.setWorldPosition(worldPos);
        } else if (this._barrierContainer) {
            // 如果还没有绑定 node，创建一个新的 node 并挂到容器下
            const node = new Node(`Barrier_${barrier.id}`);
            barrier.init(node);
            this._barrierContainer.addChild(node);
            node.setWorldPosition(worldPos);
        }

        // 监听障碍物摧毁事件
        barrier.on('destroyed', () => {
            this.onBarrierDestroyedInternal(barrier);
        });

        this._activeBarriers.push(barrier);
        return barrier;
    }

    /**
     * 批量创建障碍物
     * @param requests 创建请求列表
     * @returns 成功创建的障碍物列表
     */
    public spawnBarriers(requests: BarrierSpawnRequest[]): BarrierBase[] {
        const created: BarrierBase[] = [];
        for (const req of requests) {
            const barrier = this.spawnBarrier(req);
            if (barrier) {
                created.push(barrier);
            }
        }
        return created;
    }

    /**
     * 从 TMX 地图数据或预置的位置数据批量创建障碍物
     * @param placements { [gridKey: string]: templateId } 格式，如 "3,5": 1
     */
    public spawnFromPlacements(placements: { [gridKey: string]: number }): BarrierBase[] {
        const requests: BarrierSpawnRequest[] = [];
        for (const key in placements) {
            const [x, y] = key.split(',').map(Number);
            const templateId = placements[key];
            requests.push({ templateId, gridX: x, gridY: y });
        }
        return this.spawnBarriers(requests);
    }

    // ==================== 障碍物回收 ====================

    /**
     * 回收单个障碍物（从活跃列表移除并回收到对象池）
     * @param barrier 要回收的障碍物
     */
    public recycleBarrier(barrier: BarrierBase): void {
        if (!barrier) return;
        Utility.removeFromArray(this._activeBarriers, barrier);
        this._factory.recycle(barrier);
    }

    /**
     * 回收所有活跃障碍物
     */
    public recycleAll(): void {
        // 倒序遍历避免索引问题
        for (let i = this._activeBarriers.length - 1; i >= 0; i--) {
            this._factory.recycle(this._activeBarriers[i]);
        }
        this._activeBarriers.length = 0;
    }

    /**
     * 移除并回收某个格子上的障碍物
     * @param gridX 格子列
     * @param gridY 格子行
     * @returns 是否找到并回收
     */
    public removeBarrierAt(gridX: number, gridY: number): boolean {
        for (let i = this._activeBarriers.length - 1; i >= 0; i--) {
            const barrier = this._activeBarriers[i];
            if (barrier.gridX === gridX && barrier.gridY === gridY) {
                this._factory.recycle(barrier);
                Utility.removeFromArray(this._activeBarriers, barrier);
                return true;
            }
        }
        return false;
    }

    /**
     * 检查指定格子是否被障碍物占据
     * @param gridX 格子列
     * @param gridY 格子行
     */
    public isGridBlocked(gridX: number, gridY: number): boolean {
        return this.getBarrierAt(gridX, gridY) !== null;
    }

    /**
     * 获取指定格子上的障碍物
     * @param gridX 格子列
     * @param gridY 格子行
     */
    public getBarrierAt(gridX: number, gridY: number): BarrierBase | null {
        for (const barrier of this._activeBarriers) {
            if (!barrier.isActive || barrier.isDead) continue;
            // 检查是否在障碍物占据的格子范围内
            if (
                gridX >= barrier.gridX &&
                gridX < barrier.gridX + barrier.size &&
                gridY >= barrier.gridY &&
                gridY < barrier.gridY + barrier.size
            ) {
                return barrier;
            }
        }
        return null;
    }

    // ==================== 障碍物摧毁内部处理 ====================

    /**
     * 障碍物被摧毁时的内部处理
     */
    private onBarrierDestroyedInternal(barrier: BarrierBase): void {
        log.info(`barrier destroyed: id=${barrier.id}, grid=(${barrier.gridX},${barrier.gridY})`);

        // 外部回调
        if (this.onBarrierDestroyed) {
            this.onBarrierDestroyed(barrier);
        }
    }

    // ==================== 每帧更新 ====================

    /**
     * 每帧更新所有活跃障碍物
     * @param dt 帧间隔时间（秒）
     */
    public update(dt: number): void {
        for (let i = this._activeBarriers.length - 1; i >= 0; i--) {
            const barrier = this._activeBarriers[i];
            if (!barrier.isActive) continue;

            barrier.update(dt);

            // 已被摧毁且非活跃状态：回收
            if (barrier.isDead && !barrier.isActive) {
                this._factory.recycle(barrier);
                Utility.removeFromArray(this._activeBarriers, barrier);
            }
        }
    }

    /**
     * 清理所有被摧毁的障碍物（主动调用回收）
     */
    public cleanDestroyed(): void {
        for (let i = this._activeBarriers.length - 1; i >= 0; i--) {
            const barrier = this._activeBarriers[i];
            if (barrier.isDead) {
                this._factory.recycle(barrier);
                Utility.removeFromArray(this._activeBarriers, barrier);
            }
        }
    }

    // ==================== 重置 ====================

    /**
     * 重置管理器（回收所有障碍物、清空状态）
     */
    public reset(): void {
        this.recycleAll();
        this._barrierContainer = null;
        this._gridSize = 64;
        this._mapOffsetX = 0;
        this._mapOffsetY = 0;
        this.onBarrierDestroyed = null;
    }
}
