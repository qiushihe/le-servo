export const promiseIt = (description, test) => {
  it(description, (done) => {
    test().then(done).catch(done);
  });
};
