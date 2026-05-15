import { _decorator, Component, Label } from "cc";
import { Logger } from "../../../framework/logger/Logger";

const log = new Logger('TypingLabel')

const { ccclass, property, menu, requireComponent } = _decorator;
@ccclass
@menu("ig/all-stage/TypingLabel")
@requireComponent(Label)
export class TypingLabel extends Component {
    @property({
        tooltip: "每个字符显示的时间间隔，对这个值赋值不会马上生效"
    })
    typingSpace: number = 0.05;

    get string() {
        return this.mString;
    }

    set string(value: string) {
        this.mString = value;
        this.resetTypingData();
        this.stopSchedule();
        this.startSchedule();
    }

    get isComplete() {
        return this.label.string.length >= this.mString.length;
    }

    skipTyping() {
        this.stopSchedule();
        this.label.string = this.mString;
        this.node.emit("typingcomplete", this);
    }

    private stopSchedule() {
        this.unscheduleAllCallbacks();
    }

    private startSchedule() {
        this.schedule(() => {
            this.label.string += this.mString[this.typingIndex++];
            if (this.label.string.length >= this.mString.length) {
                this.node.emit("typingcomplete", this);
                this.stopSchedule();
            }
        }, this.typingSpace);
    }

    private resetTypingData() {
        this.label.string = "";
        this.typingIndex = 0;
    }

    private get label(): Label { if (!this.mLabel) this.mLabel = this.getComponent(Label); return this.mLabel; }
    private mLabel: Label;
    private mString: string;
    private typingIndex: number;
}
