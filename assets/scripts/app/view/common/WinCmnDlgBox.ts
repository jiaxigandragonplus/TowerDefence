import { _decorator, Component, Label, RichText, Node, Button } from "cc";
const { ccclass, property, menu } = _decorator;

@ccclass
@menu("ig/all-stage/Win_CmnDlgBox")
export default class Win_CmnDlgBox extends Component {
    @property({
        type: Label,
        tooltip: "标题标签"
    })
    title: Label = null;

    @property({
        type: RichText,
        tooltip: "内容标签"
    })
    content: RichText = null;

    @property({
        type: Node,
        tooltip: "全屏背景"
    })
    fullScreenBtn: Node = null;

    @property({
        type: Button,
        tooltip: "关闭按钮"
    })
    closeBtn: Button = null;

    @property({
        type: Button,
        tooltip: "第一个按钮"
    })
    firstBtn: Button = null;

    @property({
        type: Button,
        tooltip: "第二个按钮"
    })
    secondBtn: Button = null;

    @property({
        type: Button,
        tooltip: "第三个按钮"
    })
    thirdBtn: Button = null;
}
