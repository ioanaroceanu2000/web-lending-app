import Web3 from 'web3';
import {LiquidityPool_ABI, LiquidityPool_ADD, Exchange_ADD, Exchange_ABI, ERC20_ABI, Token_ABI, Token_BYTECODE } from './abis/abi'


// returns realID: [symbol, prices]
export async function getTokenAPIPrices(){
  const url = "https://uniswapmyapi.herokuapp.com/tokenPrices";
  let response = await fetch(url);
  let data = await response.json();
  // create price dictionary and array of token ids
  let object = data.prices;
  let tmprPrices = {};
  // for every token build dictionary entry id:[symbol, price]
  // and array of token's ids
  var i;
  for(i = 0; i < 300; i++){
    let id = object[i]["id"];
    let symbol = object[i]["symbol"];
    let price = object[i]["prices"];
    tmprPrices[id] = [symbol, price];
  }
  return tmprPrices;

}
