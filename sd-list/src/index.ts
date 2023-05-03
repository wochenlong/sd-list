import { Context, Logger, Schema, trimSlash } from "koishi";

export const name = "sd-switch";

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
    .command("查看绘画模型", "ai绘画的模型列表")
    .alias("获取模型列表")
    .action(async ({ session }) => {
      const models = [];
      let vae = "";
      let model = "";
      const pt = [];

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

      async function getPtList() {
        try {
          const res = await ctx.http.axios(
            trimSlash(config.endpoint) + PT_ENDPOINT
          );
          res.data.forEach((item) => pt.push(item.title));
        } catch (err) {
          session.send(session.text("获取pt列表失败"));
          throw err;
        }
      }

      async function sendModels() {
        await getModelList();
        session.send(`
          当前可用模型有：
          ${models.map((model, i) => `${i + 1}.${model}`).join("\n")}
        `);
      }

      async function sendPt() {
        await getPtList();
        session.send(`
          当前可用pt有：
          ${pt.map((pt, i) => `${i + 1}.${pt}`).join("\n")}
        `);
      }

      const cmd2 = ctx.command("查看pt", "ai绘画的pt列表").action(async () => {
        await sendPt();
      });

      await sendModels();
    });









    
}
