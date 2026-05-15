//import * as languageData from "../../../packages/i18n/runtime-scripts/LanguageData";
import { Logger } from "../logger/Logger";
import { sys } from "cc";

const log = new Logger("lang-setting");

export class LangSetting {
    static init() {
        const settingLang = this.getSettingLang();
        log.info("Lang: ", settingLang);
        // if (!languageData) {
        //   log.error("languageData is null.");
        //   return;
        // }
        // languageData.init(settingLang);
    }

    static getSysLang(): string {
        const lang = sys.language;
        // Cocos Creator 3.x 中 sys.language 返回字符串，如 'zh-CN', 'en-US' 等
        if (lang.startsWith('zh')) {
            return 'zh';
        } else if (lang.startsWith('ru')) {
            return 'ru';
        } else if (lang.startsWith('en')) {
            return 'en';
        } else if (lang.startsWith('tr')) {
            return 'tr';
        }
        return 'en';
    }

    static getSettingLang(): string {
        const settingLang = sys.localStorage.getItem(this.langSettingKey);
        const sysLang = settingLang || this.getSysLang();
        if (settingLang == null) {
            sys.localStorage.setItem(this.langSettingKey, sysLang);
        }
        return sysLang;
    }

    static setLang(lang: string): void {
        sys.localStorage.setItem(this.langSettingKey, lang);
    }

    static langSettingKey: string = "Lang";
}

// 多语言翻译器，将 id 转换成 LangSetting 设置的语言
export class Translator {
    // format 为 id，argObj 是包含 format 需要的所有参数的对象
    static t(format: string, argObj?: any): string {
        return 'unknow';//languageData.t(format, argObj) as string;
    }
}
