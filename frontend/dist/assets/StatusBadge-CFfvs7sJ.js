import{n as o,q as a,f as n}from"./index-BWuwrj6o.js";import{A as c}from"./award-BfsWnwVn.js";import{C as x}from"./clock-Byvxf-Fi.js";/**
 * @license lucide-react v0.307.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=o("Play",[["polygon",{points:"5 3 19 12 5 21 5 3",key:"191637"}]]);/**
 * @license lucide-react v0.307.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const t=o("XCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]]),B=({status:b,size:e="md",showIcon:l=!0})=>{const r=(k=>{const d={pending:{bg:"bg-amber-50",border:"border-amber-200",text:"text-amber-700",icon:x,label:"Pending",darkBg:"dark:bg-amber-950",darkBorder:"dark:border-amber-800",darkText:"dark:text-amber-300"},accepted:{bg:"bg-emerald-50",border:"border-emerald-200",text:"text-emerald-700",icon:n,label:"Accepted",darkBg:"dark:bg-emerald-950",darkBorder:"dark:border-emerald-800",darkText:"dark:text-emerald-300"},in_progress:{bg:"bg-blue-50",border:"border-blue-200",text:"text-blue-700",icon:p,label:"In Progress",darkBg:"dark:bg-blue-950",darkBorder:"dark:border-blue-800",darkText:"dark:text-blue-300"},completed:{bg:"bg-purple-50",border:"border-purple-200",text:"text-purple-700",icon:c,label:"Completed",darkBg:"dark:bg-purple-950",darkBorder:"dark:border-purple-800",darkText:"dark:text-purple-300"},rejected:{bg:"bg-rose-50",border:"border-rose-200",text:"text-rose-700",icon:t,label:"Rejected",darkBg:"dark:bg-rose-950",darkBorder:"dark:border-rose-800",darkText:"dark:text-rose-300"},cancelled:{bg:"bg-gray-50",border:"border-gray-200",text:"text-gray-700",icon:t,label:"Cancelled",darkBg:"dark:bg-gray-900",darkBorder:"dark:border-gray-700",darkText:"dark:text-gray-300"}};return d[k]||d.pending})(b),g=r.icon,s={sm:"px-2.5 py-1 text-xs",md:"px-3 py-1.5 text-sm",lg:"px-4 py-2 text-base"};return a.jsxs("div",{className:`inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors
        ${s[e]}
        ${r.bg} ${r.border} ${r.text}
        ${r.darkBg} ${r.darkBorder} ${r.darkText}`,children:[l&&a.jsx(g,{size:e==="sm"?14:e==="md"?16:18}),r.label]})};export{p as P,B as S,t as X};
