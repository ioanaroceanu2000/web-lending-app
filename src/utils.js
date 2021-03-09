import Web3 from 'web3';
import {Transaction} from 'ethereumjs-tx';
import {IRVAR_ABI, IRVAR_ADD, LiquidityPool_ABI, LiquidityPool_ADD, Exchange_ADD, Exchange_ABI, ERC20_ABI, Token_ABI, Token_BYTECODE, LiquidityManager_ABI, LiquidityManager_ADD } from './abis/abi';
import fs from 'fs';
/* global BigInt */

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

// [amount, tkn]
export async function getUserDeposit(web3, userAdd, liquidityPool){
  console.log("get user's deposit details");
  await window.ethereum.enable();
  const userDetails = await liquidityPool.methods.uBal(userAdd).call();
  if( !web3.utils.toBN(userDetails.tknDeposited).isZero()){
    const ivar = new web3.eth.Contract(IRVAR_ABI, IRVAR_ADD);
    const deposit = await ivar.methods.getCumIrDeposit(userDetails.tknDeposited, userDetails.cummulated_dep, userDetails.init_ir_deposit).call();
    const actualDeposit = Number(BigInt(deposit) / BigInt(10n ** 15n))/1000;
    return [actualDeposit, userDetails.tknDeposited];
  }
  return [0,''];

}

//(collateral, colltkn, owed, borrtkn)
export async function getUserLoanDetails(web3, userAdd, liquidityPool){
  await window.ethereum.enable();
  const userDetails = await liquidityPool.methods.uBal(userAdd).call();
  // user either has both coll and loan or just collateral or none
  // user cannot havo only loan

  if(!web3.utils.toBN(userDetails.tknCollateralised).isZero() &&  !web3.utils.toBN(userDetails.tknBorrowed).isZero(userDetails.tknBorrowed)){
    const ivar = new web3.eth.Contract(IRVAR_ABI, IRVAR_ADD);
    const owed = await ivar.methods.getCumIrLoan(userDetails.tknBorrowed, userDetails.cummulated_borr, userDetails.init_ir_borrow).call();
    const actualColl = Number(BigInt(userDetails.collateralAmount) / BigInt(10n ** 15n))/1000;
    const actualowed = Number(BigInt(owed) / BigInt(10n ** 15n))/1000;
    const loanDetails = [actualColl,userDetails.tknCollateralised,  actualowed, userDetails.tknBorrowed];
    return loanDetails;
  }else if(!web3.utils.toBN(userDetails.tknCollateralised).isZero()){
    const actualColl = Number(BigInt(userDetails.collateralAmount) / BigInt(10n ** 15n))/1000;
    return [actualColl, userDetails.tknCollateralised, 0, ''];
  }else{
    return [0,'',0,''];
  }
}

export async function getTokenRates(web3, tknAddress, liquidityPool){
  console.log(tknAddress);
  const tknAdd = await web3.utils.toChecksumAddress(tknAddress);

  const tknData = await liquidityPool.methods.tknsData(tknAdd).call();
  const utilisation = tknData.utilisation;
  console.log(utilisation);
  console.log(tknAddress);

  const ivarInstance = new web3.eth.Contract(IRVAR_ABI, IRVAR_ADD);
  const borrowIR = await ivarInstance.methods.borrowInterestRate(tknAdd,utilisation).call();
  const depositIR = await ivarInstance.methods.depositInterestRate(tknAdd,utilisation).call();

  return [borrowIR, depositIR];
}




//// CHAIN ACTIONS HELPERS

// deploy the code for a tkn and return its address
export async function depolyToken(name, symbol, web3, userAddress){
  //create contract and depoly
  var contract = new web3.eth.Contract(Token_ABI);
  const account = await web3.utils.toChecksumAddress(userAddress);
  const gasPrice = await web3.utils.toWei('100', 'gwei');
  const gasPriceHex = await web3.utils.toHex(gasPrice);
  const nonce = await web3.eth.getTransactionCount(account);
  const nonceHex = await web3.utils.toHex(nonce);

  contract.options.data = Token_BYTECODE;

  var tknTx = contract.deploy({
      arguments: [name, symbol]
  });
  await window.ethereum.enable();
  var tknAddress;
  console.log("Deploy tkn");
  var instance = await tknTx.send({
      from: account,
      gasLimit: 1500000,
      gasPrice: gasPriceHex,
      value: 0
  }).then(function(newContractInstance){
      tknAddress = newContractInstance.options.address; // instance with the new contract address
  });

  return tknAddress;
}

export async function createToken(userAccount, web3, tknDetails, exchange, liquidityPool){
  var address = await depolyToken(tknDetails.symbol,tknDetails.symbol,web3, userAccount);
  // create pool in exchange
  const account = await web3.utils.toChecksumAddress(userAccount);
  await window.ethereum.enable();
  console.log("Create the pool in Exchange");
  await exchange.methods.createPool(address,tknDetails.price,tknDetails.symbol).send({from: account});
  // create tkn in LiquidityPool
  await window.ethereum.enable();
  await liquidityPool.methods.createtkn(address,
    tknDetails.utilisation,
    tknDetails.collateral,
    tknDetails.baseRate,
    tknDetails.slope1,
    tknDetails.slope2,
    tknDetails.spread,
    tknDetails.price, tknDetails.trusted).send({from: account});
  return address;
}

// give permission to contract to retreive tkns
async function givePermissionToContract(web3, account, amount, tknAddress){
  const weiAmount = amount;
  const tknAdd = await web3.utils.toChecksumAddress(tknAddress);
  const tknInstance = new web3.eth.Contract(ERC20_ABI, tknAddress);
  await window.ethereum.enable();
  await tknInstance.methods.approve(LiquidityPool_ADD, weiAmount).send({from: account});
}

// updates prices in exchange for given tkn from the owner address
export async function updateExchangePricesFromOwner(web3, exchange, tkn, price){

  const account = await web3.utils.toChecksumAddress('0x614114ec0a5a6def6172d8cb210facb63d459c04');
  const privateKey = new Buffer('8ba9b5140d9b73afbdbb177247abe308242eaa55a955a52f7ebf2c2ca8aae99a', 'hex');
  var nonce = await web3.eth.getTransactionCount(account);
  const gasLimit = await web3.utils.toHex(2000000);
  const priceRounded = Math.round(price*1000);
  const data = await exchange.methods.updatePrice(tkn, priceRounded).encodeABI();
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

// updates prices in liquidity pool for given tkn
export async function updateLiquidityPoolPrices(web3, liquidityPool, tkn, account){

  const tknAddress = await web3.utils.toChecksumAddress(tkn);
  await window.ethereum.enable();
  await liquidityPool.methods.updatetknPrice(tkn).send({from: account});
}

export async function switchToUnexchangable(tkn){
  const web3 = await loadWeb3();
  const exchange = new web3.eth.Contract(Exchange_ABI, Exchange_ADD);
  const account = await web3.utils.toChecksumAddress('0x614114ec0a5a6def6172d8cb210facb63d459c04');
  const privateKey = new Buffer('8ba9b5140d9b73afbdbb177247abe308242eaa55a955a52f7ebf2c2ca8aae99a', 'hex');
  var nonce = await web3.eth.getTransactionCount(account);
  const gasLimit = await web3.utils.toHex(2000000);
  const data = await exchange.methods.switchToUnexchangable(tkn).encodeABI();
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
  console.log("Send signed transaction: exchangeability");
  const receipt = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));

  var token =  await exchange.methods.tokensData(tkn).call();
  console.log("Is token exchangeable? " + token.exchangeable);
}

//// PROTOCOL FUNCTIONALITIES

export async function deposit(userAccount, amount, fakeID, web3, liquidityPool){

  const tknAdd = await web3.utils.toChecksumAddress(fakeID);
  await givePermissionToContract(web3, userAccount, amount, tknAdd);
  console.log("TRY DEPOSIT");
  const weiAmount = amount;
  await window.ethereum.enable();

  var txHash = null;
  try{
    await liquidityPool.methods.deposit(userAccount, weiAmount, tknAdd).send({from: userAccount}).on('transactionHash', function(hash){
        txHash = hash;
      })
  }catch(err){
    if( txHash != null){
      var str = " View on Etherscan. https://ropsten.etherscan.io/tx/"+txHash;
      alert("Transaction FAILED! "+ str);
    }else{
      alert("Transaction FAILED! Rejected from account");
    }
    return;
  }

  console.log("Deposit DONE");
  var str = " View on Etherscan. https://ropsten.etherscan.io/tx/"+txHash;
  alert("Transaction successfull! "+ str);


}

export async function borrow(userAccount, amount, fakeID, web3, liquidityPool){

  const tknAdd = await web3.utils.toChecksumAddress(fakeID);
  console.log("TRY Borrow");
  const weiAmount = amount;
  await window.ethereum.enable();
  web3.eth.handleRevert = false;
  var price = await liquidityPool.methods.tknsData(tknAdd).call();
  console.log("Price");
  console.log(price.price);


  // borrow(address payable user, uint amount, address tknId)
  var txHash = null;
  try{
    await liquidityPool.methods.borrow(userAccount, weiAmount, tknAdd).send({from: userAccount}).on('transactionHash', function(hash){
        txHash = hash;
      })
  }catch(err){
    if( txHash != null){
      var str = " View on Etherscan. https://ropsten.etherscan.io/tx/"+txHash;
      alert("Transaction FAILED! "+ str);
    }else{
      alert("Transaction FAILED! Rejected from account");
    }
    return;
  }

  console.log("Borrow DONE");
  var str = " View on Etherscan. https://ropsten.etherscan.io/tx/"+txHash;
  //alert("Transaction successfull! "+ str);
}

export async function depositCollateral(userAccount, amount, fakeID, web3, liquidityPool){

  const tknAdd = await web3.utils.toChecksumAddress(fakeID);
  await givePermissionToContract(web3, userAccount, amount, tknAdd);
  console.log("TRY DEPOSIT COLLATERAL");
  const weiAmount = amount;
  await window.ethereum.enable();
  // depositCollateral(address payable user, uint amount, address tknId)
  var txHash = null;
  try{
    await liquidityPool.methods.depositCollateral(userAccount, weiAmount, tknAdd).send({from: userAccount}).on('transactionHash', function(hash){
        txHash = hash;
      })
  }catch(err){
    if( txHash != null){
      var str = " View on Etherscan. https://ropsten.etherscan.io/tx/"+txHash;
      alert("Transaction FAILED! "+ str);
    }else{
      alert("Transaction FAILED! Rejected from account");
    }
    return;
  }

  console.log("DEPOSIT COLLATERAL DONE");
  var str = " View on Etherscan. https://ropsten.etherscan.io/tx/"+txHash;
  alert("Transaction successfull! "+ str);

}


//repay(address payable user, uint amount)
export async function repay(userAccount, amount, fakeID, web3, liquidityPool){

  const tknAdd = await web3.utils.toChecksumAddress(fakeID);
  await givePermissionToContract(web3, userAccount, amount, tknAdd);
  console.log("TRY REPAY");
  console.log(fakeID);
  const weiAmount = amount;
  await window.ethereum.enable();

  var txHash = null;
  try{
    await liquidityPool.methods.repay(userAccount, weiAmount).send({from: userAccount}).on('transactionHash', function(hash){
        txHash = hash;
      })
  }catch(err){
    if( txHash != null){
      var str = " View on Etherscan. https://ropsten.etherscan.io/tx/"+txHash;
      alert("Transaction FAILED! "+ str);
    }else{
      alert("Transaction FAILED! Rejected from account");
    }
    return;
  }

  console.log("REPAY DONE");
  var str = " View on Etherscan. https://ropsten.etherscan.io/tx/"+txHash;
  alert("Transaction successfull! "+ str);

}

export async function redeem(userAccount, amount, fakeID, web3, liquidityPool){

  const tknAdd = await web3.utils.toChecksumAddress(fakeID);
  console.log("TRY REDEEM");
  const weiAmount = amount;
  await window.ethereum.enable();
  var tknDetails = await liquidityPool.methods.tknsData(tknAdd).call();
  console.log("TOKEN OPT UR");
  console.log(tknDetails.utilisation);

  var txHash = null;
  try{
    await liquidityPool.methods.redeem(userAccount, weiAmount).send({from: userAccount}).on('transactionHash', function(hash){
        txHash = hash;
      })
  }catch(err){
    if( txHash != null){
      var str = " View on Etherscan. https://ropsten.etherscan.io/tx/"+txHash;
      alert("Transaction FAILED! "+ str);
    }else{
      alert("Transaction FAILED! Rejected from account");
    }
    return;
  }

  console.log("REDEEM DONE");
  var str = " View on Etherscan. https://ropsten.etherscan.io/tx/"+txHash;
  alert("Transaction successfull! "+ str);


}

export async function redeemCollateral(userAccount, amount, fakeID, web3, liquidityPool){

  const tknAdd = await web3.utils.toChecksumAddress(fakeID);
  console.log("TRY REDEEM");
  const weiAmount = amount;
  await window.ethereum.enable();
  var tknDetails = await liquidityPool.methods.tknsData(tknAdd).call();
  var txHash = null;
  try{
    await liquidityPool.methods.redeemCollateral(userAccount, weiAmount).send({from: userAccount}).on('transactionHash', function(hash){
        txHash = hash;
      })
  }catch(err){
    if( txHash != null){
      var str = " View on Etherscan. https://ropsten.etherscan.io/tx/"+txHash;
      alert("Transaction FAILED! "+ str);
    }else{
      alert("Transaction FAILED! Rejected from account");
    }
    return;
  }

  console.log("REDEEM COLLATERAL DONE");
  var str = " View on Etherscan. https://ropsten.etherscan.io/tx/"+txHash;
  alert("Transaction successfull! "+ str);


}

export async function liquidate(userToLiquidate, userAccount, web3, liquidityPool, tokenBorrowed, amoutBorrowed){

  console.log("TRY Liquidate");
  const tknAdd = await web3.utils.toChecksumAddress(tokenBorrowed);
  await givePermissionToContract(web3, userAccount, amoutBorrowed+amoutBorrowed, tknAdd);
  await window.ethereum.enable();
  var txHash = null;
  try{
    await liquidityPool.methods.liquidate(userToLiquidate).send({from: userAccount}).on('transactionHash', function(hash){
        txHash = hash;
      })
  }catch(err){
    if( txHash != null){
      var str = " View on Etherscan. https://ropsten.etherscan.io/tx/"+txHash;
      alert("Transaction FAILED! "+ str);
    }else{
      alert("Transaction FAILED! Rejected from account");
    }
    return;
  }

  console.log("Liquidation done");
  var str = " View on Etherscan. https://ropsten.etherscan.io/tx/"+txHash;
  alert("Transaction successfull! "+ str);


}

//exchange(address tokenGet, uint amountGet, address tokenGive, address user)
// exchange(this.state.userAddress, this.state.tokenGive, this.state.amountGive, this.state.tokenGet, this.state.web3, this.state.liquidityPool);
export async function exchange(userAccount, tokenGive, amountGive, tokenGet, web3, liquidityPool){
  const lminstance = new web3.eth.Contract(LiquidityManager_ABI, LiquidityManager_ADD);
  const decimals = BigInt("1000000000000000");
  const amountToTransfer = BigInt(amountGive*1000) * decimals;
  console.log("TRY Exchange");
  await window.ethereum.enable();
  var txHash = null;
  try{
    await lminstance.methods.exchange(tokenGive, amountToTransfer, tokenGet, userAccount).send({from: userAccount}).on('transactionHash', function(hash){
        txHash = hash;
    })
  }catch(err){
    if( txHash != null){
      var str = " View on Etherscan. https://ropsten.etherscan.io/tx/"+txHash;
      alert("Transaction FAILED! "+ str);
    }else{
      alert("Transaction FAILED! Rejected from account");
    }
    return;
  }

  console.log("Exchange done");
  var str = " View on Etherscan. https://ropsten.etherscan.io/tx/"+txHash;
  alert("Transaction successfull! "+ str);
}

//// API data

// returns [tknsList, {realID: {symbol: -, utilisationRate: -, collateral: -, baseRate: -, slope1:-, slope2:-, sread: -, price: -}]
export async function getTokenAPIData(){
  const url = "https://uniswapmyapi.herokuapp.com/interestRateVars";
  let respones = await fetch(url);
  let data = await respones.json();
  // create price dictionary and array of tkn ids
  let object = data;
  let tmprData = {};
  let tknsList = [];
  // for every tkn build dictionary entry id:[symbol, price]
  // and array of tkn's ids
  var i;
  for(i = 0; i < 226; i++){
    let id = object[i]["id"];
    tknsList.push(id);
    let symbol = object[i]["symbol"];
    let utilisationRate = object[i]["utilisationRate"];
    let collateral = Math.round(object[i]["collateral"]);
    let baseRate = object[i]["baseRate"];
    let slope1 = object[i]["slope1"];
    let slope2 = object[i]["slope2"];
    let spread = object[i]["spread"];
    tmprData[id] = {symbol: symbol, utilisationRate: utilisationRate, collateral: collateral, baseRate: baseRate, slope1: slope1, slope2: slope2, spread: spread};
  }
  return [tknsList,tmprData];

}

// add deployed tkn to the server list of Loadedtkns
export async function registerLoadedToken(symbol, realID, fakeID){
  const url = "https://uniswapmyapi.herokuapp.com/loadedTokens";
  const data = {symbol: symbol, realID: realID, fakeID: fakeID};
  const options = {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  };
  let response = await fetch(url, options);
  console.log("This is the loadedtkns api post response");
  console.log(response);
}

// get loaded tkns from API
export async function getLoadedTokens(){
  const url = "https://uniswapmyapi.herokuapp.com/loadedTokens";
  let respones = await fetch(url);
  let data = await respones.json();
  if(data.loadedTokens == undefined){
    return [];
  }
  return data.loadedTokens;
}

export async function getTokenAPIPrice(realID){
  const url = 'https://uniswapmyapi.herokuapp.com/tokenPriceUSD/' + realID;
  let respones = await fetch(url);
  let data = await respones.json();
  // create price dictionary and array of tkn ids
  return data["priceOfToken"].toFixed(3);
}
