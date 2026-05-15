import { _decorator, Component, Node } from "cc";
const { ccclass, menu, property } = _decorator;

@ccclass
@menu("prefab/SplashUIPrefab")
export class SplashUIPrefab extends Component {

    @property(Node)
    logo: Node = null;

    onLoad() {
        // 将logo设置到屏幕外
        if (this.logo) {
            this.logo.x = -1250;
        }
    }

    start() {

    }
}
