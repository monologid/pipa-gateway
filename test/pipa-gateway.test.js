let chai = require("chai");
let chaiHttp = require("chai-http");
let server = require("../example/app_test");
let should = chai.should();

chai.use(chaiHttp);

describe("Pipa Gateway Proxy Request", () => {
  it("it should GET all users", done => {
    chai
      .request(server)
      .get("/users")
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("array");
        res.body.length.should.be.eql(10);
        done();
      });
  });

  it("it should GET detail users", done => {
    chai
      .request(server)
      .get("/user/1")
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("id").eql(1);
        done();
      });
  });

  it("it should Post data", done => {
    chai
      .request(server)
      .post("/posts")
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.be.a("object");
        done();
      });
  });

  it("it should Put data", done => {
    chai
      .request(server)
      .put("/posts/1")
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        done();
      });
  });

  it("it should Delete data", done => {
    chai
      .request(server)
      .del("/posts/1")
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        done();
      });
  });
});

describe("Pipa Gateway Pararel Request", () => {
  it("it should GET all users", done => {
    chai
      .request(server)
      .get("/parallel")
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("user").a("array");
        res.body.should.have.property("post").a("array");
        done();
      });
  });
});

describe("Pipa Gateway Chain Request", () => {
  it("it should GET all users", done => {
    chai
      .request(server)
      .get("/chain/1")
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("user").a("object");
        res.body.should.have.property("post").a("array");
        done();
      });
  });
});
