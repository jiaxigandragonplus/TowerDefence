// 实体基类
// 所有地图对象（障碍物、怪物、防御塔、子弹）的顶层基类
// 提供 ID 生成、Cocos Node 绑定、位置、活跃状态及生命周期管理

import { Node, Vec3 } from 'cc';
import { EventEmitter } from "../../../framework/event/EventEmitter";

export class Entity extends EventEmitter {
    /** 全局唯一 ID 自增计数器 */
    private static _idCounter: number = 0;

    /** 实体唯一 ID */
    public readonly id: number;

    /** 关联的 Cocos Creator 节点 */
    public node: Node | null = null;

    /** 是否处于活跃状态 */
    protected _isActive: boolean = false;

    constructor() {
        super();
        this.id = ++Entity._idCounter;
    }

    // ==================== 活跃状态 ====================

    /** 实体是否活跃（节点存在且有效） */
    get isActive(): boolean {
        return this._isActive && this.node != null && this.node.isValid;
    }

    // ==================== 位置 ====================

    /** 获取本地坐标 */
    get position(): Vec3 {
        if (this.node && this.node.isValid) {
            return this.node.position.clone();
        }
        return new Vec3();
    }

    /** 设置本地坐标 */
    set position(pos: Vec3) {
        if (this.node && this.node.isValid) {
            this.node.setPosition(pos);
        }
    }

    /** 获取世界坐标 */
    get worldPosition(): Vec3 {
        if (this.node && this.node.isValid) {
            return this.node.worldPosition.clone();
        }
        return new Vec3();
    }

    // ==================== 生命周期 ====================

    /**
     * 初始化实体，绑定 Cocos Node
     * @param node Cocos Creator 节点
     */
    public init(node: Node): void {
        this.node = node;
        this._isActive = true;
    }

    /**
     * 每帧更新（由管理器驱动）
     * @param dt 帧间隔时间（秒）
     */
    public update(dt: number): void {
        // 子类重写实现具体逻辑
    }

    /**
     * 销毁实体，清理资源
     */
    public onDestroy(): void {
        this._isActive = false;
        this.node = null;
        this.removeAllListeners();
    }

    /**
     * 回收到对象池（与 onDestroy 等价，子类可按需重写）
     */
    public recycle(): void {
        this.onDestroy();
    }
}
