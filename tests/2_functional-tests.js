const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

const crypto = require('crypto'); //for creating a random string

chai.use(chaiHttp);

suite('Functional Tests', function() {
  //create random fake stocks for like testing
  function randomString(){
    return crypto.randomBytes(20).toString('hex');
  }
  const fakeStock = randomString();
  const fakeStockA = randomString();
  const fakeStockB = randomString();
  let fakeStockLikes;
  
  //NOTE: this test will stop working if the GOOG stock stops existing
  test('Viewing one stock: GET request to /api/stock-prices/', function (done) {
      chai
        .request(server)
        .get('/api/stock-prices?stock=GOOG&like=false') 
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.property(res.body, 'stockData');
          assert.isObject(res.body.stockData);
          assert.property(res.body.stockData, 'stock');
          assert.isString(res.body.stockData.stock);
          assert.property(res.body.stockData, 'price');
          assert.isNumber(res.body.stockData.price);
          assert.property(res.body.stockData, 'likes');
          assert.isNumber(res.body.stockData.likes);
          done();
        });
  });


  test('Viewing one stock and liking it: GET request to /api/stock-prices/', function (done) { 
    chai
      .request(server)
      .get(`/api/stock-prices?stock=${fakeStock}&like=true`) 
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isObject(res.body);
        assert.property(res.body, 'stockData');
        assert.isObject(res.body.stockData);
        assert.property(res.body.stockData, 'stock');
        assert.isString(res.body.stockData.stock);
        assert.property(res.body.stockData, 'likes');
        assert.isNumber(res.body.stockData.likes);
        fakeStockLikes = res.body.stockData.likes;
        done();
      });
  });

  test('Viewing the same stock and liking it again: GET request to /api/stock-prices/', function (done) { 
    chai
      .request(server)
      .get(`/api/stock-prices?stock=${fakeStock}&like=true`) 
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isObject(res.body);
        assert.property(res.body, 'stockData');
        assert.isObject(res.body.stockData);
        assert.property(res.body.stockData, 'stock');
        assert.isString(res.body.stockData.stock);
        assert.property(res.body.stockData, 'likes');
        assert.isNumber(res.body.stockData.likes);
        assert.equal(fakeStockLikes, res.body.stockData.likes);
        done();
      });
  });

  let fakeStockA_rel_likes;
  test('Viewing two stocks: GET request to /api/stock-prices/', function (done) { 
    chai
      .request(server)
      .get(`/api/stock-prices?stock=${fakeStockA}&stock=${fakeStockB}&like=false`) 
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isObject(res.body);
        assert.property(res.body, 'stockData');
        assert.isArray(res.body.stockData);
         
        assert.isObject(res.body.stockData[0]);
        assert.property(res.body.stockData[0], 'stock');
        assert.isString(res.body.stockData[0].stock);
        assert.property(res.body.stockData[0], 'rel_likes');
        assert.isNumber(res.body.stockData[0].rel_likes);
           
        fakeStockA_rel_likes = res.body.stockData[0].rel_likes;
     
        assert.isObject(res.body.stockData[1]);
        assert.property(res.body.stockData[1], 'stock');
        assert.isString(res.body.stockData[1].stock);
        assert.property(res.body.stockData[1], 'rel_likes');
        assert.isNumber(res.body.stockData[1].rel_likes);
        done();
      });
  });
  
  test('Viewing two stocks and liking them: GET request to /api/stock-prices/', function (done) { 
    chai
      .request(server)
      .get(`/api/stock-prices?stock=${fakeStockA}&stock=${fakeStockB}&like=false`) 
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isObject(res.body);
        assert.property(res.body, 'stockData');
        assert.isArray(res.body.stockData);
        
        assert.isObject(res.body.stockData[0]);
        assert.property(res.body.stockData[0], 'stock');
        assert.isString(res.body.stockData[0].stock);
        assert.property(res.body.stockData[0], 'rel_likes');
        assert.isNumber(res.body.stockData[0].rel_likes);
        
        assert.equal(fakeStockA_rel_likes, res.body.stockData[0].rel_likes);
          
        assert.isObject(res.body.stockData[1]);
        assert.property(res.body.stockData[1], 'stock');
        assert.isString(res.body.stockData[1].stock);
        assert.property(res.body.stockData[1], 'rel_likes');
        assert.isNumber(res.body.stockData[1].rel_likes);
        done();
      });
  });

  //Reloads the page after it crashes when finishing the tests
  //This is necessary because Replit is bugged
  after(function() {
  chai.request(server)
    .get('/')
  });
});
