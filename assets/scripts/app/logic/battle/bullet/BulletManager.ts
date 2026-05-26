// 子弹管理类
// 负责每帧驱动所有活跃子弹的更新、回收已失效子弹
// 提供发射子弹、获取活跃子弹列表等接口供外部（碰撞检测、防御塔）使用

import { Vec3, Node } from 'cc';
import { BulletBase, BulletConfig } from './BulletBase';
import { BulletType, bulletFactory } from './BulletFactory';
import { MonsterBase } from '../monster/MonsterBase';

export class BulletManager {
    /** 当前活跃的子弹列表 */
    public activeBullets: BulletBase[] = [];

    /** 待删除的子弹列表（避免遍历时增删） */
    private _pendingRemove: BulletBase[] = [];

    /**
     * 发射子弹
     * 通过 BulletFactory 创建子弹实体，配置属性后发射
     *
     * @param type 子弹类型
     * @param config 子弹配置数据（伤害、速度、特效等）
     * @param startPos 发射起始位置（世界坐标）
     * @param direction 飞行方向（单位向量）
     * @param targetMonster 追踪目标（可选，追踪型子弹使用）
     * @returns 创建的子弹实体，发射失败返回 null
     */
    public launch(
        type: BulletType,
        config: BulletConfig,
        startPos: Vec3,
        direction: Vec3,
        targetMonster?: MonsterBase,
    ): BulletBase | null {
        const bullet = bulletFactory.createBullet(type);
        if (!bullet) {
            return null;
        }

        // 配置子弹属性
        bullet.initWithConfig(config);

        // 设置追踪目标（如果有）
        if (targetMonster) {
            bullet.setTarget(targetMonster);
        }

        // 发射
        bullet.launch(startPos, direction);

        // 加入活跃列表
        this.activeBullets.push(bullet);

        return bullet;
    }

    /**
     * 每帧更新所有活跃子弹
     * 1. 遍历所有子弹执行 update
     * 2. 收集已失效的子弹
     * 3. 回收已失效的子弹
     *
     * @param dt 帧间隔时间（秒）
     */
    public update(dt: number): void {
        // 遍历更新所有子弹
        for (let i = this.activeBullets.length - 1; i >= 0; i--) {
            const bullet = this.activeBullets[i];

            // 跳过无效子弹
            if (!bullet || !bullet.isActive) {
                this.activeBullets.splice(i, 1);
                continue;
            }

            // 执行子弹每帧逻辑（移动、追踪、超时检查）
            bullet.update(dt);

            // 标记失效子弹待回收
            if (bullet.isDead) {
                this._pendingRemove.push(bullet);
            }
        }

        // 回收已失效的子弹
        this.flushPendingRemove();
    }

    /**
     * 回收所有已标记为失效的子弹
     * 从活跃列表中移除，并通过工厂回收到对象池
     */
    private flushPendingRemove(): void {
        if (this._pendingRemove.length === 0) return;

        for (const bullet of this._pendingRemove) {
            // 从活跃列表中移除
            const index = this.activeBullets.indexOf(bullet);
            if (index >= 0) {
                this.activeBullets.splice(index, 1);
            }

            // 回收子弹
            bulletFactory.recycleBullet(bullet);
        }

        this._pendingRemove = [];
    }

    /**
     * 强制回收指定子弹
     *
     * @param bullet 要回收的子弹
     */
    public removeBullet(bullet: BulletBase): void {
        if (!bullet) return;

        const index = this.activeBullets.indexOf(bullet);
        if (index >= 0) {
            this.activeBullets.splice(index, 1);
        }

        bulletFactory.recycleBullet(bullet);
    }

    /**
     * 回收所有活跃子弹并清空列表
     * 用于关卡结束 / 场景切换
     */
    public clearAll(): void {
        for (const bullet of this.activeBullets) {
            bulletFactory.recycleBullet(bullet);
        }
        this.activeBullets = [];
        this._pendingRemove = [];
    }

    /**
     * 获取当前活跃子弹数量
     */
    public get bulletCount(): number {
        return this.activeBullets.length;
    }
}

/** 全局子弹管理器单例 */
export const bulletManager = new BulletManager();
