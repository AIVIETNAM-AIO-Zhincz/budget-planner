import { createRequire } from "module";
const require = createRequire(import.meta.url);
const echarts = require("echarts");
const { lineOption } = await import("./src/utils/charts.js");
const theme={palette:{text:{secondary:"#888"},background:{paper:"#fff"},divider:"#eee",success:{main:"#10b981"},error:{main:"#ef4444"}}};
const c=echarts.init(null,null,{renderer:"svg",ssr:true,width:600,height:300});
c.setOption(lineOption(theme,{dates:["06-01","06-02"],income:[15000000,0],expense:[300000,300000]},{}));
const s=c.renderToSVGString();
process.stdout.write("LINE paths="+(s.match(/<path/g)||[]).length+" Thu="+s.includes("Thu")+" Chi="+s.includes("Chi")+"\n");
