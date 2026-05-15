import { Logger } from "../logger/logger";

const log = new Logger("utility");

export class Utility {
    // 从数组中移除制定元素
    static removeFromArray<T>(array: T[], elem: T) {
        const index = array.indexOf(elem);
        if (index < 0) {
            return;
        }
        array.splice(index, 1);
    }

    // 往数组指定位置插入元素
    static insertToArray<T>(array: T[], index: number, elem: T) {
        array.splice(index, 0, elem);
    }

    // 设置背景大小，适配不同分辨率
    static adaptUI(bg: cc.Node) {
        // 调整分辨率
        let nodeSize = bg.getContentSize();
        let _rateR = nodeSize.height / nodeSize.width;
        let _rateV = cc.winSize.height / cc.winSize.width;

        if (_rateV > _rateR) {
            // 适配宽度
            bg.width = cc.winSize.width;
            bg.height = cc.winSize.height * (cc.winSize.width / nodeSize.width);
        }
        else {
            // 适配高度
            bg.height = cc.winSize.height;
            bg.width = cc.winSize.width * (cc.winSize.height / nodeSize.height);
        }
    }

    // 递归查找子节点
    static deepFind(nodeName: string, referenceNode?: cc.Node): cc.Node {
        if (referenceNode == null) {
            referenceNode = cc.director.getScene();
        }
        if (referenceNode.name === nodeName) {
            return referenceNode;
        }
        for (let i = 0; i < referenceNode.children.length; ++i) {
            const target = this.deepFind(nodeName, referenceNode.children[i]);
            if (target) {
                return target;
            }
        }
        return null;
    }

    // range: [min, max)
    static randomNumber(min: number, max: number): number {
        let delta = max - min;
        return min + Math.floor(Math.random() * delta);
    }

    // range: [min, max)
    static randomFloat(min: number, max: number): number {
        let delta = max - min;
        return min + Math.random() * delta;
    }

    // 生成随机串
    static randomString(len: number, charSet?: string) {
        charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let randomString = '';
        for (let i = 0; i < len; i++) {
            let randomPoz = Math.floor(Math.random() * charSet.length);
            randomString += charSet.substring(randomPoz, randomPoz + 1);
        }
        return randomString;
    }

    // 遍历枚举的所有成员名称
    static forEachEnumMemName(enumType: any, callback: (enumName: string) => void) {
        for (let enumMember in enumType) {
            if (isNaN(Number(enumMember))) {
                callback(enumMember);
            }
        }
    }

    // 遍历枚举的所有成员值
    static forEachEnumMemValue(enumType: any, callback: (enumValue: number) => void) {
        for (let enumMember in enumType) {
            const value = Number(enumMember);
            if (!isNaN(value)) {
                callback(value);
            }
        }
    }

    //格式化数值，显示k(千)、m(百万)、b(十亿)、t(万亿)
    static formatNumber(num: number, numberInitial?: string[]): string {
        let postfix = numberInitial || ["T", "B", "M", "K"];
        let trillion = 1e12;
        let billion = 1e9;
        let million = 1e6;
        let thousand = 1e3;
        if (num >= trillion) {
            return (num / trillion).toFixed(3) + postfix[0];
        }
        else if (num >= billion) {
            return (num / billion).toFixed(3) + postfix[1];
        }
        else if (num >= million) {
            return (num / million).toFixed(3) + postfix[2];
        }
        else if (num >= thousand) {
            return (num / thousand).toFixed(3) + postfix[3];
        }
        else {
            return num.toString();
        }
    }

    // timeInitial是一个长度为4的字符串数组，表示日、时、分、秒，如[d, h, m, s]
    static formatTimeWithInitial(seconds: number, timeInitial?: string[]): string {
        let postfix = timeInitial || ['Day', 'Hour', 'Min', 'Sec'];

        if (seconds <= 0) {
            return '00' + postfix[3];
        }
        let days = Math.floor(seconds / 86400);
        seconds = seconds % 86400;
        let hours = Math.floor(seconds / 3600);
        seconds = seconds % 3600;
        let mins = Math.floor(seconds / 60);
        let secs = seconds % 60;

        let leftTimeArray = [days, hours, mins, secs];

        while (leftTimeArray != null && leftTimeArray.length > 0 &&
            (leftTimeArray[0] == null || leftTimeArray[0] == 0)
        ) {
            postfix.shift();
            leftTimeArray.shift();
        }

        let leftTimes = leftTimeArray.map(function (time, index) {
            if (time < 0) {
                return '';
            }
            return (time < 10 ? '0' + time : time) + postfix[index];
        });

        return leftTimes.join(' ');
    };

    // 如果时间小于一天会显示为00:00:00的样子，如果大于1天会显示为1Day1Hour
    static formatTimeAsRemainTime(seconds: number) {
        const days = Math.floor(seconds / 86400);
        if (days > 0) {
            seconds = seconds % 86400;
            let hours = Math.floor(seconds / 3600);
            return days + 'Day ' + hours + 'Hour';
        }
        else
            return this.formatTimeWithColon(seconds, 2);
    }

    // 将时间转换为00:00或00:00:00的字符串
    static formatTimeWithColon(seconds: number, colonNum: 1 | 2): string {
        let days = Math.floor(seconds / 86400);
        seconds = seconds % 86400;
        let hours = Math.floor(seconds / 3600);
        seconds = seconds % 3600;
        let mins = Math.floor(seconds / 60);
        let secs = seconds % 60;
        if (colonNum === 1) {
            return `${days * 1440 + hours * 60 + mins}:${secs}`;
        }
        if (colonNum === 2) {
            return `${days * 24 + hours}:${mins}:${secs}`;
        }
    }

    //将秒数格式化为“多久以前”，如：“1分钟以前”，“5天前”
    static formmatTimePast(seconds: number): string {
        //TODO: implemente it
        return seconds.toString();
    }

    //浮点数约等于
    static floatApproximatelyEquals(a: number, b: number, e: number = 0.0001) {
        return Math.abs(a - b) < e;
    }

    //修改对象中的一个属性，如果有传入变化量则验证变化量
    static modifyObjectNumProp(obj: any, propName: string, final: number, delta?: number) {
        if (!obj.hasOwnProperty(propName)) {
            log.warn(`modifyObjectNumProp: ${obj} has not own property ${propName}`);
            return;
        }
        if (delta != null) {
            if ((obj[propName] + delta) != final) {
                log.warn(`modifyObjectNumProp: current value add delta does not equals final,
          ${obj} current ${propName} = ${obj[propName]}, 
          delta = ${final}, final = ${final}`);
            }
        }
        obj[propName] = final;
    }

    //判断一个点是否在一个盒子内
    static pointInBox(pointPos: cc.Vec2, boxMiddle: cc.Vec2, boxSize: cc.Size) {
        const offset = pointPos.sub(boxMiddle);
        return Math.abs(offset.x) < boxSize.width / 2 && Math.abs(offset.y) < boxSize.height / 2;
    }

    //判断一个点是否在一个圆内
    static pointInCircle(pointPos: cc.Vec2, circleCenter: cc.Vec2, circleRadius: number) {
        const offset = pointPos.sub(circleCenter);
        return offset.mag() < circleRadius;
    }

    static sampleAnim(anim: cc.Animation, animName: string, time: number) {
        anim.play(animName);
        anim.stop();
        anim.setCurrentTime(time, animName);
        anim.sample(animName);
    }

    static getWorldPositionOfNode(node: cc.Node) {
        if (node.getParent())
            return node.getParent().convertToWorldSpaceAR(node.position);
        else
            return node.position;
    }

    //这里的设置anchor是类似Unity只有节点原点会移动，而不是cocos那种只有框和锚点在动
    static setAnchorPointInPointsAR(node: cc.Node, point: cc.Vec2) {
        const ap = node.getAnchorPoint();
        const arPoint = cc.v2(node.width * ap.x, node.height * ap.y);
        const pointWithoutAR = arPoint.add(point);
        Utility.setAnchorPointInPoints(node, pointWithoutAR);
    }

    //这里的设置anchor是类似Unity只有节点原点会移动，而不是cocos那种只有框和锚点在动
    static setAnchorPointInPoints(node: cc.Node, point: cc.Vec2) {
        let aX, aY = 0;
        if (point.x <= 0 || node.width === 0) aX = 0;
        else if (point.x >= node.width) aX = 1;
        else aX = point.x / node.width;

        if (point.y <= 0 || node.height === 0) aY = 0;
        else if (point.y >= node.height) aY = 1;
        else aY = point.y / node.height;

        Utility.setAnchorPoint(node, aX, aY);
    }

    //这里的设置anchor是类似Unity只有节点原点会移动
    static setAnchorPoint(node: cc.Node, aX: number, aY: number) {
        if (aX < 0) aX = 0;
        else if (aX > 1) aX = 1;

        if (aY < 0) aY = 0;
        else if (aY > 1) aY = 1;

        const childOffset = cc.v2(node.width * node.anchorX - node.width * aX, node.height * node.anchorY - node.height * aY);
        const children = node.children;
        children.forEach(value => {
            value.position = value.position.add(childOffset);
        });
        const nodeOffset = cc.v2(-childOffset.x * node.scaleX, -childOffset.y * node.scaleY);
        node.position = node.position.add(nodeOffset);
    }

    //获得半径为1的单位圆中的任意一点
    static getRandomInsideUnitSphere() {
        const angel = Utility.randomFloat(0, 360) / 180 * Math.PI;
        const r = Math.random();
        return cc.v2(Math.cos(angel) * r, Math.sin(angel) * r);
    }

    //返回带有商和余数的对象
    static divRem(a: number, b: number) {
        return {
            quotient: Math.floor(a / b),
            remainder: a % b,
        }
    }

    //将HtmlImageElement转为Base64编码
    static imageToBase64(img: HTMLImageElement, mimeType?: string) {
        // New Canvas
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        // Draw Image
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        // To Base64
        return canvas.toDataURL(mimeType);
    }
}

export type AsyncCallback = (err?: Error, ...args) => void;