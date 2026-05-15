import { _decorator, Component } from "cc";
import { Logger } from "../logger/Logger";

const log = new Logger("AudioSetting");
const { ccclass, property, menu } = _decorator;

@ccclass
@menu("ig/all-stage/AudioSetting")
export default class AudioSetting extends Component {
    @property({
        tooltip: "淡入时间，单位秒"
    })
    easeIn: number = 0;

    @property({
        tooltip: "淡出时间，单位秒"
    })
    easeOut: number = 0;

    @property({
        tooltip: "强制播放时间，单位秒，目的是指定时间长度后结束循环音频"
    })
    duration: number = 0;
}
