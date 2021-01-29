import React, {Component} from 'react';
import Web3 from 'web3';
import {Transaction} from 'ethereumjs-tx';
import {Container, Row, Col, Navbar, Button, Form} from 'react-bootstrap';
import {LiquidityPool_ABI, LiquidityPool_ADD, Exchange_ADD, Exchange_ABI, ERC20_ABI, Token_ABI, Token_BYTECODE } from './abis/abi'
import './price_update.css';

class PriceUpdate extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoaded: false,
      tokensLoaded: false,
      pricesDict: {}, // this is a dictionary realID -> [name,price]
      tokenIDs: [],
      seconds: 0,
      liquidityPool: null,
      exchange: null,
      web3: null,
      noLoadedTokens: 50
    };
  }

  ///// UTILS
  // deploy the code for a token and return its address
  async depolyToken(name, symbol, web3){
    //create contract and depoly
    var contract = new web3.eth.Contract(Token_ABI);
    const account = await web3.utils.toChecksumAddress('0x614114ec0a5a6def6172d8cb210facb63d459c04');
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

  // give token from owner to another account
  async giveTokenTo(account, owner, tokenInstance, amount){
    //send tokens to adresses
    let value = this.state.web3.utils.toHex(amount);
    await tokenInstance.methods.transfer(account, value).send({from: owner}).on('transactionHash', function(hash){
        //console.log(hash);
      });
    var balance;
    await tokenInstance.methods.balanceOf(account).call().then(res =>{ balance = res; });
  }

  // give permission to contract to retreive tokens
  async givePermissionToContract(account, privateKey, contractAddress, amount, tokenInstance, tokenAddress){
    var nonce = await this.state.web3.eth.getTransactionCount(account);
    const rawTx = {
      nonce: nonce,
      from: account,
      to: tokenAddress,
      gasLimit: this.state.web3.utils.toHex(200000),
      data: tokenInstance.methods.approve(contractAddress, amount).encodeABI()
    };
    // private key of the second account
    var privateKey = new Buffer(privateKey, 'hex');
    var tx = new Transaction(rawTx);
    tx.sign(privateKey);
    var serializedTx = tx.serialize();
    this.state.web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('receipt', console.log);
  }

  componentWillMount(){
    //this.leadBlockchainData();
  }

  async updatePricesFromOwner(token, web3, account){

    const privateKey = new Buffer('8ba9b5140d9b73afbdbb177247abe308242eaa55a955a52f7ebf2c2ca8aae99a', 'hex');
    var nonce = await web3.eth.getTransactionCount(account);
    const gasLimit = await web3.utils.toHex(2000000);
    const data = await this.state.exchange.methods.updatePrice(token, 800).encodeABI();
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

  async updateContractsPrices(token, web3, account){

    const tokenAddress = await web3.utils.toChecksumAddress(token);
    // update exchange prices
    await window.ethereum.enable();
    await this.state.exchange.methods.updatePrice(token, 800).send({from: account});
    // update liquidity pool prices
    await window.ethereum.enable();
    await this.state.liquidityPool.methods.updateTokenPrice(token).send({from: account});
    const priceExchange = await this.state.exchange.methods.getPrice(tokenAddress).call();
    console.log("this is the current price in the exchange");
    console.log(priceExchange);
  }

  async leadBlockchainData(){
    const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
    //this.setState({web3: web3});
    const network = await web3.eth.net.getNetworkType();
    console.log("network:",network);
    const lpinstance = new web3.eth.Contract(LiquidityPool_ABI, LiquidityPool_ADD);
    const exinstance = new web3.eth.Contract(Exchange_ABI, Exchange_ADD);
    this.setState({liquidityPool: lpinstance, exchange: exinstance});

    // create the token (deploy and create pool in LP and exchange)
    /*var address = await this.createToken(web3,'Weth',80, 70, 0, 7, 200, 1, 490);*/
    const address = await web3.utils.toChecksumAddress('0xc91acB1Ad59E1d839bF3556A8Ec8d62129E24319');
    console.log("This is the token's address");
    console.log(address);
    const account = await web3.utils.toChecksumAddress('0x614114ec0a5a6def6172d8cb210facb63d459c04');
    await this.updatePricesFromOwner(address, web3, account);

    console.log("NOw we are asking for the price");
    await window.ethereum.enable();
    const priceExchange = await this.state.exchange.methods.getPrice(address).call();
    console.log("this is the current price in the exchange");
    console.log(priceExchange);
    //await this.updateContractsPrices(address, web3, account);
  }



  async createToken(web3, _symbol, _optimal_utilisation, _collateral_factor, _base_rate, _slope1, _slope2, _spread, _price){
    var address = await this.depolyToken(_symbol,_symbol,web3);
    // create pool in exchange
    const account = await web3.utils.toChecksumAddress('0x614114ec0a5a6def6172d8cb210facb63d459c04');
    await window.ethereum.enable();
    console.log("Create the pool in Exchange");
    await this.state.exchange.methods.createPool(address,_price,_symbol).send({from: account});
    // create token in LiquidityPool
    await window.ethereum.enable();
    console.log("Create the pool in LP");
    await this.state.liquidityPool.methods.createToken( _symbol,address,_optimal_utilisation,_collateral_factor, _base_rate,_slope1,_slope2,_spread,_price).send({from: account});
    return address;
  }


  componentDidMount() {
    this.interval = setInterval(() => this.setState({ seconds: this.state.seconds + 10 }), 30000);
  }
  componentWillUnmount() {
    clearInterval(this.interval);
  }

  componentDidUpdate(prevProps, prevState) {
    // make an API request only if 5 minutes passed - 30 seconds
    if(prevState.seconds != this.state.seconds){
      const url = "https://uniswapmyapi.herokuapp.com/tokenPrices";
      fetch(url)
      .then(res => res.json())
      .then((data) => {

        if(!this.state.tokensLoaded){ // create price dictionary and array of token ids
          let object = data.prices;
          let tmprIDs = [];
          let tmprPrices = {};
          // for every token build dictionary entry id:[symbol, price]
          // and array of token's ids
          var i;
          for(i = 0; i < 300; i++){
            let id = object[i]["id"];
            tmprIDs.push(id);
            let symbol = object[i]["symbol"];
            let price = object[i]["prices"];
            tmprPrices[id] = [symbol, price];
          }
          this.setState({tokenIDs: tmprIDs, pricesDict: tmprPrices, tokensLoaded: true });

        }else { // update prices from dictionary
          let object = data.prices;
          let copyDict = {...this.state.pricesDict};
          var i;
          for(i = 0; i < 300; i++){
            let tokenId = this.state.tokenIDs[i];
            // !!!! assuming the API data is in the same order as the tokenIds array
            copyDict[tokenId][1] = object[i]["prices"];
          }
          this.setState({pricesDict: copyDict});
        }
        this.setState({isLoaded: true});
      })
      .catch(console.log);
    }

  }

  displayTokenDetails(tokenID){
    return(
      <Row className="token-details-row">
        <Col lg={6} className="column symbol">{this.state.pricesDict[tokenID][0]}</Col>
        <Col lg={2} className="column symbol">3.15%</Col>
        <Col lg={2} className="column symbol">4.12%</Col>
        <Col lg={2} className="column symbol">{this.state.pricesDict[tokenID][1].toFixed(4)}</Col>
      </Row>
    )
  }

  displayAllTokenDetails(noToLoad){
    let allTokensDetails = [];
    var i;
    for(i=0; i < noToLoad; i++){
      allTokensDetails.push(this.displayTokenDetails(this.state.tokenIDs[i]));
    }
    return allTokensDetails;
  }

  loadMore(){
    this.setState({noLoadedTokens: this.state.noLoadedTokens + 50});
  }

  showLoadMoreButton(){
    if(this.state.noLoadedTokens < 300){
      return(<button className="button-loadMore" type="button" onClick={(e) => this.loadMore()}>Load 50 more...</button>);
    }
  }

  displayAddTokenOption(){
    var tokenOptions = [];
    var i =0;
    for(i=0; i < 300; i++){
      const tokenID = this.state.tokenIDs[i];
      const symbol = this.state.pricesDict[tokenID][0];
      tokenOptions.push(<option>{symbol}</option>);
    }
    return(
    <Row className="add-token-row">
      <Col><h4 style={{marginTop:"7px"}}>Add pool to protocol</h4></Col>

      <Col>
        <Form>
        <Form.Group>
          <Form.Control size="md" as="select" style={{marginTop:"5px"}}>
          {tokenOptions}
          </Form.Control>
        </Form.Group>
        </Form>
      </Col>

      <Col>
      <button className="button-addToken" type="button" style={{marginTop:"5px"}}>Add Pool</button>
      </Col>
    </Row>
  );
  }

  render() {
    const updatedTokenList = this.state.tokenIDs.map((token)=>{
      return(
              <li key={token.toString()}>
                  {this.state.pricesDict[token][0]} : {this.state.pricesDict[token][1]}
              </li>
          );
    });

    var isLoaded = this.state.isLoaded;

    if (!isLoaded){
      return(<div>Loading...</div>);
    }
    else{
      return (
        <div className="container">
          <Row><h2 className="markets">Markets</h2></Row>
          <Row className="heading-details-row">
            <Col lg={6} className="details-headings">Symbol</Col>
            <Col lg={2} className="details-headings">Deposit APY</Col>
            <Col lg={2} className="details-headings">Borrow APY</Col>
            <Col lg={2} className="details-headings">Price</Col>
          </Row>
          {this.displayAllTokenDetails(this.state.noLoadedTokens)}
          <Row>
          {this.showLoadMoreButton()}
          </Row>

          {this.displayAddTokenOption()}
        </div>
      );
    }


  }



}

export default PriceUpdate;
