import { _decorator, Component, Node, ProgressBar } from "cc";
const { ccclass, menu, property } = _decorator;

@ccclass
@menu("prefab/LoadingUIPrefab")
export class LoadingUIPrefab extends Component {

    @property(Node)
    bg: Node = null;

    @property(Node)
    progressBar: ProgressBar = null;

    setLoadingProgress(val: number) {
        this.progressBar.progress = val;
        console.log('setLoadingProgress val = ' + val);
    }
}
