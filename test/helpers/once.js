module.exports = function once (fn) {
  fn.called = false;
  fn.callCount = 0;
  return function () {
    fn.called = true;
    fn.callCount++;
    fn.returnValue = fn.apply(this, arguments);
    return fn.returnValue;
  };
};
