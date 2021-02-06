import Web3 from 'web3';
import {Transaction} from 'ethereumjs-tx';
import {IRVAR_ABI, IRVAR_ADD, LiquidityPool_ABI, LiquidityPool_ADD, Exchange_ADD, Exchange_ABI, ERC20_ABI, Token_ABI, Token_BYTECODE } from './abis/abi';
import fs from 'fs';

/// GET CHAIN DATA

export async function loadWeb3(){
  const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
  const network = await web3.eth.net.getNetworkType();
  console.log("network:",network);
  return web3;
}

export async function getAccount(web3){
  const connectedAccount = await web3.eth.getAccounts();
  return connectedAccount[0];
}

// [amount, token]
export async function getUserDeposit(web3, userAdd, liquidityPool){
  console.log("get user's deposit details");
  await window.ethereum.enable();
  const userDetails = await liquidityPool.methods.usersBalance(userAdd).call();
  if( !web3.utils.toBN(userDetails.tokenDeposited).isZero()){
    console.log(userDetails.tokenDeposited);
    const deposit = await liquidityPool.methods.getCummulatedInterestDeposit(userAdd).call();
    return [deposit, userDetails.tokenDeposited];
  }
  return [0,''];

}

//(collateral, collToken, owed, borrToken)
export async function getUserLoanDetails(web3, userAdd, liquidityPool){
  console.log("get user's loan details");
  await window.ethereum.enable();
  const userDetails = await liquidityPool.methods.usersBalance(userAdd).call();
  console.log("User loan");

  console.log("Loan token");
  console.log(userDetails.tokenBorrowed);
  console.log("User coll");
  console.log("Coll Token");
  console.log(userDetails.tokenCollateralised);
  // user either has both coll and loan or just collateral or none
  // user cannot havo only loan

  if(!web3.utils.toBN(userDetails.tokenCollateralised).isZero() &&  !web3.utils.toBN(userDetails.tokenBorrowed).isZero(userDetails.tokenBorrowed)){
    const loanDetails = await liquidityPool.methods.getUserDetails(userAdd).call();
    console.log(loanDetails);
    return loanDetails;
  }else if(!web3.utils.toBN(userDetails.tokenCollateralised).isZero()){
    const collDetails = await liquidityPool.methods.usersBalance(userAdd).call();
    return [collDetails.collateralAmount, collDetails.tokenCollateralised, 0, ''];
  }else{
    return [0,'',0,''];
  }
}

export async function getTokenRates(web3, tokenAddress, liquidityPool){
  const tokenAdd = await web3.utils.toChecksumAddress(tokenAddress);

  const tokenData = await liquidityPool.methods.tokensCoreData(tokenAdd).call();
  const utilisation = tokenData.utilisation;
  console.log("This is the utilisation");
  console.log(utilisation);

  const ivarInstance = new web3.eth.Contract(IRVAR_ABI, IRVAR_ADD);
  const borrowIR = await ivarInstance.methods.borrowInterestRate(tokenAdd,utilisation).call();
  const depositIR = await ivarInstance.methods.depositInterestRate(tokenAdd,utilisation).call();

  return [borrowIR, depositIR];
}




//// CHAIN ACTIONS HELPERS

// deploy the code for a token and return its address
export async function depolyToken(name, symbol, web3, userAddress){
  //create contract and depoly
  var contract = new web3.eth.Contract(Token_ABI);
  const account = await web3.utils.toChecksumAddress(userAddress);
  const gasPrice = await web3.utils.toWei('100', 'gwei');
  const gasPriceHex = await web3.utils.toHex(gasPrice);
  const nonce = await web3.eth.getTransactionCount(account);
  const nonceHex = await web3.utils.toHex(nonce);

  contract.options.data = Token_BYTECODE;

  var TokenTx = contract.deploy({
      arguments: [name, symbol]
  });
  await window.ethereum.enable();
  var tokenAddress;
  console.log("Deploy token");
  var instance = await TokenTx.send({
      from: account,
      gasLimit: 1500000,
      gasPrice: gasPriceHex,
      value: 0
  }).then(function(newContractInstance){
      tokenAddress = newContractInstance.options.address; // instance with the new contract address
  });

  return tokenAddress;
}

export async function createToken(userAccount, web3, tokenDetails, exchange, liquidityPool){
  var address = await depolyToken(tokenDetails.symbol,tokenDetails.symbol,web3, userAccount);
  // create pool in exchange
  const account = await web3.utils.toChecksumAddress(userAccount);
  await window.ethereum.enable();
  console.log("Create the pool in Exchange");
  await exchange.methods.createPool(address,tokenDetails.price,tokenDetails.symbol).send({from: account});
  // create token in LiquidityPool
  await window.ethereum.enable();
  console.log("Create the pool in LP");
  await liquidityPool.methods.createToken( tokenDetails.symbol,
    address,
    tokenDetails.utilisation,
    tokenDetails.collateral,
    tokenDetails.baseRate,
    tokenDetails.slope1,
    tokenDetails.slope2,
    tokenDetails.spread,
    tokenDetails.price).send({from: account});
  return address;
}

// give permission to contract to retreive tokens
async function givePermissionToContract(web3, account, amount, tokenAddress){
  const weiAmount = amount;
  const tokenAdd = await web3.utils.toChecksumAddress(tokenAddress);
  console.log(tokenAdd);
  const tokenInstance = new web3.eth.Contract(ERC20_ABI, tokenAddress);
  console.log("try getting permission");
  await window.ethereum.enable();
  await tokenInstance.methods.approve(LiquidityPool_ADD, weiAmount).send({from: account});
}

// updates prices in exchange for given token from the owner address
export async function updateExchangePricesFromOwner(web3, exchange, token, price){

  const account = await web3.utils.toChecksumAddress('0x614114ec0a5a6def6172d8cb210facb63d459c04');
  const privateKey = new Buffer('8ba9b5140d9b73afbdbb177247abe308242eaa55a955a52f7ebf2c2ca8aae99a', 'hex');
  var nonce = await web3.eth.getTransactionCount(account);
  const gasLimit = await web3.utils.toHex(2000000);
  const priceRounded = Math.round(price*10);
  const data = await exchange.methods.updatePrice(token, priceRounded).encodeABI();
  const gasPrice = await web3.utils.toWei('100', 'gwei');
  const gasPriceHex = await web3.utils.toHex(gasPrice);
  const rawTx = {
    nonce: nonce,
    from: account,
    to: Exchange_ADD,
    gasLimit: gasLimit,
    gasPrice: gasPriceHex,
    chainId: 3,
    data: data
  };
  // private key of the second account
  var tx = new Transaction(rawTx, {'chain':'ropsten'});
  tx.sign(privateKey);
  var serializedTx = tx.serialize();
  console.log("Send signed transaction on price update");
  const receipt = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
  console.log(receipt);
}

// updates prices in liquidity pool for given token
export async function updateLiquidityPoolPrices(web3, liquidityPool, token, account){

  const tokenAddress = await web3.utils.toChecksumAddress(token);
  await window.ethereum.enable();
  await liquidityPool.methods.updateTokenPrice(token).send({from: account});
}



//// PROTOCOL FUNCTIONALITIES

export async function deposit(userAccount, amount, fakeID, web3, liquidityPool){

  const tokenAdd = await web3.utils.toChecksumAddress(fakeID);
  await givePermissionToContract(web3, userAccount, amount, tokenAdd);
  console.log("TRY DEPOSIT");
  const weiAmount = amount;
  await window.ethereum.enable();
  liquidityPool.methods.deposit(userAccount, weiAmount, tokenAdd).send({from: userAccount}).on('error', function(error){
    alert("Transaction Failed: You are not allowed to have deposits in more than one token.");
  });
  console.log("Deposit DONE");
}

export async function borrow(userAccount, amount, fakeID, web3, liquidityPool){

  const tokenAdd = await web3.utils.toChecksumAddress(fakeID);
  console.log("TRY Borrow");
  const weiAmount = amount;
  await window.ethereum.enable();
  // borrow(address payable user, uint amount, address tokenId)
  liquidityPool.methods.borrow(userAccount, weiAmount, tokenAdd).send({from: userAccount}).on('error', function(error){
    alert("Transaction Failed: You either already have a loan in a different token OR you have overborrowed");
  });
  console.log("Borrow DONE");
}

export async function depositCollateral(userAccount, amount, fakeID, web3, liquidityPool){

  const tokenAdd = await web3.utils.toChecksumAddress(fakeID);
  await givePermissionToContract(web3, userAccount, amount, tokenAdd);
  console.log("TRY DEPOSIT COLLATERAL");
  const weiAmount = amount;
  await window.ethereum.enable();
  // depositCollateral(address payable user, uint amount, address tokenId)
  liquidityPool.methods.depositCollateral(userAccount, weiAmount, tokenAdd).send({from: userAccount}).on('error', function(error){
    alert("Transaction Failed: You are not allowed to have collateral in more than one token.");
  });
  console.log("DEPOSIT COLLATERAL DONE");
}

export async function collateralFromDeposit(userAccount, amount, fakeID, web3, liquidityPool){

  const tokenAdd = await web3.utils.toChecksumAddress(fakeID);
  console.log("TRY ADD COLLATERAL FROM DEPOSIT");
  const weiAmount = amount;
  await window.ethereum.enable();
  await liquidityPool.methods.switchDepositToCollateral(userAccount, weiAmount, tokenAdd).send({from: userAccount}).on('error', function(error){
    alert("Transaction Failed: You don't have enough in deposit OR you already have collateral in a different token OR the protocol's liquidity state does not permit deposit withdrawals");
  });
  console.log("DEPOSIT COLLATERAL DONE");
}

//repay(address payable user, uint amount)
export async function repay(userAccount, amount, fakeID, web3, liquidityPool){

  const tokenAdd = await web3.utils.toChecksumAddress(fakeID);
  await givePermissionToContract(web3, userAccount, amount, tokenAdd);
  console.log("TRY REPAY");
  const weiAmount = amount;
  await window.ethereum.enable();
  await liquidityPool.methods.repay(userAccount, weiAmount).send({from: userAccount}).on('error', function(error){
    alert("Transaction Failed: You paied more than you owe");
  });
  console.log("REPAY DONE");
}

export async function redeem(userAccount, amount, fakeID, web3, liquidityPool){

  const tokenAdd = await web3.utils.toChecksumAddress(fakeID);
  console.log("TRY REDEEM");
  const weiAmount = amount;
  await window.ethereum.enable();
  await liquidityPool.methods.redeem(userAccount, weiAmount).send({from: userAccount}).on('error', function(error){
    alert("Transaction Failed: The protocol's liquidity state does not permit deposit withdrawals OR value exceeds your current deposit value");
  });
  console.log("REDEEM DONE");
}


//// API data

// returns [tokensList, {realID: {symbol: -, utilisationRate: -, collateral: -, baseRate: -, slope1:-, slope2:-, sread: -, price: -}]
export async function getTokenAPIData(){
  const url = "https://uniswapmyapi.herokuapp.com/interestRateVars";
  let respones = await fetch(url);
  let data = await respones.json();
  // create price dictionary and array of token ids
  let object = data;
  let tmprData = {};
  let tokensList = [];
  // for every token build dictionary entry id:[symbol, price]
  // and array of token's ids
  var i;
  for(i = 0; i < 275; i++){
    let id = object[i]["id"];
    tokensList.push(id);
    let symbol = object[i]["symbol"];
    let utilisationRate = object[i]["utilisationRate"];
    let collateral = Math.round(object[i]["collateral"]);
    let baseRate = object[i]["baseRate"];
    let slope1 = object[i]["slope1"];
    let slope2 = object[i]["slope2"];
    let spread = object[i]["spread"];
    tmprData[id] = {symbol: symbol, utilisationRate: utilisationRate, collateral: collateral, baseRate: baseRate, slope1: slope1, slope2: slope2, spread: spread};
  }
  return [tokensList,tmprData];

}

// add deployed token to the server list of LoadedTokens
export async function registerLoadedToken(symbol, realID, fakeID){
  const url = "https://uniswapmyapi.herokuapp.com/loadedTokens";
  const data = {symbol: symbol, realID: realID, fakeID: fakeID};
  const options = {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  };
  let response = await fetch(url, options);
  console.log("This is the loadedTokens api post response");
  console.log(response);
}

// get loaded tokens from API
export async function getLoadedTokens(){
  const url = "https://uniswapmyapi.herokuapp.com/loadedTokens";
  let respones = await fetch(url);
  let data = await respones.json();
  return data.loadedTokens;
}

export async function getTokenAPIPrice(realID){
  const url = 'https://uniswapmyapi.herokuapp.com/tokenPriceUSD/' + realID;
  let respones = await fetch(url);
  let data = await respones.json();
  // create price dictionary and array of token ids
  return data["priceOfToken"].toFixed(3);
}
