import React, {Component} from 'react';
import './Balance.css';
import PriceUpdate from './price_update';
import Web3 from 'web3';
import {Container, Row, Col, Navbar} from 'react-bootstrap';
import logo from './logo.png';
import {LiquidityPool_ABI, LiquidityPool_ADD, Exchange_ADD, Exchange_ABI, ERC20_ABI, Token_ABI, Token_BYTECODE } from './abis/abi'
import {loadWeb3, getAccount, getUserDeposit, getUserLoanDetails, getTokenAPIPrice} from './utils.js';


class Balance extends Component {

  constructor(props) {
    // props should be list of token's symbols
    super(props);
    this.state = {
      userAddress: null,
      userDeposit: 0,
      depositedToken: '',
      userCollateral: 0,
      collateralToken: '',
      userOwed: 0,
      owedToken:'',
      liquidityPool: null,
      web3: null,
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
    this.setState({liquidityPool: lpinstance, userAddress: account, web3: web3});

    await this.renderBalance(web3);
  }

  async renderBalance(web3){
    const [depositValue, depFakeTokenID] = await getUserDeposit(web3,this.state.userAddress, this.state.liquidityPool);
    const [collateral, collFakeTokenID, owed, borrFakeTokenID] = await getUserLoanDetails(web3,this.state.userAddress, this.state.liquidityPool);
    this.setState({userDeposit: depositValue, userCollateral: collateral, userOwed: owed});
    this.setState({depositedToken: depFakeTokenID, collateralToken: collFakeTokenID, owedToken: borrFakeTokenID});
  }

  render() {

    let deposit = '';
    let depositToken = 'NO DEPOSIT';
    let depositDollars = 0;
    if(this.state.depositedToken != ''){
      deposit = this.state.userDeposit;
      depositToken = this.state.depositedToken;
      let realID = this.props.tokens[depositToken].realID;
      depositDollars = deposit*this.props.tokens[depositToken].price;
    }

    let collateral = '';
    let collToken = 'NO COLLATERAL';
    let collDollars = 0;
    if(this.state.collateralToken != ''){
      collateral = this.state.userCollateral;
      collToken = this.state.collateralToken;
      let realID = this.props.tokens[collToken].realID;
      collDollars = collateral*this.props.tokens[collToken].price;
    }

    let loan = '';
    let loanToken = 'NO LOAN';
    let loanDollars = 0;
    if(this.state.owedToken != ''){
      loan = this.state.userOwed;
      loanToken = this.state.owedToken;
      let realID = this.props.tokens[loanToken].realID;
      loanDollars = loan*this.props.tokens[loanToken].price;
    }

    return (
      <div className="container">

      <div className="box">
      <Container className="container">
        <Row className="rows">
          <Col sm={4}>
            <div className="action-name">Deposit:</div>
          </Col>
          <Col sm={8} >
            <div className="deposit-value">${depositDollars}</div>
            <div className="deposit-token">{deposit} {depositToken}</div>
          </Col>
        </Row>
      </Container>

      <br/>

      </div>
      <div className="box">
      <Container className="container">

        <h4 className="loan-heading">Loan</h4>
        <hr/>
        <Row>
          <Col sm={4}>
            <div className="action-name">Collateral:</div>
          </Col>
          <Col sm={8} >
            <div className="deposit-value">${collDollars}</div>
            <div className="deposit-token">{collateral} {collToken}</div>
          </Col>
        </Row>
        <Row>
          <Col sm={4}>
            <div className="action-name">Owed:</div>
          </Col>
          <Col sm={8} >
            <div className="deposit-value">${loanDollars}</div>
            <div className="deposit-token">{loan} {loanToken}</div>
          </Col>
        </Row>

      </Container>
      </div>
      </div>
    );
  }
}
export default Balance;
