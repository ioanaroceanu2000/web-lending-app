import React, {Component} from 'react';
import Web3 from 'web3';
import {Container, Row, Col, Navbar, Button, Form} from 'react-bootstrap';
import logo from './logo.png';
import {IRVAR_ABI, IRVAR_ADD,LiquidityPool_ABI, LiquidityPool_ADD, Exchange_ADD, Exchange_ABI, ERC20_ABI, Token_ABI, Token_BYTECODE } from './abis/abi'
import {loadWeb3, getAccount, getUserDeposit, getUserLoanDetails, getTokenAPIPrice, liquidate, exchange, updateExchangePricesFromOwner, switchToUnexchangable} from './utils.js';


class Liquidation extends Component {

  constructor(props) {
    // props: tokens list {fakeID, realID, symbol}
    // prices fakeID: price
    super(props);
    this.state = {
      liquidityPool: null,
      web3: null,
      userAddress: null,
      toBeLiquidated: null,
      loadingL: true,
      tokenGet: "0x690C32B710EeC4ab0C12e5290E2a38137174d13a",
      tokenGive: "0x690C32B710EeC4ab0C12e5290E2a38137174d13a",
      amountGive: null,
      toBeUnex: null,
    };
  }

  componentWillMount(){
    this.loadBlockchainData();
  }


  async loadBlockchainData(){
    const web3 = await loadWeb3();
    const account = await getAccount(web3);
    //initialise instance of LP contract
    const lpinstance = new web3.eth.Contract(LiquidityPool_ABI, LiquidityPool_ADD, {transactionConfirmationBlocks: 1});
    this.setState({liquidityPool: lpinstance, userAddress: account, web3: web3, loadingL: false});
  }

  handleChangeAddress = (e) => {
    this.setState({toBeLiquidated: e.target.value});
  }

  handleTokenGive = (e) => {
    this.setState({tokenGive: e.target.value});
  }

  handleTokenGet = (e) => {
    this.setState({tokenGet: e.target.value});
  }

  handleAmountGive = (e) => {
    this.setState({amountGive: e.target.value});
  }

  handleUnex = (e) => {
    this.setState({toBeUnex: e.target.value});
  }

  async liquidateUser(){
    if(this.state.toBeLiquidated != null){
      var victimDetails = await this.state.liquidityPool.methods.uBal(this.state.toBeLiquidated).call();
      var tokenBorrowed = victimDetails.tknBorrowed;
      var amountBorrowed = victimDetails.borrowedAmount;
      var tokenCollateral = victimDetails.tknCollateralised;
      const exchange = new this.state.web3.eth.Contract(Exchange_ABI, Exchange_ADD);
      await updateExchangePricesFromOwner(this.state.web3, exchange, tokenBorrowed, this.props.prices[tokenBorrowed]);
      await updateExchangePricesFromOwner(this.state.web3, exchange, tokenCollateral, this.props.prices[tokenCollateral]);
      await liquidate(this.state.toBeLiquidated, this.state.userAddress, this.state.web3, this.state.liquidityPool, tokenBorrowed, amountBorrowed);
    }
  }

  async switchToUnexchangable(){
    if(this.state.toBeUnex != null){
      await switchToUnexchangable(this.state.toBeUnex);
    }
  }

  optionsGet(size){
    var tokenOptions = [];
    var i =0;
    const len = this.props.tokens.length;
    for(i=0; i < len; i++){
      const fakeId = this.props.tokens[i]["fakeID"];
      const symbol = this.props.tokens[i]["symbol"];
      tokenOptions.push(<option value={fakeId}>{symbol}</option>);
    }
    // this is for the second form from the collateral view
    return (
    <Form.Group controlId="exampleForm.ControlSelect1" style={{width:"100px"}} className="topTokenInput">
      <Form.Label>Token Get</Form.Label>
      <Form.Control size={size} as="select" className="tokenInput" onChange={ this.handleTokenGet }>
        {tokenOptions}
      </Form.Control>
    </Form.Group>
  );
  }

  optionsGive(size){
    var tokenOptions = [];
    var i =0;
    const len = this.props.tokens.length;
    for(i=0; i < len; i++){
      const fakeId = this.props.tokens[i]["fakeID"];
      const symbol = this.props.tokens[i]["symbol"];
      tokenOptions.push(<option value={fakeId}>{symbol}</option>);
    }
    // this is for the second form from the collateral view
    return (
    <Form.Group controlId="exampleForm.ControlSelect1" style={{width:"100px"}} className="topTokenInput">
      <Form.Label>Token Give</Form.Label>
      <Form.Control size={size} as="select" className="tokenInput"  onChange={ this.handleTokenGive }>
        {tokenOptions}
      </Form.Control>
    </Form.Group>
  );
  }

  options(size){
    var tokenOptions = [];
    var i =0;
    const len = this.props.tokens.length;
    for(i=0; i < len; i++){
      const fakeId = this.props.tokens[i]["fakeID"];
      const symbol = this.props.tokens[i]["symbol"];
      tokenOptions.push(<option value={fakeId}>{symbol}</option>);
    }
    // this is for the second form from the collateral view
    return (
    <Form.Group controlId="exampleForm.ControlSelect1" style={{width:"100px"}} className="topTokenInput">
      <Form.Control size={size} as="select" className="tokenInput"  onChange={ this.handleUnex }>
        {tokenOptions}
      </Form.Control>
    </Form.Group>
  );
  }

  async exchangeLM(){
    if(this.state.tokenGet != null && this.state.tokenGive != null){
      await exchange(this.state.userAddress, this.state.tokenGive, this.state.amountGive, this.state.tokenGet, this.state.web3, this.state.liquidityPool);
    }
  }

  render() {
    if(this.state.loadingL){
      return(
        <div>loading...</div>
      );
    }
      return (
        <div className="container">
        <Container className="container">
        <Row className="add-token-row">
          <Col><h4 style={{marginTop:"7px"}}>Liquidate</h4></Col>

          <Col>
          <Form className="inputField">
            <Form.Group controlId="formBasicEmail" className="topValueInput">
              <Form.Control size="sm" type="email" placeholder="e.g 0x6799..." className="valueInput" onChange={ this.handleChangeAddress }/>
            </Form.Group>
          </Form>
          </Col>

          <Col>
          <button className="button-addToken"
              type="button"
              style={{marginTop:"5px"}}
              onClick={this.liquidateUser.bind(this)}
          >Liquidate account</button>
          </Col>
        </Row>
        </Container>

        <Container className="container">
        <Row className="add-token-row">
          <Col><h4 style={{marginTop:"35px"}}>Exchange</h4></Col>
          <Col>
          <Form className="inputField" style={{marginTop:"7px"}}>
            {this.optionsGive("sm")}
          </Form>
          </Col>

          <Col>
          <Form className="inputField" style={{marginTop:"40px"}}>
            <Form.Group controlId="formBasicEmail" className="topValueInput">
              <Form.Control size="sm" type="email" placeholder="Amount To Give" className="valueInput" onChange={ this.handleAmountGive }/>
            </Form.Group>
          </Form>
          </Col>

          <Col>
          <Form className="inputField" style={{marginTop:"7px"}}>
            {this.optionsGet("sm")}
          </Form>
          </Col>

          <Col>
          <button className="button-addToken"
              type="button"
              style={{marginTop:"32px"}}
              onClick={this.exchangeLM.bind(this)}
          >Exchange</button>
          </Col>
        </Row>
        </Container>

        <Container className="container">
        <Row className="add-token-row">
          <Col><h4 style={{marginTop:"7px"}}>Notify illiquid</h4></Col>
          <Col>
          <Form className="inputField" style={{marginTop:"7px"}}>
            {this.options("sm")}
          </Form>
          </Col>

          <Col>
          <button className="button-addToken"
              type="button"
              style={{marginTop:"7px"}}
              onClick={this.switchToUnexchangable.bind(this)}
          >Notify</button>
          </Col>
        </Row>
        </Container>

        </div>
      );

  }
}
export default Liquidation;
