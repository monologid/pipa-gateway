const assert = require("assert");
const helper = require("../lib/helper");

describe("helper module", () => {
  it("generate url from domain", () => {
    let url = helper.generateUrl(
      {
        placeholder: "https://jsonplaceholder.typicode.com"
      },
      "${domain.placeholder}/users",
      {}
    );
    assert.equal(url, "https://jsonplaceholder.typicode.com/users");
  });

  it("generate url from params", () => {
    let url = helper.generateUrl(
      {},
      "https://jsonplaceholder.typicode.com/users/:id",
      { id: 1 }
    );
    assert.equal(url, "https://jsonplaceholder.typicode.com/users/1");
  });

  it("get string between {}", () => {
    let results = helper.getWordsBetweenCurlies(
      "https://jsonplaceholder.typicode.com/posts?userId1={user.id}"
    );
    assert.equal(results[0], "user.id");
  });
  it("get string between ${}", () => {
    let results = helper.getWordsBetweenDollarCurlies(
      "${domain.placeholder}/users"
    );
    assert.equal(results[0], "domain.placeholder");
  });
});
