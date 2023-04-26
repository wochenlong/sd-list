"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.Config = exports.name = void 0;
const koishi_1 = require("koishi");
exports.name = "sd-switch";
exports.Config = koishi_1.Schema.object({
    endpoint: koishi_1.Schema.string()
        .description("SD-WebUI 服务器地址。")
        .default("http://127.0.0.1:7860"),
    inputTimeout: koishi_1.Schema.number()
        .description("选择模型的等待时间")
        .default(10000),
    vaeList: koishi_1.Schema.array(koishi_1.Schema.string()).description("vae 列表，请输入去掉结尾 .pt 后的 vae 文件名。"),
});
const logger = new koishi_1.Logger(exports.name);
const MODELS_ENDPOINT = "/sdapi/v1/sd-models";
const OPTIONS_ENDPOINT = "/sdapi/v1/options";
function apply(ctx, config) {
    ctx.i18n.define("zh", require("./locales/zh"));
    const cmd = ctx
        .command("查看模型", "ai绘画的模型列表")
        .alias("获取模型列表")
        .action(async ({ session }) => {
        // 定义一个空数组 models，一个字符串 vae 和一个字符串 model 用于存储当前选择的模型和 VAE
        const models = [];
        let vae = "";
        let model = "";
        async function input(max) {
            // 定义函数 input，该函数接收一个数字参数 max，返回用户输入的数字（如果输入的数字符合要求）
            const value = +(await session.prompt(config.inputTimeout));
            if (value * 0 === 0 &&
                Math.floor(value) === value &&
                value > 0 &&
                value <= max) {
                return value;
            }
            // 如果输入的数字不符合要求，向用户发送一个错误消息，并抛出一个 Error
            session.send(session.text("数字格式错误"));
        }
        // 定义函数 getInfo，该函数向 API 发送请求获取当前选择的模型和 VAE
        async function getInfo() {
            session.send(session.text("正在查询中"));
            try {
                const res = await ctx.http.axios((0, koishi_1.trimSlash)(config.endpoint) + OPTIONS_ENDPOINT);
                // 将获取到的模型和 VAE 存储在 vae 和 model 变量中
                vae = res.data.sd_vae;
                model = res.data.sd_model_checkpoint;
            }
            catch (err) {
                session.send(session.text("获取模型和 VAE 失败"));
                throw err;
            }
        }
        async function getModelList() {
            try {
                const res = await ctx.http.axios((0, koishi_1.trimSlash)(config.endpoint) + MODELS_ENDPOINT);
                res.data.forEach((item) => models.push(item.title));
            }
            catch (err) {
                session.send(session.text(".queryErr"));
                throw err;
            }
        }
        async function sendInfo() {
            await getInfo();
            session.send(`当前模型为：${model}\n` +
                `当前 VAE 为：${vae}\n` +
                `输入 1 切换模型，输入 2 切换 VAE：`);
        }
        async function sendModels() {
            await getModelList();
            session.send("当前可用模型有：\n" +
                models.map((model, i) => `${i + 1}.${model}\n`).join("") +
                "\n回复模型序号切换模型");
        }
        async function sendVaes() {
            await getModelList();
            session.send("当前可用 VAE 有：\n" +
                config.vaeList.map((vae, i) => `${i + 1}.${vae}\n`).join("") +
                "\n回复模型序号切换 VAE");
        }
        async function switchModel(index) {
            try {
                session.send(session.text(".switching"));
                await ctx.http.axios((0, koishi_1.trimSlash)(config.endpoint) + OPTIONS_ENDPOINT, {
                    method: "POST",
                    data: { sd_model_checkpoint: models[index - 1] },
                });
            }
            catch (err) {
                session.send(session.text(".switchFailed"));
                throw err;
            }
            await getInfo();
            session.send(`已切换至模型：${model}`);
        }
        async function switchVae(index) {
            try {
                session.send(session.text(".switching"));
                await ctx.http.axios((0, koishi_1.trimSlash)(config.endpoint) + OPTIONS_ENDPOINT, {
                    method: "POST",
                    data: { sd_vae: config.vaeList[index - 1] },
                });
            }
            catch (err) {
                session.send(session.text(".switchFailed"));
                throw err;
            }
            await getInfo();
            session.send(`已切换至 VAE：${vae}`);
        }
        await sendInfo();
        const choice = await input(2);
        switch (choice) {
            case 1:
                await sendModels();
                const modelIndex = await input(models.length);
                await switchModel(modelIndex);
                break;
            case 2:
                await sendVaes();
                const vaeIndex = await input(config.vaeList.length);
                await switchVae(vaeIndex);
                break;
        }
    });
}
exports.apply = apply;
