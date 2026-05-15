import { Stage } from "../../../framework/stage/Stage";
import { Logger } from "../../../framework/logger/Logger";
import { gameStage } from "../game/GameStage";
const log = new Logger("launch");

class LaunchStage extends Stage {
  protected onEnter() {
    log.info("on request enter launch stage.");
    gameStage.enter();
  }
  protected onLeave() {
    log.info("on request leave launch stage.");
    log.info("TODO: clean launch stage. ");
  }
}

export const launchStage = new LaunchStage();