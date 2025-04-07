import type { NextApiRequest, NextApiResponse } from 'next';

function removeUndefinedFields(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedFields);
  } else if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, value]) => value !== undefined) // 去掉值为 undefined 的字段
        .map(([key, value]) => [key, removeUndefinedFields(value)]) // 递归处理嵌套对象
    );
  }
  return obj;
}
export { removeUndefinedFields };

function withCleanResponse(
  handler: (req: NextApiRequest, res: NextApiResponse) => void
) {
  return (req: NextApiRequest, res: NextApiResponse) => {
    const originalJson = res.json;
    res.json = function (data: unknown) {
      const cleanedData = removeUndefinedFields(data);
      return originalJson.call(this, cleanedData);
    };
    return handler(req, res);
  };
}

export default withCleanResponse;
export { withCleanResponse };
