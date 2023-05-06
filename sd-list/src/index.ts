import { Context, Logger, Schema, trimSlash } from "koishi";

export const name = "sd-list";

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
    .command("查看model", "ai绘画的model列表")
    .action(async ({ session }) => {
      let modelTitles = [];

      async function getModelList() {
        try {
          const res = await ctx.http.get(
            trimSlash(config.endpoint) + MODELS_ENDPOINT
          );
          modelTitles = res.map((model) => model.title);
        } catch (err) {
          session.send(session.text("获取model列表失败"));
          throw err;
        }
      }

      async function sendModels() {
        await getModelList();
        session.send(
          `当前可用model有：\n${modelTitles
            .map((title, i) => `${i + 1}.${title}`)
            .join("\n")}`
        );
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
