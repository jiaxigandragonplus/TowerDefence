// 碰撞检测管理
// 负责每帧检测子弹与怪物、子弹与障碍物之间的碰撞
// 使用简单的圆形碰撞（距离判断），性能优先后续可扩展为四叉树

import { Vec3 } from 'cc';
import { MonsterBase } from "./monster/MonsterBase";
import { BarrierBase } from "./barrier/BarrierBase";
import { BulletBase } from "./bullet/BulletBase";
import { BulletEffect } from "./bullet/BulletBase";

/** 碰撞结果 */
export interface CollisionResult {
    /** 碰撞的子弹 */
    bullet: BulletBase;
    /** 碰撞的怪物（可为 null） */
    monster: MonsterBase | null;
    /** 碰撞的障碍物（可为 null） */
    barrier: BarrierBase | null;
    /** 碰撞点世界坐标 */
    hitPoint: Vec3;
}

class CollisionManager {
    /** 怪物碰撞半径（像素） */
    public monsterRadius: number = 25;

    /** 子弹碰撞半径（像素） */
    public bulletRadius: number = 10;

    /** 障碍物碰撞半径偏移（像素），在半格基础上额外扩展 */
    public barrierRadiusOffset: number = 5;

    /** 每帧碰撞结果（供外部消费） */
    public collisionResults: CollisionResult[] = [];

    /**
     * 每帧执行碰撞检测
     * @param bulletVec 活跃子弹列表
     * @param monsterVec 活跃怪物列表
     * @param barrierVec 活跃障碍物列表
     * @param gridSize 地图格子大小（像素），用于计算障碍物半径
     */
    public collision(
        bulletVec: BulletBase[],
        monsterVec: MonsterBase[],
        barrierVec: BarrierBase[],
        gridSize: number = 64,
    ): void {
        this.collisionResults = [];

        for (let i = bulletVec.length - 1; i >= 0; i--) {
            const bullet = bulletVec[i];
            if (!bullet.isActive || bullet.isDead) continue;

            const bulletPos = bullet.worldPosition;

            // 检测每个子弹与怪物之间的碰撞
            let hitSomething = false;
            for (let j = 0; j < monsterVec.length; j++) {
                const monster = monsterVec[j];
                if (!monster.isActive || monster.isDead) continue;

                if (this.checkBulletMonsterCollision(bullet, monster)) {
                    const result: CollisionResult = {
                        bullet: bullet,
                        monster: monster,
                        barrier: null,
                        hitPoint: monster.worldPosition.clone(),
                    };
                    this.collisionResults.push(result);

                    // 处理子弹命中
                    hitSomething = !bullet.onHit();
                    break; // 默认每个子弹只命中一个怪物（穿透型除外）
                }
            }

            // 如果子弹未命中怪物（或穿透型），检测与障碍物的碰撞
            if (!hitSomething) {
                for (let k = 0; k < barrierVec.length; k++) {
                    const barrier = barrierVec[k];
                    if (!barrier.isActive || barrier.isDead) continue;

                    if (this.checkBulletBarrierCollision(bullet, barrier, gridSize)) {
                        const result: CollisionResult = {
                            bullet: bullet,
                            monster: null,
                            barrier: barrier,
                            hitPoint: barrier.worldPosition.clone(),
                        };
                        this.collisionResults.push(result);
                        bullet.onHit();
                        break;
                    }
                }
            }
        }
    }

    /**
     * 检测子弹与怪物的圆形碰撞
     */
    private checkBulletMonsterCollision(
        bullet: BulletBase,
        monster: MonsterBase,
    ): boolean {
        const bulletPos = bullet.worldPosition;
        const monsterPos = monster.worldPosition;
        const distance = Vec3.distance(bulletPos, monsterPos);
        const hitRadius = this.bulletRadius + this.monsterRadius;
        return distance <= hitRadius;
    }

    /**
     * 检测子弹与障碍物的碰撞
     * 障碍物使用方形区域判断，障碍物中心位于格子中心
     */
    private checkBulletBarrierCollision(
        bullet: BulletBase,
        barrier: BarrierBase,
        gridSize: number,
    ): boolean {
        const bulletPos = bullet.worldPosition;
        const barrierPos = barrier.worldPosition;

        // 障碍物半尺寸（以格子大小计算）
        const halfSize = (gridSize * barrier.size) / 2 + this.barrierRadiusOffset;

        // 方形碰撞检测
        const dx = Math.abs(bulletPos.x - barrierPos.x);
        const dy = Math.abs(bulletPos.y - barrierPos.y);

        return dx <= halfSize && dy <= halfSize;
    }

    /**
     * 实用方法：检测两点之间的圆形碰撞
     */
    static circleCollision(
        posA: Vec3,
        radiusA: number,
        posB: Vec3,
        radiusB: number,
    ): boolean {
        const distance = Vec3.distance(posA, posB);
        return distance <= (radiusA + radiusB);
    }

    /**
     * 实用方法：检测点是否在矩形区域内
     */
    static pointInRect(
        point: Vec3,
        rectCenter: Vec3,
        halfWidth: number,
        halfHeight: number,
    ): boolean {
        const dx = Math.abs(point.x - rectCenter.x);
        const dy = Math.abs(point.y - rectCenter.y);
        return dx <= halfWidth && dy <= halfHeight;
    }
}

export const collisionManager = new CollisionManager();
