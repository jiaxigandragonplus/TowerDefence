import { Logger } from "../../../framework/logger/Logger";
import { Stage } from "../../../framework/stage/Stage";
import { viewMain } from "../ViewMain";
const log = new Logger("game");

class GameStage extends Stage {
	//onEnter的时候应该尽可能快开始显示
	protected onEnter() {
		log.info("on request enter game stage.");
		viewMain.events.emit("BeforeSceneUnload");
		setTimeout(() => {
			viewMain.events.emit("AfterSceneLoaded");
			log.info("game scene loaded.");
			this.onSceneShown();
		}, 0);
	}
	
	protected onLeave() {
		log.info("on request leave game stage.");
		log.info("TODO: clean game stage. ");
	}

	private onSceneShown() {
		this.showMainUI();
	}

	//显示主界面
	private showMainUI() {
		log.info("show main ui.");    
	}
}

export const gameStage = new GameStage();