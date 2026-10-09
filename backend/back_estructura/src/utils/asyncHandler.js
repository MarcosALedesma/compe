export const asyncHandler = (fn) => (req, res, next) => {
  try {
    const r = fn(req, res, next);
    if (r instanceof Promise) r.catch(next);
  } catch (err) {
    next(err);
  }
};