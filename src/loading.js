let start = () => {};
let stop = () => {};

export const setLoadingHandlers = (s, t) => {
  start = s;
  stop = t;
};

export const withLoading = async (fn) => {
  start();
  try {
    return await fn();
  } finally {
    stop();
  }
};
