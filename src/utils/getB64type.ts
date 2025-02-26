export const b64Types = [
  'text/markdown', // md
  'text/plain', // txt
  'application/pdf', // pdf
  'image/jpeg', // jpg
  'image/png', // png
  'image/jpeg', // jpeg
  'application/msword', // doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.ms-excel', // xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-powerpoint', // ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'application/jsonl', // jsonl
  'text/csv', // csv
  'message/rfc822', // eml
];

// 检查信息来源的文件是否支持窗口化渲染
export const supportSourceTypes = [
  'md',
  'txt',
  'pdf',
  'jpg',
  'png',
  'jpeg',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'jsonl',
  'csv',
  'eml',
];

export const getB64Type = (suffix) => {
  const index = supportSourceTypes.indexOf(suffix);
  return b64Types[index];
};
