import React, {Component} from 'react';
import './Balance.css';
import PriceUpdate from './price_update';
import Web3 from 'web3';
import {Container, Row, Col, Navbar} from 'react-bootstrap';
import logo from './logo.png';
import {IRVAR_ABI, IRVAR_ADD,LiquidityPool_ABI, LiquidityPool_ADD, Exchange_ADD, Exchange_ABI, ERC20_ABI, Token_ABI, Token_BYTECODE } from './abis/abi'
import {loadWeb3, getAccount, getUserDeposit, getUserLoanDetails, getTokenAPIPrice} from './utils.js';


class Balance extends Component {

  constructor(props) {
    // props should be list of token's symbols
    super(props);
    this.state = {
      isLoaded: false,
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
    this.setState({isLoaded: true});
  }

  async renderBalance(web3){
    const ivarINstance = new this.state.web3.eth.Contract(IRVAR_ABI, IRVAR_ADD);
    const tokenAdd = await this.state.web3.utils.toChecksumAddress("0xb6186735ed018f39b1c7dc07644227a5b28a68dd");
    const tokenData = await ivarINstance.methods.tokens(tokenAdd).call();
    console.log("This is what IVAR knows about YFI");
    console.log(tokenData.token_address);
    const [depositValue, depFakeTokenID] = await getUserDeposit(web3,this.state.userAddress, this.state.liquidityPool);
    const loanDetils = await getUserLoanDetails(web3,this.state.userAddress, this.state.liquidityPool);
    const collateral = loanDetils[0];
    const collFakeTokenID = loanDetils[1];
    const owed = loanDetils[2];
    const borrFakeTokenID = loanDetils[3];
    this.setState({userDeposit: depositValue, userCollateral: collateral, userOwed: owed});
    this.setState({depositedToken: depFakeTokenID, collateralToken: collFakeTokenID, owedToken: borrFakeTokenID});
  }

  render() {

    if(this.state.isLoaded){

      let deposit = '';
      let depositToken = 'NO DEPOSIT';
      let depositDollars = 0;
      if(this.state.depositedToken != ''){
        deposit = this.state.userDeposit;
        const fakeID = this.state.depositedToken.toLowerCase();
        depositToken = this.props.tokens[fakeID]["symbol"];
        let realID = this.props.tokens[fakeID].realID;
        depositDollars = deposit*this.props.tokens[fakeID].price;
      }

      let collateral = '';
      let collToken = 'NO COLLATERAL';
      let collDollars = 0;
      if(this.state.collateralToken != ''){
        collateral = this.state.userCollateral;
        const fakeID = this.state.collateralToken.toLowerCase();
        collToken = this.props.tokens[fakeID].symbol;
        let realID = this.props.tokens[fakeID].realID;
        collDollars = collateral*this.props.tokens[fakeID].price;
      }

      let loan = '';
      let loanToken = 'NO LOAN';
      let loanDollars = 0;
      if(this.state.owedToken != ''){
        loan = this.state.userOwed;
        const fakeID= this.state.owedToken.toLowerCase();
        loanToken = this.props.tokens[fakeID].symbol;
        let realID = this.props.tokens[fakeID].realID;
        loanDollars = loan*this.props.tokens[fakeID].price;
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
              <div className="deposit-value">${depositDollars.toFixed(2)}</div>
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
              <div className="deposit-value">${collDollars.toFixed(2)}</div>
              <div className="deposit-token">{collateral} {collToken}</div>
            </Col>
          </Row>
          <Row>
            <Col sm={4}>
              <div className="action-name">Owed:</div>
            </Col>
            <Col sm={8} >
              <div className="deposit-value">${loanDollars.toFixed(2)}</div>
              <div className="deposit-token">{loan} {loanToken}</div>
            </Col>
          </Row>

        </Container>
        </div>
        </div>
      );
    }else{
      return(<div>Loading</div>);
    }

  }
}
export default Balance;
