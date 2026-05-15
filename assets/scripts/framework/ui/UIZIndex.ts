import { Component, _decorator } from "cc";

const { ccclass, property, menu } = _decorator;

@ccclass
@menu("ig/all-stage/UIZIndex")
export class UIZIndex extends Component {
    @property
    layer: number = 0;

    @property
    localZIndex: number = 0;
}
