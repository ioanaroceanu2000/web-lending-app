import React, {Component} from 'react';
import './Balance.css';
import PriceUpdate from './price_update';
import Web3 from 'web3';
import {Container, Row, Col, Navbar} from 'react-bootstrap';
import logo from './logo.png';
import {LiquidityPool_ABI, LiquidityPool_ADD, Exchange_ADD, Exchange_ABI, ERC20_ABI, Token_ABI, Token_BYTECODE } from './abis/abi'
import {loadWeb3, getAccount, getUserDeposit, getUserLoanDetails} from './utils.js';


class Balance extends Component {

  constructor(props) {
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
    };
  }

  componentWillMount(){
    this.leadBlockchainData();
  }

  async leadBlockchainData(){
    const web3 = await loadWeb3();
    const account = await getAccount(web3);

    //initialise instance of LP contract
    const lpinstance = new web3.eth.Contract(LiquidityPool_ABI, LiquidityPool_ADD);
    this.setState({liquidityPool: lpinstance, userAddress: account});

    /*const [depositValue, depFakeTokenID] = await getUserDeposit(web3,this.state.userAddress, this.state.liquidityPool);
    const [collateral, collFakeTokenID, owed, borrFakeTokenID] = await getUserLoanDetails(web3,this.state.userAddress, this.state.liquidityPool);
    this.setState({userDeposit: depositValue, userCollateral: collateral, userOwed: owed});*/
  }

  render() {
    return (
      <div className="container">

      <div className="box">
      <Container className="container">
        <Row className="rows">
          <Col sm={4}>
            <div className="action-name">Deposit:</div>
          </Col>
          <Col sm={8} >
            <div className="deposit-value">$30000</div>
            <div className="deposit-token">34 ETH</div>
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
            <div className="deposit-value">$10000</div>
            <div className="deposit-token">34 ETH</div>
          </Col>
        </Row>
        <Row>
          <Col sm={4}>
            <div className="action-name">Owed:</div>
          </Col>
          <Col sm={8} >
            <div className="deposit-value">$103</div>
            <div className="deposit-token">100 DAI</div>
          </Col>
        </Row>

      </Container>
      </div>
      </div>
    );
  }
}
export default Balance;
