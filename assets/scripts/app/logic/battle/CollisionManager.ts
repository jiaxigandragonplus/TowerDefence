// 碰撞检测管理

import { MonsterBase } from "./monster/MonsterBase";
import { BarrierBase } from "./barrier/BarrierBase";
import { BulletBase } from "./bullet/BulletBase";

class CollisionManager { 
    public collision(bulletVec: BulletBase[], monsterVec: MonsterBase[], barrierVec: BarrierBase[]) {
        // 检测每一个子弹与怪物和障碍物之间的碰撞
        for (let i = 0; i < bulletVec.length; i++) {
            let bullet = bulletVec[i];
            this.collisionBulletMonster(bullet, monsterVec);
            this.collisionBulletBarrier(bullet, barrierVec);
        }
    }

    private collisionBulletMonster(bullet: BulletBase, monsterVec: MonsterBase[]) {

    }

    private collisionBulletBarrier(bullet: BulletBase, barrierVec: BarrierBase[]) {

    }
}

export const collisionManager = new CollisionManager();