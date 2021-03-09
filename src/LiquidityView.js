import React, {Component} from 'react';
import './Balance.css';
import Web3 from 'web3';
import {Container, Row, Col} from 'react-bootstrap';
import logo from './logo.png';
import {IRVAR_ABI, IRVAR_ADD,LiquidityPool_ABI, LiquidityPool_ADD, Exchange_ADD, Exchange_ABI, ERC20_ABI, Token_ABI, Token_BYTECODE } from './abis/abi'
import {loadWeb3, getAccount, getUserDeposit, getUserLoanDetails, getTokenAPIPrice} from './utils.js';
import './LiquidityView.css';
/* global BigInt */


class LiquidityView extends Component {

  constructor(props) {
    // props fakeID token
    // props symbol
    super(props);
    this.state = {
      isLoaded: false,
      liquidityPool: null,
      web3: null,
      reloadedBalance: false,
      totalBorrowed: 0,
      totalDeposited: 0,
      utilisation: 0,
      totalCollateral: 0,
      reserves: 0,
    };
  }

  componentWillMount(){
    this.loadBlockchainData();
  }


  async loadBlockchainData(){
    const web3 = await loadWeb3();
    const account = await getAccount(web3);
    //initialise instance of LP contract
    const lpinstance = new web3.eth.Contract(LiquidityPool_ABI, LiquidityPool_ADD);
    this.setState({liquidityPool: lpinstance,web3: web3});
    await this.renderLiquidity(web3, lpinstance);
  }

  async renderLiquidity(web3, lpinstance){
    const tokenAdd = await web3.utils.toChecksumAddress(this.props.fakeID);
    // reserves
    const tokenInstance = new web3.eth.Contract(ERC20_ABI, tokenAdd);
    var reserves = await tokenInstance.methods.balanceOf(LiquidityPool_ADD).call();
    reserves = Number(BigInt(reserves)/BigInt(10n**15n))/1000;
    // total deposited
    const tokensdata = await lpinstance.methods.tknsData(tokenAdd).call();
    const ivar = await new web3.eth.Contract(IRVAR_ABI, IRVAR_ADD);
    const irvardata = await ivar.methods.tokens(tokenAdd).call();
    console.log(irvardata.optimal_utilisation);
    const totalDeposited = Number(BigInt(tokensdata.totalDeposited)/BigInt(10n**15n))/1000;
    const totalBorrowed = Number(BigInt(tokensdata.totalBorrowed)/BigInt(10n**15n))/1000;
    const totalCollateral = Number(BigInt(tokensdata.totalCollateral)/BigInt(10n**15n))/1000;
    this.setState({reserves: reserves, totalDeposited: totalDeposited, totalBorrowed: totalBorrowed, totalCollateral: totalCollateral});
    console.log("Finished loading");
  }

  render() {
    var wDep = 0;
    var wRes = 0;
    var wColl = 0;
    var wBorr = 0;
    if(this.state.totalDeposited > this.state.reserves && this.state.totalDeposited != 0){
      wDep = 100;
      wRes = (this.state.reserves*100)/this.state.totalDeposited;
      wColl = (this.state.totalCollateral*100)/this.state.totalDeposited;
      wBorr = (this.state.totalBorrowed*100)/this.state.totalDeposited;
    }else if(this.state.reserves != 0){
      wRes = 100;
      wDep = (this.state.totalDeposited*100)/this.state.reserves;
      wColl = (this.state.totalCollateral*100)/this.state.reserves;
      wBorr = (this.state.totalBorrowed*100)/this.state.reserves;
    }
    wRes = Math.round(wRes).toString() + "%";
    wDep = Math.round(wDep).toString() + "%";
    wColl =Math.round(wColl).toString() + "%";
    wBorr = Math.round(wBorr).toString() + "%";
    console.log(wDep+','+wRes+','+wColl);
    const styleRes = {
      width: wRes
    };
    const styleDep = {
      width: wDep
    };
    const styleColl = {
      width: wColl
    };
    const styleBorr = {
      width: wBorr
    };


      return (
        <div>
        <Container className="token-details">
          <Row className="rows">
          <Col lg={4} className="column">
            <div className="total-deposited">Total Depoisted: {this.state.totalDeposited}  {this.props.symbol}</div>
          </Col>
          <Col lg={7} className="columnBar">
            <div className="bar" style={styleDep}></div>
          </Col>
          </Row>
        </Container>

        <Container className="token-details">
          <Row className="rows">
          <Col lg={4} className="column">
          <div className="total-deposited">Total Borrowed: {this.state.totalBorrowed}  {this.props.symbol}</div>
          </Col>
          <Col lg={7} className="columnBar">
            <div className="bar" style={styleBorr}></div>
          </Col>
          </Row>
        </Container>

        <Container className="token-details">
          <Row className="rows">
          <Col lg={4} className="column">
          <div className="total-deposited">Total Collateral: {this.state.totalCollateral}  {this.props.symbol}</div>
          </Col>
          <Col lg={7} className="columnBar">
            <div className="bar" style={styleColl}></div>
          </Col>
          </Row>
        </Container>

        <Container className="token-details last">
          <Row className="rows">
          <Col lg={4} className="column">
          <div className="total-deposited">Total Reserves: {this.state.reserves}  {this.props.symbol}</div>
          </Col>
          <Col lg={7} className="columnBar">
            <div className="bar" style={styleRes}></div>
          </Col>
          </Row>
        </Container>
        </div>
    )
  }
}
export default LiquidityView;
