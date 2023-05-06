import { Context, Logger, Schema, trimSlash } from "koishi";

export const name = "sd-list";

export const usage = "查看模型、pt、lora列表";
export interface Config {
  endpoint?: string;
}

export const Config: Schema<Config> = Schema.object({
  endpoint: Schema.string()
    .description("SD-WebUI 服务器地址。")
    .default("http://127.0.0.1:7860"),
});

const logger = new Logger(name);

const MODELS_ENDPOINT = "/sdapi/v1/sd-models";
const PT_ENDPOINT = "/sdapi/v1/embeddings";

export function apply(ctx: Context, config: Config) {
  const cmd1 = ctx
    .command("查看模型", "ai绘画的模型列表")
    .alias("获取模型列表")
    .action(async ({ session }) => {
      const models = [];
      let vae = "";
      let model = "";

      async function getModelList() {
        try {
          const res = await ctx.http.axios(
            trimSlash(config.endpoint) + MODELS_ENDPOINT
          );
          res.data.forEach((item) => models.push(item.title));
        } catch (err) {
          session.send(session.text("获取模型列表失败"));
          throw err;
        }
      }

      // 定义函数 sendModels，该函数向用户发送可用的模型列表
      async function sendModels() {
        // 向 API 发送请求获取模型列表
        await getModelList();
        // 向 API 发送请求获取当前使用的模型
        await getInfo();
        session.send(
          "当前可用模型有：\n" +
            models.map((model, i) => `${i + 1}.${model}\n`).join("")
        );
      }
      async function getInfo() {
        session.send(session.text(".inQuery"));
        try {
          const res = await ctx.http.axios(
            trimSlash(config.endpoint) + MODELS_ENDPOINT
          );
          vae = res.data.sd_vae;
          model = res.data.sd_model_checkpoint;
        } catch (err) {
          session.send(session.text(".queryErr"));
          throw err;
        }
      }
      await sendModels();
    });


  const cmd2 = ctx
    .command("查看pt", "ai绘画的pt列表")
    .action(async ({ session }) => {
      let pt = [];

      async function getPtList() {
        try {
          const res = await ctx.http.get(
            trimSlash(config.endpoint) + PT_ENDPOINT
          );
          pt = Object.keys(res.loaded);
        } catch (err) {
          session.send(session.text("获取pt列表失败"));
          throw err;
        }
      }
      async function sendPt() {
        await getPtList();
        session.send(
          `当前可用pt有：\n${pt.map((pt, i) => `${i + 1}.${pt}`).join("\n")}`
        );
      }

      await sendPt();
    });
}
