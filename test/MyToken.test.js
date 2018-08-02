const expect = require('chai').expect;
const assertRevert = require('./helpers/assertRevert');

var MyToken = artifacts.require("MyToken");

contract('MyToken', (accounts) => {

  let instance = null;
  beforeEach(async function () {
    instance = await MyToken.new();
  });

  // checks of correct start-up:
  it("should have zero on owner's balance", async () => {
    const balanceLeft = await instance.balanceOf(accounts[0]);
    assert.equal(balanceLeft, 0);
  });

  it("should have zero total supply", async () => {
    const totalSupply = await instance.totalSupply();
    assert.equal(totalSupply, 0);
  });

  // checks that we can issue new tokens and delete unused
  it("should be able to mint tokens", async () => {
    const amount = 1e18;
    const { logs } = await instance.mint(accounts[1], amount);
    const event = logs.find(e => e.event === 'Mint');
    expect(event).to.exist;

    const totalSupply = await instance.totalSupply();
    assert.equal(totalSupply.toNumber(), amount);
    const balance1 = await instance.balanceOf(accounts[1]);
    assert.equal(balance1.toNumber(), amount);
    const balance0 = await instance.balanceOf(accounts[0]);
    assert.equal(balance0.toNumber(), 0);

  });

  it("should be able to burn tokens", async () => {
    const initialAmount = 1000;
    const amountToBurn = 20;
    const amountToRemain = 980;
    await instance.mint(accounts[2], initialAmount);
    const balanceInitial = await instance.balanceOf(accounts[2]);
    assert.equal(balanceInitial.toNumber(), initialAmount);

    const totalSupplyInitial = await instance.totalSupply();
    assert.equal(totalSupplyInitial, initialAmount);

    const { logs } = await instance.burn(accounts[2], amountToBurn);
    const event = logs.find(e => e.event === 'Burn');
    expect(event).to.exist;

    const balance1 = await instance.balanceOf(accounts[2]);
    assert.equal(balance1.toNumber(), amountToRemain);

    const totalSupply = await instance.totalSupply();
    assert.equal(totalSupply, amountToRemain);

    // master account should still be zero
    const balance0 = await instance.balanceOf(accounts[0]);
    assert.equal(balance0.toNumber(), 0);
  });

  it('should return correct balances after transfer', async () => {
    const amount = 100;
    const { logs } = await instance.mint(accounts[0], amount);
    // checking sender
    const balanceBeforeTransfer = await instance.balanceOf(accounts[0]);
    assert.equal(balanceBeforeTransfer.toNumber(), amount);

    // doing the transfer
    await instance.transfer(accounts[1], amount, { from: accounts[0] });

    // checking state after transfer
    const totalSupply = await instance.totalSupply();
    assert.equal(totalSupply.toNumber(), amount);
    const balance1 = await instance.balanceOf(accounts[1]);
    assert.equal(balance1.toNumber(), amount);
    const balance0 = await instance.balanceOf(accounts[0]);
    assert.equal(balance0.toNumber(), 0);
  });

  it('should throw an error when trying to transfer more than balance', async () => {
    const amount = 100;
    const { logs } = await instance.mint(accounts[0], amount);
    // checking sender
    const balanceBeforeTransfer = await instance.balanceOf(accounts[0]);
    assert.equal(balanceBeforeTransfer.toNumber(), amount);

    try {
      await instance.transfer(accounts[1], amount + 1, { from: accounts[0] });
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('should throw an error when trying to transfer to 0x0', async () => {
    const amount = 100;
    const { logs } = await instance.mint(accounts[0], amount);

    try {
      await instance.transfer(0x0, amount);
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

});
