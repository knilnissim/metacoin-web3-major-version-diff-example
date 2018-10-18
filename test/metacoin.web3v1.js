const Web3v1 = require('web3-v1');
const web3v1 = new Web3v1('ws://localhost:8545');
const Contract = require('./helpers/createWeb3V1Contract')(web3v1);
const once = require('./helpers/once');

const MetaCoin = Contract('MetaCoin.sol');

contract('MetaCoin with web3v1', function (accounts) {
  const [, owner, nonOwner] = accounts;
  let metaCoin;

  beforeEach(async function () {
    metaCoin = await MetaCoin.new().send({
      from: owner,
      gas: 1500000,
      gasPrice: 1,
    });
  });

  it('should put 10000 MetaCoin in the first account', async function () {
    // call method by `send` or `call`.
    const balance = await metaCoin.methods.getBalance(owner).call();
    // note that returning type of numeric value is not Bignumber but string.
    assert.typeOf(balance, 'string');
    assert.equal(balance, '10000', '10000 wasn\'t in the first account');
  });

  it('should call a function that depends on a linked library', async function () {
    const metaCoinBalance = await metaCoin.methods.getBalance(owner).call();
    const metaCoinEthBalance = await metaCoin.methods.getBalanceInEth(owner).call();
    assert.equal(Number(metaCoinEthBalance), 2 * Number(metaCoinBalance), 'Library function returned unexpected function, linkage may be broken');
  });

  it('should send coin correctly', async function () {
    // Get initial balances of first and second account.
    const sender = owner;
    const recipient = nonOwner;

    const amount = 10;
    const senderStartingBalance = await metaCoin.methods.getBalance(sender).call();
    const recipientStartingBalance = await metaCoin.methods.getBalance(recipient).call();
    await metaCoin.methods.sendCoin(recipient, amount).send({ from: sender });

    const senderEndingBalance = await metaCoin.methods.getBalance(sender).call();
    const recipientEndingBalance = await metaCoin.methods.getBalance(recipient).call();

    assert.equal(Number(senderEndingBalance), Number(senderStartingBalance) - amount, 'Amount wasn\'t correctly taken from the sender');
    assert.equal(Number(recipientEndingBalance), Number(recipientStartingBalance) + amount, 'Amount wasn\'t correctly sent to the receiver');
  });

  it('should send coin correctly', async function () {
    // Get initial balances of first and second account.
    const sender = owner;
    const recipient = nonOwner;

    const amount = 10;
    const senderStartingBalance = await metaCoin.methods.getBalance(sender).call();
    const recipientStartingBalance = await metaCoin.methods.getBalance(recipient).call();
    await metaCoin.methods.sendCoin(recipient, amount).send({ from: sender });

    const senderEndingBalance = await metaCoin.methods.getBalance(sender).call();
    const recipientEndingBalance = await metaCoin.methods.getBalance(recipient).call();

    assert.equal(Number(senderEndingBalance), Number(senderStartingBalance) - amount, 'Amount wasn\'t correctly taken from the sender');
    assert.equal(Number(recipientEndingBalance), Number(recipientStartingBalance) + amount, 'Amount wasn\'t correctly sent to the receiver');
  });

  it('should reject sending coin when balance is not enough', async function () {
    const sender = owner;
    const recipient = nonOwner;
    const amount = 10001;

    function doSomethingWithError (err) {
      assert.match(err, /Balance is not enough/);
    }
    const doSomethingWithErrorProxy = once(doSomethingWithError);
    await metaCoin.methods.sendCoin(recipient, amount).send({ from: sender })
      .on('error', doSomethingWithErrorProxy)
      .catch(doSomethingWithErrorProxy);

    assert.isTrue(doSomethingWithError.called);
    assert.equal(doSomethingWithError.callCount, 2);
  });

  it('should emit event correctly', async function () {
    const sender = owner;
    const recipient = nonOwner;
    const amount = 20;

    function doSomethingWithEvent (result) {
      assert.equal(result.returnValues._from, web3.toChecksumAddress(sender), 'The sender is not correctly emiited in evnet');
      assert.equal(result.returnValues._to, web3.toChecksumAddress(recipient), 'The recipient is not correctly emiited in evnet');
      assert.equal(result.returnValues._value, amount, 'The amout is not correctly emiited in evnet');
    }

    const eventEventEmiiter = metaCoin.events.Transfer('latest');
    eventEventEmiiter
      .on('data', once(doSomethingWithEvent));

    await metaCoin.methods.sendCoin(recipient, amount).send({ from: sender });

    assert.isTrue(doSomethingWithEvent.called);
  });
});
