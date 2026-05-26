// 子弹工厂类
// 负责子弹实体的创建与回收，通过 NodePools 管理 Cocos Node 对象池

import { Prefab, Node } from 'cc';
import { BulletBase } from './BulletBase';
import { BulletStar } from './BulletStar';
import { BulletBlueStar } from './BulletBlueStar';
import { BulletRocket } from './BulletRocket';
import { BulletPin } from './BulletPin';
import { BulletAnchor } from './BulletAnchor';
import { BulletLittleAnchor } from './BulletLittleAnchor';
import { nodePools, NodeType } from '../../../../framework/pool/NodePools';

/** 子弹类型枚举（值从 100 起，避免与 NodeType 冲突） */
export enum BulletType {
    /** 星星子弹 */
    Star = 100,
    /** 蓝星子弹 */
    BlueStar = 101,
    /** 火箭子弹 */
    Rocket = 102,
    /** 毒针子弹 */
    Pin = 103,
    /** 船锚子弹 */
    Anchor = 104,
    /** 小锚子弹 */
    LittleAnchor = 105,
}

/** 子弹类型 → 子弹类构造器映射表 */
const bulletClassMap: Record<BulletType, new () => BulletBase> = {
    [BulletType.Star]: BulletStar,
    [BulletType.BlueStar]: BulletBlueStar,
    [BulletType.Rocket]: BulletRocket,
    [BulletType.Pin]: BulletPin,
    [BulletType.Anchor]: BulletAnchor,
    [BulletType.LittleAnchor]: BulletLittleAnchor,
};

export class BulletFactory {

    /**
     * 设置指定子弹类型对应的 Prefab
     * @param type 子弹类型
     * @param prefab Cocos Prefab 资源
     */
    public setTypePrefab(type: BulletType, prefab: Prefab): void {
        nodePools.setTypePrefab(type as unknown as NodeType, prefab);
    }

    /**
     * 获取指定子弹类型对应的 Prefab
     * @param type 子弹类型
     * @returns 对应的 Prefab，未设置时返回 null
     */
    public getTypePrefab(type: BulletType): Prefab | null {
        return nodePools.getTypePrefab(type as unknown as NodeType) || null;
    }

    /**
     * 创建指定类型的子弹实体
     * 从 NodePools 获取/实例化节点，创建 BulletBase 子类实例并绑定
     *
     * @param type 子弹类型
     * @returns 子弹实体，创建失败返回 null
     */
    public createBullet(type: BulletType): BulletBase | null {
        const BulletClass = bulletClassMap[type];
        if (!BulletClass) {
            return null;
        }

        const node = nodePools.getUnusedNd(type as unknown as NodeType);
        if (!node) {
            return null;
        }

        const bullet = new BulletClass();
        bullet.init(node);
        return bullet;
    }

    /**
     * 回收子弹实体到对象池
     * 先调用子弹的 recycle() 清理状态，再将节点归还 NodePools
     *
     * @param bullet 要回收的子弹实体
     */
    public recycleBullet(bullet: BulletBase): void {
        if (!bullet) return;

        const node = bullet.node;
        if (!node) return;

        // 回收子弹逻辑状态（同时将 bullet.node 置为 null）
        bullet.recycle();

        // 将节点归还对象池
        nodePools.putUnusedNd(node);
    }
}

/** 全局子弹工厂单例 */
export const bulletFactory = new BulletFactory();
