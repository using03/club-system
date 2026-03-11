const success = (res, data = null, message = '操作成功', statusCode = 200) => {
  return res.status(statusCode).json({
    code: 0,
    message,
    data
  });
};

const error = (res, message = '操作失败', statusCode = 400) => {
  return res.status(statusCode).json({
    code: -1,
    message,
    data: null
  });
};

module.exports = { success, error };
