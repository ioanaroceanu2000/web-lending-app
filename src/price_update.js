import React, {Component} from 'react';
import Web3 from 'web3';
import {Transaction} from 'ethereumjs-tx';
import {Container, Row, Col, Navbar, Button, Form} from 'react-bootstrap';
import {LiquidityPool_ABI, LiquidityPool_ADD, Exchange_ADD, Exchange_ABI, ERC20_ABI, Token_ABI, Token_BYTECODE } from './abis/abi'
import './price_update.css';
import {getTokenAPIPrices} from './priceUpdate.js';
import {getTokenRates} from './utils.js';
import LiquidityView from './LiquidityView.js';


class PriceUpdate extends Component {

  constructor(props) {
    super(props);
    // props: prices realID -> [symbol,price]
    // props: loadedTokens [realIDs]
    // props: realToFakeID real:fake
    this.state = {
      isLoaded: false,
      tokenIDs: [],
      seconds: 0,
      liquidityPool: null,
      exchange: null,
      web3: null,
      noLoadedTokens: 50,
      interestRates: {}, // realID -> {borrowIR, depositIR}
      showLiquidity: {},
      reloadedBalance: false,
    };
  }

  componentWillMount(){
    this.loadBlockchainData();
  }

  async registerTokensIR(){
    let interestRates = {}
    var i;
    for(i=0; i < this.props.loadedTokens.length; i++){
      const fakeID = this.props.realToFakeID[this.props.loadedTokens[i]];
      var [borrowir, depoir] = await getTokenRates(this.state.web3, fakeID, this.state.liquidityPool);
      interestRates[this.props.loadedTokens[i]] = {borrowIR: borrowir, depositIR: depoir};
    }
    this.setState({interestRates: interestRates});
  }

  /*async uploadPrices(){
    const prices = await getTokenAPIPrices();
    this.setState({pricesDict: prices, isLoaded:true});
    this.props.handleChangedPrices(this.state.pricesDict);
  }*/

  componentWillUpdate(){
    console.log("COMPONENT DID UPDATE");
    if(this.state.reloadedBalance == this.props.switchBalance){
      console.log("Balance switch equal");
      this.setState({reloadedBalance: !this.props.switchBalance});
      this.registerTokensIR();
    }
  }

  async loadBlockchainData(){
    const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
    //this.setState({web3: web3});
    const network = await web3.eth.net.getNetworkType();
    const lpinstance = new web3.eth.Contract(LiquidityPool_ABI, LiquidityPool_ADD);
    const exinstance = new web3.eth.Contract(Exchange_ABI, Exchange_ADD);
    this.setState({liquidityPool: lpinstance, exchange: exinstance, web3: web3});
    await this.registerTokensIR();
    this.setState({isLoaded: true});
  }


/*  componentDidMount() {
    this.interval = setInterval(() => this.setState({ seconds: this.state.seconds + 10 }), 30000);
  }
  componentWillUnmount() {
    clearInterval(this.interval);
  }*/

  componentDidUpdate(prevProps, prevState) {
    // make an API request only if 5 minutes passed - 30 seconds
    /*if(prevState.seconds != this.state.seconds){
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
    }*/

  }

  displayTokenDetails(tokenID){
    const borrowIR = this.state.interestRates[tokenID].borrowIR;
    const depositIR = this.state.interestRates[tokenID].depositIR;
    return(
      <div>
      <Row className="token-details-row">
        <Col lg={6} className="column symbol"><button type="button" className="show-liquidity" onClick={(e) => this.switchShowLiquidity(tokenID)}>{this.props.prices[tokenID][0]}</button>
        </Col>
        <Col lg={2} className="column symbol">{depositIR/100}%</Col>
        <Col lg={2} className="column symbol">{borrowIR/100}%</Col>
        <Col lg={2} className="column symbol">{this.props.prices[tokenID][1].toFixed(4)}</Col>
      </Row>
      {this.showLiquidity(tokenID)}
      </div>
    )
  }

  switchShowLiquidity(tokenID){
    const fakeID = this.props.realToFakeID[tokenID];
    var newShowLiq = { ...this.state.showLiquidity}; //create a new copy
    if(this.state.showLiquidity[fakeID] == null || this.state.showLiquidity[fakeID] == true){
      newShowLiq[fakeID] = false;
      this.setState({showLiquidity: newShowLiq});
    }else if(this.state.showLiquidity[fakeID] == false){
      newShowLiq[fakeID] = true;
      this.setState({showLiquidity: newShowLiq});
    }
  }

  showLiquidity(tokenID){
    const fakeID = this.props.realToFakeID[tokenID];
    if(this.state.showLiquidity[fakeID] == false){
      return (
        <Row className="liquidity-details">
        <Col><LiquidityView fakeID={fakeID} symbol={this.props.prices[tokenID][0]}/></Col>
        </Row>
      );
    }
  }

  displayAllTokenDetails(noToLoad){
    let allTokensDetails = [];
    var i;
    if(this.props.loadedTokens.length < noToLoad){
      noToLoad = this.props.loadedTokens.length;
    }
    for(i=0; i < noToLoad; i++){
      allTokensDetails.push(this.displayTokenDetails(this.props.loadedTokens[i]));
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


  render() {
    const updatedTokenList = this.state.tokenIDs.map((token)=>{
      return(
              <li key={token.toString()}>
                  {this.props.prices[token][0]} : {this.props.prices[token][1]}
              </li>
          );
    });

    var isLoaded = this.state.isLoaded;



    if (!isLoaded){
      return(<div>Loading...</div>);
    }
    else{
      const displayTokens = this.displayAllTokenDetails(this.state.noLoadedTokens);
      return (
        <div className="container">
          <Row><h2 className="markets">Markets</h2></Row>
          <Row className="heading-details-row">
            <Col lg={6} className="details-headings">Symbol</Col>
            <Col lg={2} className="details-headings">Deposit APY</Col>
            <Col lg={2} className="details-headings">Borrow APY</Col>
            <Col lg={2} className="details-headings">Price</Col>
          </Row>
          {displayTokens}
          <Row>
          {this.showLoadMoreButton()}
          </Row>

        </div>
      );
    }


  }



}

export default PriceUpdate;
