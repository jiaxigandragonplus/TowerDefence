import { _decorator, Component, Sprite, Label, Animation } from "cc";
const { ccclass, property, menu } = _decorator;

@ccclass
@menu("ig/all-stage/Win_Notice")
export default class Win_Notice extends Component {
    @property({
        type: Sprite,
        tooltip: "图标"
    })
    icon: Sprite = null;

    @property({
        type: Label,
        tooltip: "文本"
    })
    label: Label = null;

    @property({
        type: Animation,
        tooltip: "动画"
    })
    animation: Animation = null;

    setNumLabelWithAnim(from: number, to: number, animDuration: number) {
        this.unscheduleAllCallbacks();

        const self = this;
        const unit = (to - from) / animDuration;
        const updateLabel = function (deltaTime: number) {
            from += unit * deltaTime;
            self.label.string = Math.round(from).toString();
            if (from >= to) {
                self.unschedule(updateLabel);
            }
        }
        this.schedule(updateLabel, 0);
    }

    stopSchdule(functions: any) {
        this.unschedule(functions);
    }
}
