import { _decorator, Slider, EventTouch } from "cc";
const { ccclass, property, menu } = _decorator;

@ccclass
@menu("添加 UI 组件/SliderPlus")
export class SliderPlus extends Slider {

  @property({
    tooltip: "是否忽视触摸取消事件"
  })
  ignoreTouchCancel: boolean = true;

  protected _onTouchCancelled(event: EventTouch) {
    if (this.ignoreTouchCancel) return;
    
    (this as any)["_dragging"] = false;
    event.propagationStopped = true;
  }
}