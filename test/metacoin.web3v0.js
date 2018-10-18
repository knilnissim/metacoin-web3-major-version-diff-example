const { advanceBlock } = require('./helpers/advanceToBlock');
const once = require('./helpers/once');

const MetaCoin = artifacts.require('./MetaCoin.sol');

contract('MetaCoin with web3v0', async function (accounts) {
  const [, owner, nonOwner] = accounts;
  let metaCoin;

  beforeEach(async function () {
    metaCoin = await MetaCoin.new({ from: owner });
  });

  it('should put 10000 MetaCoin in the first account', async function () {
    const balance = await metaCoin.getBalance.call(owner);
    assert.equal(balance.valueOf(), 10000, '10000 wasn\'t in the first account');
  });

  it('should call a function that depends on a linked library', async function () {
    const metaCoinBalance = (await metaCoin.getBalance.call(owner)).toNumber();
    const metaCoinEthBalance = (await metaCoin.getBalanceInEth.call(owner)).toNumber();
    assert.equal(metaCoinEthBalance, 2 * metaCoinBalance, 'Library function returned unexpected function, linkage may be broken');
  });

  it('should send coin correctly', async function () {
    // Get initial balances of first and second account.
    const sender = owner;
    const recipient = nonOwner;

    const amount = 20;
    const senderStartingBalance = (await metaCoin.getBalance.call(sender)).toNumber();
    const recipientStartingBalance = (await metaCoin.getBalance.call(recipient)).toNumber();
    await metaCoin.sendCoin(recipient, amount, { from: sender });

    const senderEndingBalance = (await metaCoin.getBalance.call(sender)).toNumber();
    const recipientEndingBalance = (await metaCoin.getBalance.call(recipient)).toNumber();

    assert.equal(senderEndingBalance, senderStartingBalance - amount, 'Amount wasn\'t correctly taken from the sender');
    assert.equal(recipientEndingBalance, recipientStartingBalance + amount, 'Amount wasn\'t correctly sent to the receiver');
  });

  it('should reject sending coin when balance is not enough', async function () {
    const sender = owner;
    const recipient = nonOwner;
    const amount = 10001;

    function doSomethingWithError (err) {
      assert.match(err, /Balance is not enough/);
    }
    const doSomethingWithErrorProxy = once(doSomethingWithError);
    await metaCoin.sendCoin(recipient, amount, { from: sender })
      .catch(doSomethingWithErrorProxy);

    assert.isTrue(doSomethingWithError.called);
    assert.equal(doSomethingWithError.callCount, 1);
  });

  it('should emit event correctly', async function () {
    const sender = owner;
    const recipient = nonOwner;
    const amount = 10;

    function doSomethingWithEvent (error, result) {
      assert.ifError(error);
      assert.equal(result.args._from, sender, 'The sender is not correctly emiited in evnet');
      assert.equal(result.args._to, recipient, 'The recipient is not correctly emiited in evnet');
      assert.equal(result.args._value.toNumber(), amount, 'The amout is not correctly emiited in evnet');
    }

    const eventFilter = metaCoin.Transfer({ fromBlock: 0 });
    eventFilter.watch(once(doSomethingWithEvent));

    await advanceBlock();
    await metaCoin.sendCoin(recipient, amount, { from: sender });
    await advanceBlock();
    await metaCoin.sendCoin(recipient, amount, { from: sender });

    assert.isTrue(doSomethingWithEvent.called);
    assert.equal(doSomethingWithEvent.callCount, 2);
  });
});
