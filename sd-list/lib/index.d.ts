import { Context, Schema } from "koishi";
export declare const name = "sd-switch";
export interface Config {
    endpoint?: string;
    inputTimeout?: number;
    vaeList?: Array<string>;
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): void;
