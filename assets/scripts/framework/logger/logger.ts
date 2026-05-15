// 用法：
// import { Logger } from "./base/logger";
// const log = new Logger("logName");
// log.info("xxx");
//
// 需要在 localstorage 里设置 LogNss 和 LogLvl 才会有日志输出：
// LogNss 用于配置哪些日志需要输出，*表示全部输出，logName 表示只输出名字为"logName"的日志实例的输出；
// LogLvl 用于配置输出输出等级，默认从 silly 等级开始输出，即全部输出。

import { sys } from 'cc';

// 日志输出等级
export enum LogLevel {
    silly,
    debug,
    verbose,
    info,
    warn,
    error
}

// 日志设置实例
class LoggerSetting {
    constructor() {
        let namespaces: string = sys.localStorage.getItem("LogNss");
        if (namespaces == null) {
            namespaces = "*";
            sys.localStorage.setItem("LogNss", namespaces);
        }
        let strLogLevel: string = sys.localStorage.getItem("LogLvl");
        if (strLogLevel == null) {
            strLogLevel = "silly"
            sys.localStorage.setItem("LogLvl", strLogLevel);
        }
        this.logLevel = LogLevel[strLogLevel || "silly"];
        this.parse(namespaces);
    }

    check(namespace): boolean {
        if (namespace[namespace.length - 1] === '*') {
            return true;
        }
        var i, len;
        for (i = 0, len = this.skips.length; i < len; i++) {
            if (this.skips[i].test(namespace)) {
                return false;
            }
        }
        for (i = 0, len = this.names.length; i < len; i++) {
            if (this.names[i].test(namespace)) {
                return true;
            }
        }
        return false;
    }

    getLogLevel(): LogLevel {
        return this.logLevel;
    }

    private parse(namespaces: string) {
        this.namespaces = namespaces;

        this.names = [];
        this.skips = [];

        var i;
        var split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
        var len = split.length;

        for (i = 0; i < len; i++) {
            if (!split[i]) continue; // ignore empty strings
            namespaces = split[i].replace(/\*/g, ".*?");
            if (namespaces[0] === '-') {
                this.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
            } else {
                this.names.push(new RegExp('^' + namespaces + '$'));
            }
        }
    }

    private logLevel: LogLevel;
    private namespaces: string;
    private names: RegExp[];
    private skips: RegExp[];
}

// 日志类
export class Logger {
    constructor(name: string) {
        this.name = name;
        this.enable = Logger.setting.check(this.name);
        this.setLevel(Logger.setting.getLogLevel());
    }

    setLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    silly(format, ...args): void {
        if (!this.shouldOutput(LogLevel.silly)) {
            return;
        }
        args.unshift(format);
        console.log.apply(console, args);
    }

    debug(format, ...args): void {
        if (!this.shouldOutput(LogLevel.silly)) {
            return;
        }
        args.unshift(format);
        console.log.apply(console, args);
    }

    verbose(format, ...args): void {
        if (!this.shouldOutput(LogLevel.silly)) {
            return;
        }
        args.unshift(format);
        console.log.apply(console, args);
    }

    info(format, ...args): void {
        if (!this.shouldOutput(LogLevel.info)) {
            return;
        }
        args.unshift(format);
        console.info.apply(console, args);
    }

    warn(format, ...args): void {
        if (!this.shouldOutput(LogLevel.warn)) {
            return;
        }
        args.unshift(format);
        console.warn.apply(console, args);
    }

    error(format, ...args): void {
        if (!this.shouldOutput(LogLevel.error)) {
            return;
        }
        args.unshift(format);
        console.error.apply(console, args);
    }

    private shouldOutput(level: LogLevel) {
        return (this.enable === true && this.logLevel <= level);
    }

    private name: string;
    private enable: boolean;
    private logLevel: LogLevel;
    private static setting: LoggerSetting = new LoggerSetting();
}
