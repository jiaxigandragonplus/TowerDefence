import { stageMgr } from "./StageMgr";

export abstract class Stage {
    // 请求进入该场景
    enter() {
        stageMgr.enter(this);
        this.onEnter();
    }

    // 请求离开该场景
    leave() {
        stageMgr.leave(this);
        this.onLeave();
    }

    // 子类实现请求进入场景具体动作
    protected abstract onEnter();
    // 子类实现请求离开场景具体动作
    protected abstract onLeave();
}
