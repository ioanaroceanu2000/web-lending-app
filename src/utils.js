import Web3 from 'web3';
import {LiquidityPool_ABI, LiquidityPool_ADD, Exchange_ADD, Exchange_ABI, ERC20_ABI, Token_ABI, Token_BYTECODE } from './abis/abi'
import fs from 'fs';
import LoadedTokens from './LoadedTokens.json';

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

export async function getUserDeposit(web3, userAdd, liquidityPool){
  await window.ethereum.enable();
  const deposit = await liquidityPool.methods.getCummulatedInterestDeposit(userAdd).call();
  const userDetails = await liquidityPool.usersBalance(userAdd).call();
  return [deposit, userDetails.tokenDeposited];
}

//(collateral, collToken, owed, borrToken)
export async function getUserLoanDetails(web3, userAdd, liquidityPool){
  await window.ethereum.enable();
  const details = await liquidityPool.methods.getUserDetails(userAdd).call();
  return details;
}

// returns [tokensList, {realID: {symbol: -, utilisationRate: -, collateral: -, baseRate: -, slope1:-, slope2:-, sread: -}]
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
    let collateral = object[i]["collateral"];
    let baseRate = object[i]["baseRate"];
    let slope1 = object[i]["slope1"];
    let slope2 = object[i]["slope2"];
    let spread = object[i]["spread"];
    tmprData[id] = {symbol: symbol, utilisationRate: utilisationRate, collateral: collateral, baseRate: baseRate, slope1: slope1, slope2: slope2, spread: spread};
  }
  return [tokensList,tmprData];

}

// deploy the code for a token and return its address
export async function depolyToken(name, symbol, web3, userAddress){
  //create contract and depoly
  var contract = new web3.eth.Contract(Token_ABI);
  const account = await web3.utils.toChecksumAddress(userAddress);
  const gasPrice = await web3.utils.toWei('100', 'gwei');
  const gasPriceHex = await web3.utils.toHex(gasPrice);
  const nonce = await web3.eth.getTransactionCount(account);
  const nonceHex = await web3.utils.toHex(nonce);

  console.log(account);
  console.log(web3.utils.isAddress(account));
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
    tokenDetails.slope1,
    tokenDetails.spread,
    tokenDetails.price).send({from: account});
  return address;
}

export async function getTokenAPIPrice(realID){
  const url = 'https://uniswapmyapi.herokuapp.com/tokenPriceUSD/' + realID;
  let respones = await fetch(url);
  let data = await respones.json();
  // create price dictionary and array of token ids
  return data["priceOfToken"];
}


// JSON PARSING

// returns dict {realID: fakeID}
export async function getLoadedTokens(){
  console.log('try getting recorded tokens');
  let loadedTokens = JSON.parse(fs.readFileSync('./LoadedTokens.json'));
  let dict = {};
  for(var i = 0; i < loadedTokens.lenght; i++){
    let realID = loadedTokens[i].realID;
    let fakeID = loadedTokens[i].fakeID;
    dict[realID] = fakeID;
  }

  return dict;
}

export async function addLoadedTokens(realID, fakeID){
  console.log('try writting to Json');
  //reading the data
  let data = {};
  LoadedTokens.map((token, index) =>{
    data[token.realID] = token.fakeID;
  })
  console.log(data);
  //adding the new token
  data[realID] = fakeID;

  LoadedTokens = data;
}
