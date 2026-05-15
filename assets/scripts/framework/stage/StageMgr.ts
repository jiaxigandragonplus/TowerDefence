import { Stage } from "./Stage";

// 同时只允许一个stage存在，进入一个stage自动退出上一个stage
class StageMgr {
    enter(stage: Stage) {
        if (this.currentStage != null) {
            this.currentStage.leave();
        }
        this.currentStage = stage;
    }

    leave(stage: Stage): boolean {
        if (this.currentStage != stage) {
            return false;
        }
        this.currentStage = null;
    }

    getCurrentStage(): Stage {
        return this.currentStage;
    }

    private currentStage: Stage;
}

export let stageMgr = new StageMgr();
